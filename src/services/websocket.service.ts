import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { TRANSFER_EVENTS_PUBSUB, EnrichedTransferEvent } from '../workers/walletTracker.worker.js';
import { HYPERLIQUID_EVENTS_PUBSUB } from '../workers/hyperliquidTracker.worker.js';
import { HyperPositionEvent } from './hyperliquid/types.js';

interface ClientConnection {
  ws: WebSocket;
  subscriptions: Set<string>;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<ClientConnection> = new Set();
  private subRedis: Redis | null = null;

  init(server: HTTPServer): void {
    this.wss = new WebSocketServer({ server, path: `${env.API_PREFIX}/ws` });
    logger.info(`🔌 WebSocket Gateway initialized at path: ${env.API_PREFIX}/ws`);

    // Setup Redis Pub/Sub Subscriber Client
    this.subRedis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
    });

    this.subRedis.subscribe(TRANSFER_EVENTS_PUBSUB, HYPERLIQUID_EVENTS_PUBSUB, (err) => {
      if (err) {
        logger.error('❌ Failed to subscribe to Redis PubSub channels:', err);
      } else {
        logger.info(`📡 Subscribed to PubSub channels: ${TRANSFER_EVENTS_PUBSUB}, ${HYPERLIQUID_EVENTS_PUBSUB}`);
      }
    });

    this.subRedis.on('message', (channel, message) => {
      try {
        if (channel === TRANSFER_EVENTS_PUBSUB) {
          const event: EnrichedTransferEvent = JSON.parse(message);
          this.broadcastTransferEvent(event);
        } else if (channel === HYPERLIQUID_EVENTS_PUBSUB) {
          const event: HyperPositionEvent = JSON.parse(message);
          this.broadcastHyperliquidEvent(event);
        }
      } catch (error) {
        logger.error(`Error parsing message on channel ${channel}:`, error);
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      const client: ClientConnection = {
        ws,
        subscriptions: new Set(['transfers:all', 'hyperliquid:all']),
      };

      this.clients.add(client);
      logger.info(`⚡ New WebSocket client connected. Active connections: ${this.clients.size}`);

      // Send initial welcome frame
      ws.send(
        JSON.stringify({
          type: 'CONNECTED',
          message: 'Connected to Crypto Intel Real-Time Stream',
          availableChannels: [
            'transfers:all',
            'transfers:ETHEREUM',
            'transfers:SOLANA',
            'transfers:BITCOIN',
            'transfers:TRON',
            'transfers:exchange_flows',
            'transfers:whales',
            'hyperliquid:all',
            'hyperliquid:positions',
            'hyperliquid:whales',
            'hyperliquid:liquidations',
            'hyperliquid:ETH',
            'hyperliquid:BTC',
            'hyperliquid:SOL',
          ],
        })
      );

      ws.on('message', (data: Buffer) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.action === 'subscribe' && Array.isArray(parsed.channels)) {
            parsed.channels.forEach((ch: string) => client.subscriptions.add(ch));
            ws.send(
              JSON.stringify({
                type: 'SUBSCRIBED',
                channels: Array.from(client.subscriptions),
              })
            );
          } else if (parsed.action === 'unsubscribe' && Array.isArray(parsed.channels)) {
            parsed.channels.forEach((ch: string) => client.subscriptions.delete(ch));
            ws.send(
              JSON.stringify({
                type: 'UNSUBSCRIBED',
                channels: Array.from(client.subscriptions),
              })
            );
          }
        } catch (e) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON frame' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(client);
        logger.info(`🔌 WebSocket client disconnected. Active connections: ${this.clients.size}`);
      });
    });
  }

  private broadcastTransferEvent(event: EnrichedTransferEvent): void {
    const payload = JSON.stringify({
      type: 'TRANSFER_EVENT',
      data: event,
    });

    for (const client of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;

      let shouldSend = false;

      if (client.subscriptions.has('transfers:all')) shouldSend = true;
      if (client.subscriptions.has(`transfers:${event.chain}`)) shouldSend = true;
      if (
        client.subscriptions.has('transfers:exchange_flows') &&
        (event.isExchangeDeposit || event.isExchangeWithdrawal)
      ) {
        shouldSend = true;
      }
      if (client.subscriptions.has('transfers:whales') && event.isLargeTransfer) {
        shouldSend = true;
      }
      if (
        client.subscriptions.has(`transfers:wallet:${event.fromAddress.toLowerCase()}`) ||
        client.subscriptions.has(`transfers:wallet:${event.toAddress.toLowerCase()}`)
      ) {
        shouldSend = true;
      }

      if (shouldSend) {
        client.ws.send(payload);
      }
    }
  }

  private broadcastHyperliquidEvent(event: HyperPositionEvent): void {
    const payload = JSON.stringify({
      type: 'HYPERLIQUID_EVENT',
      data: event,
    });

    for (const client of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;

      let shouldSend = false;

      if (client.subscriptions.has('hyperliquid:all')) shouldSend = true;
      if (client.subscriptions.has('hyperliquid:positions')) shouldSend = true;
      if (client.subscriptions.has('hyperliquid:whales') && event.isWhale) shouldSend = true;
      if (
        client.subscriptions.has('hyperliquid:liquidations') &&
        event.eventType === 'LIQUIDATION'
      ) {
        shouldSend = true;
      }
      if (client.subscriptions.has(`hyperliquid:${event.coin}`)) shouldSend = true;
      if (client.subscriptions.has(`hyperliquid:trader:${event.userAddress.toLowerCase()}`)) {
        shouldSend = true;
      }

      if (shouldSend) {
        client.ws.send(payload);
      }
    }
  }

  close(): void {
    if (this.subRedis) {
      this.subRedis.quit();
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const wsService = new WebSocketService();
