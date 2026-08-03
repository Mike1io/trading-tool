import { redis } from '../../config/redis.js';
import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { TRANSFER_EVENTS_PUBSUB, EnrichedTransferEvent } from '../../workers/walletTracker.worker.js';
import { HYPERLIQUID_EVENTS_PUBSUB } from '../../workers/hyperliquidTracker.worker.js';
import { HyperPositionEvent } from '../hyperliquid/types.js';
import { ALERT_DELIVERY_STREAM } from './notificationDispatcher.js';
import { DispatchNotificationPayload, NotificationChannel } from './types.js';

export class AlertEvaluatorEngine {
  private subRedis: any = null;

  async start(): Promise<void> {
    logger.info('⚙️ Starting AlertEvaluatorEngine...');

    this.subRedis = new (redis.constructor as any)({
      host: redis.options.host,
      port: redis.options.port,
      password: redis.options.password,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });

    this.subRedis.on('error', () => {
      // Suppress unhandled redis pubsub errors when offline
    });

    this.subRedis.subscribe(TRANSFER_EVENTS_PUBSUB, HYPERLIQUID_EVENTS_PUBSUB, (err: any) => {
      if (err) {
        logger.error('❌ AlertEvaluatorEngine failed to subscribe to PubSub:', err);
      } else {
        logger.info('📡 AlertEvaluatorEngine listening for transfer & Hyperliquid streams');
      }
    });

    this.subRedis.on('message', async (channel: string, message: string) => {
      try {
        if (channel === TRANSFER_EVENTS_PUBSUB) {
          const event: EnrichedTransferEvent = JSON.parse(message);
          await this.evaluateTransferEvent(event);
        } else if (channel === HYPERLIQUID_EVENTS_PUBSUB) {
          const event: HyperPositionEvent = JSON.parse(message);
          await this.evaluateHyperliquidEvent(event);
        }
      } catch (error) {
        logger.error('Error evaluating event in AlertEvaluatorEngine:', error);
      }
    });
  }

  stop(): void {
    if (this.subRedis) {
      this.subRedis.quit();
    }
  }

  /**
   * Evaluate multi-chain transfer event against active user rules
   */
  private async evaluateTransferEvent(event: EnrichedTransferEvent): Promise<void> {
    // Query active rules matching transfer events
    const activeRules = await prisma.alert.findMany({
      where: {
        isActive: true,
        eventType: {
          in: ['TRANSFER', 'EXCHANGE_DEPOSIT', 'EXCHANGE_WITHDRAWAL'],
        },
      },
      include: {
        user: { include: { settings: true } },
      },
    });

    for (const rule of activeRules) {
      let isMatch = false;

      // 1. Threshold check
      const minUsd = Number(rule.minAmountUsd);
      if (event.amountUsd < minUsd) continue;

      // 2. Event type check
      if (rule.eventType === 'EXCHANGE_DEPOSIT' && !event.isExchangeDeposit) continue;
      if (rule.eventType === 'EXCHANGE_WITHDRAWAL' && !event.isExchangeWithdrawal) continue;

      // 3. Target address filter (if configured)
      if (rule.targetAddress) {
        const targetLower = rule.targetAddress.toLowerCase();
        if (
          event.fromAddress.toLowerCase() !== targetLower &&
          event.toAddress.toLowerCase() !== targetLower
        ) {
          continue;
        }
      }

      isMatch = true;

      if (isMatch) {
        await this.triggerAlertNotification(rule, {
          title: `Large Transfer Alert (${event.chain})`,
          message: `${event.fromLabel || event.fromAddress.substring(0, 8)} -> ${event.toLabel || event.toAddress.substring(0, 8)}: $${event.amountUsd.toLocaleString()} USD (${event.rawAmount} ${event.tokenSymbol})`,
          eventData: event,
        });
      }
    }
  }

  /**
   * Evaluate Hyperliquid position event against active user rules
   */
  private async evaluateHyperliquidEvent(event: HyperPositionEvent): Promise<void> {
    const activeRules = await prisma.alert.findMany({
      where: {
        isActive: true,
        eventType: 'HYPER_POSITION',
      },
      include: {
        user: { include: { settings: true } },
      },
    });

    for (const rule of activeRules) {
      const minUsd = Number(rule.minAmountUsd);
      const positionUsdValue = event.positionSize * event.markPrice;

      if (positionUsdValue < minUsd) continue;

      if (rule.targetAddress) {
        if (event.userAddress.toLowerCase() !== rule.targetAddress.toLowerCase()) {
          continue;
        }
      }

      await this.triggerAlertNotification(rule, {
        title: `Hyperliquid Whale Alert (${event.eventType})`,
        message: `Whale Trader ${event.userAddress.substring(0, 8)} ${event.eventType} on ${event.coin}: Position Value $${positionUsdValue.toLocaleString()} USD (${event.side} ${event.leverage}x)`,
        eventData: event,
      });
    }
  }

  /**
   * Record notification in PostgreSQL & push delivery payload to Redis Stream
   */
  private async triggerAlertNotification(
    rule: any,
    details: { title: string; message: string; eventData: any }
  ): Promise<void> {
    // 1. Create Notification record in PostgreSQL
    await prisma.notification.create({
      data: {
        userId: rule.userId,
        alertId: rule.id,
        title: details.title,
        message: details.message,
        payload: details.eventData,
      },
    });

    const channels: NotificationChannel[] = Array.isArray(rule.channels)
      ? (rule.channels as unknown as NotificationChannel[])
      : ['WEBSOCKET' as NotificationChannel];

    const deliveryPayload: DispatchNotificationPayload = {
      userId: rule.userId,
      alertId: rule.id,
      ruleName: rule.name,
      title: details.title,
      message: details.message,
      channels,
      eventData: details.eventData,
      userSettings: {
        telegramChatId: rule.user.settings?.telegramChatId || undefined,
        discordWebhookUrl: rule.user.settings?.discordWebhookUrl || undefined,
        email: rule.user.email,
      },
    };

    // 2. Publish to Redis Stream stream:alert_delivery
    await redis.xadd(
      ALERT_DELIVERY_STREAM,
      '*',
      'payload',
      JSON.stringify(deliveryPayload)
    );

    logger.info(`🚨 Alert Triggered! Rule "${rule.name}" for User ${rule.userId}`);
  }
}
