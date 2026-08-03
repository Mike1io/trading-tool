import WebSocket from 'ws';
import { logger } from '../../utils/logger.js';
import { MarketAssetContext } from './types.js';

export type HyperEventListener = (event: any) => void;

export class HyperliquidWSClient {
  private ws: WebSocket | null = null;
  private url = 'wss://api.hyperliquid.xyz/ws';
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private listeners: Set<HyperEventListener> = new Set();
  private marketContexts: Map<string, MarketAssetContext> = new Map();

  connect(): void {
    logger.info(`🔌 Connecting to Hyperliquid L1 WebSocket [${this.url}]...`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        this.isConnected = true;
        logger.info('⚡ Connected to Hyperliquid L1 WebSocket');

        // Subscribe to asset context updates (allMids, trades, and webData2)
        this.subscribe({ type: 'allMids' });
        this.subscribe({ type: 'trades', coin: 'BTC' });
        this.subscribe({ type: 'trades', coin: 'ETH' });
        this.subscribe({ type: 'trades', coin: 'SOL' });
        this.subscribe({ type: 'trades', coin: 'HYPE' });
        
        // Start keepalive heartbeat
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ method: 'ping' }));
          }
        }, 30000);
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(data.toString());
          this.handleMessage(parsed);
        } catch (err) {
          logger.error('Error parsing Hyperliquid WS message:', err);
        }
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        logger.warn('⚠️ Hyperliquid WebSocket disconnected. Reconnecting in 5s...');
        this.cleanup();
        setTimeout(() => this.connect(), 5000);
      });

      this.ws.on('error', (error) => {
        logger.error('❌ Hyperliquid WebSocket error:', error);
      });
    } catch (error) {
      logger.error('Failed to instantiate Hyperliquid WebSocket:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  subscribe(subscription: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          method: 'subscribe',
          subscription,
        })
      );
    }
  }

  addListener(listener: HyperEventListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: HyperEventListener): void {
    this.listeners.delete(listener);
  }

  getMarketContext(coin: string): MarketAssetContext | undefined {
    return this.marketContexts.get(coin);
  }

  private handleMessage(msg: any): void {
    if (msg.channel === 'allMids' && msg.data?.mids) {
      for (const [coin, priceStr] of Object.entries(msg.data.mids)) {
        const price = parseFloat(priceStr as string);
        const existing = this.marketContexts.get(coin) || {
          coin,
          markPrice: price,
          openInterest: 0,
          fundingRate: 0.0001, // default 0.01%
          premium: 0,
          volume24h: 0,
        };
        existing.markPrice = price;
        this.marketContexts.set(coin, existing);
      }
    }

    // Notify registered listeners
    for (const listener of this.listeners) {
      listener(msg);
    }
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.ws = null;
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
    }
  }
}
