import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { HyperliquidWSClient } from '../services/hyperliquid/hyperliquid.client.js';
import { HyperliquidParser } from '../services/hyperliquid/hyperliquid.parser.js';
import { HyperliquidStorage } from '../services/hyperliquid/hyperliquid.storage.js';
import { HyperPositionEvent } from '../services/hyperliquid/types.js';

export const HYPERLIQUID_EVENTS_PUBSUB = 'pubsub:hyperliquid_events';

export class HyperliquidTrackerWorker {
  private hlClient: HyperliquidWSClient;
  private userPositionState: Map<string, number> = new Map(); // key: "address:coin" -> size

  constructor() {
    this.hlClient = new HyperliquidWSClient();
  }

  async start(): Promise<void> {
    logger.info('⚙️ Starting HyperliquidTrackerWorker...');

    this.hlClient.addListener((msg) => this.handleStreamMessage(msg));
    this.hlClient.connect();
  }

  stop(): void {
    logger.info('⏹️ Stopping HyperliquidTrackerWorker...');
    this.hlClient.disconnect();
  }

  /**
   * Process raw messages from Hyperliquid WS
   */
  private async handleStreamMessage(msg: any): Promise<void> {
    try {
      // Process User Fills & Position State Updates
      if (msg.channel === 'userFills' && msg.data?.fills) {
        for (const fill of msg.data.fills) {
          await this.processFill(fill, msg.data.user);
        }
      }
    } catch (error) {
      logger.error('Error handling Hyperliquid stream message:', error);
    }
  }

  public async processPositionUpdate(params: {
    userAddress: string;
    coin: string;
    prevSize: number;
    currSize: number;
    entryPrice: number;
    markPrice: number;
    liquidationPrice: number | null;
    unrealizedPnl: number;
    closedPnl?: number;
    leverage: number;
    isLiquidation?: boolean;
    txHash?: string;
  }): Promise<HyperPositionEvent | null> {
    const marketContext = this.hlClient.getMarketContext(params.coin);
    const eventId = `hl_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

    const event = HyperliquidParser.constructPositionEvent({
      id: eventId,
      userAddress: params.userAddress,
      coin: params.coin,
      prevSize: params.prevSize,
      currSize: params.currSize,
      entryPrice: params.entryPrice,
      markPrice: params.markPrice,
      liquidationPrice: params.liquidationPrice,
      unrealizedPnl: params.unrealizedPnl,
      closedPnl: params.closedPnl,
      leverage: params.leverage,
      isLiquidation: params.isLiquidation,
      txHash: params.txHash,
      marketContext,
    });

    if (!event) return null;

    // 1. Store in PostgreSQL DB
    await HyperliquidStorage.upsertPosition(event);

    // 2. Broadcast via Redis Pub/Sub
    await redis.publish(HYPERLIQUID_EVENTS_PUBSUB, JSON.stringify(event));

    return event;
  }

  private async processFill(fill: any, userAddress: string): Promise<void> {
    const coin = fill.coin;
    const px = parseFloat(fill.px);
    const sz = parseFloat(fill.sz);
    const usdValue = px * sz;
    const fee = parseFloat(fill.fee || '0');
    const side = fill.side === 'B' ? 'BUY' : 'SELL';

    // Record trade fill
    await HyperliquidStorage.recordTrade({
      userAddress,
      coin,
      side: side as any,
      price: px,
      size: sz,
      usdValue,
      fee,
      tradeTimestamp: new Date(fill.time),
      hash: fill.hash || `fill_${fill.tid}`,
    });

    // Update active position tracking
    const stateKey = `${userAddress.toLowerCase()}:${coin}`;
    const prevSize = this.userPositionState.get(stateKey) || 0;
    const sizeDelta = side === 'BUY' ? sz : -sz;
    const currSize = prevSize + sizeDelta;

    this.userPositionState.set(stateKey, currSize);

    await this.processPositionUpdate({
      userAddress,
      coin,
      prevSize,
      currSize,
      entryPrice: px,
      markPrice: px,
      liquidationPrice: fill.liquidationPrice ? parseFloat(fill.liquidationPrice) : null,
      unrealizedPnl: parseFloat(fill.closedPnl || '0'),
      closedPnl: parseFloat(fill.closedPnl || '0'),
      leverage: 10,
      txHash: fill.hash,
    });
  }
}
