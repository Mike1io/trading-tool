import { redis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { DispatchNotificationPayload } from './types.js';

export const ALERT_DELIVERY_STREAM = 'stream:alert_delivery';
const CONSUMER_GROUP = 'group:notification_dispatcher';
const CONSUMER_NAME = `dispatcher_${process.pid}`;

export class NotificationDispatcher {
  private isRunning = false;

  async start(): Promise<void> {
    this.isRunning = true;
    logger.info(`⚙️ Starting NotificationDispatcher [${CONSUMER_NAME}]...`);

    try {
      await redis.xgroup('CREATE', ALERT_DELIVERY_STREAM, CONSUMER_GROUP, '0', 'MKSTREAM');
      logger.info(`Created Redis Stream Consumer Group: ${CONSUMER_GROUP}`);
    } catch (err: any) {
      if (!err?.message?.includes('BUSYGROUP')) {
        logger.error('Error creating consumer group for alert delivery:', err);
      }
    }

    this.pollLoop();
  }

  stop(): void {
    this.isRunning = false;
    logger.info(`⏹️ Stopping NotificationDispatcher [${CONSUMER_NAME}]...`);
  }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const results = (await (redis as any).xreadgroup(
          'GROUP',
          CONSUMER_GROUP,
          CONSUMER_NAME,
          'BLOCK',
          2000,
          'COUNT',
          20,
          'STREAMS',
          ALERT_DELIVERY_STREAM,
          '>'
        )) as any;

        if (results && results.length > 0) {
          for (const [streamName, messages] of results) {
            for (const [messageId, fields] of messages) {
              await this.processDeliveryMessage(messageId, fields);
            }
          }
        }
      } catch (error) {
        logger.error('Error in NotificationDispatcher poll loop:', error);
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }

  private async processDeliveryMessage(messageId: string, fields: string[]): Promise<void> {
    try {
      const rawData: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        rawData[fields[i]] = fields[i + 1];
      }

      const payload: DispatchNotificationPayload = JSON.parse(rawData.payload);

      // Dispatch to each specified channel concurrently
      await Promise.all(
        payload.channels.map((channel) => this.dispatchToChannel(channel, payload))
      );

      await redis.xack(ALERT_DELIVERY_STREAM, CONSUMER_GROUP, messageId);
    } catch (error) {
      logger.error(`❌ Failed to process notification delivery ${messageId}:`, error);
    }
  }

  private async dispatchToChannel(
    channel: string,
    payload: DispatchNotificationPayload
  ): Promise<void> {
    switch (channel) {
      case 'TELEGRAM':
        await this.sendTelegram(payload);
        break;
      case 'DISCORD':
        await this.sendDiscord(payload);
        break;
      case 'EMAIL':
        await this.sendEmail(payload);
        break;
      case 'WEB_PUSH':
        await this.sendWebPush(payload);
        break;
      case 'MOBILE_PUSH':
        await this.sendMobilePush(payload);
        break;
      default:
        logger.warn(`Unknown notification channel: ${channel}`);
    }
  }

  // --- 1. TELEGRAM DISPATCHER ---
  private async sendTelegram(payload: DispatchNotificationPayload): Promise<void> {
    const chatId = payload.userSettings?.telegramChatId;
    if (!chatId) {
      logger.debug(`Skipping Telegram dispatch for user ${payload.userId}: No chatId configured.`);
      return;
    }

    const messageText = `🚨 *${payload.title}*\n\n${payload.message}\n\n_Rule: ${payload.ruleName}_`;
    logger.info(`📱 [TELEGRAM DISPATCH] -> ChatID: ${chatId} | ${payload.title}`);
    // In production: fetch('https://api.telegram.org/bot<TOKEN>/sendMessage', { body: JSON.stringify({ chat_id: chatId, text: messageText, parse_mode: 'Markdown' }) })
  }

  // --- 2. DISCORD WEBHOOK DISPATCHER ---
  private async sendDiscord(payload: DispatchNotificationPayload): Promise<void> {
    const webhookUrl = payload.userSettings?.discordWebhookUrl;
    if (!webhookUrl) {
      logger.debug(`Skipping Discord dispatch for user ${payload.userId}: No webhook URL configured.`);
      return;
    }

    const embed = {
      title: `🚨 ${payload.title}`,
      description: payload.message,
      color: 0xff0044,
      fields: [
        { name: 'Rule Name', value: payload.ruleName, inline: true },
        { name: 'Timestamp', value: new Date().toISOString(), inline: true },
      ],
    };

    logger.info(`🎮 [DISCORD DISPATCH] -> Webhook: ${webhookUrl} | ${payload.title}`);
    // In production: fetch(webhookUrl, { method: 'POST', body: JSON.stringify({ embeds: [embed] }) })
  }

  // --- 3. EMAIL DISPATCHER ---
  private async sendEmail(payload: DispatchNotificationPayload): Promise<void> {
    const email = payload.userSettings?.email;
    logger.info(`📧 [EMAIL DISPATCH] -> Email: ${email || 'user@domain.com'} | Subject: ${payload.title}`);
    // In production: send via SendGrid / Nodemailer SMTP
  }

  // --- 4. WEB PUSH DISPATCHER ---
  private async sendWebPush(payload: DispatchNotificationPayload): Promise<void> {
    logger.info(`🌐 [WEB PUSH DISPATCH] -> User: ${payload.userId} | ${payload.title}`);
    // In production: webpush.sendNotification(subscription, JSON.stringify(payload))
  }

  // --- 5. MOBILE PUSH DISPATCHER ---
  private async sendMobilePush(payload: DispatchNotificationPayload): Promise<void> {
    logger.info(`📲 [MOBILE PUSH DISPATCH] -> User: ${payload.userId} | ${payload.title}`);
    // In production: admin.messaging().send(fcmPayload)
  }
}
