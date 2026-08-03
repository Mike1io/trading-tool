import { PositionSide, OrderSide } from '@prisma/client';
import {
  HyperEventType,
  HyperPositionEvent,
  MarketAssetContext,
} from './types.js';

export class HyperliquidParser {
  private static WHALE_THRESHOLD_USD = 250000; // $250k USD

  /**
   * Classify position transition state changes based on previous and current size
   */
  static classifyPositionChange(
    prevSize: number,
    currSize: number,
    isLiquidation = false
  ): { eventType: HyperEventType; side: PositionSide } | null {
    if (isLiquidation) {
      const side = prevSize >= 0 ? PositionSide.LONG : PositionSide.SHORT;
      return { eventType: 'LIQUIDATION', side };
    }

    // Position opened from 0
    if (prevSize === 0 && currSize > 0) {
      return { eventType: 'OPEN_LONG', side: PositionSide.LONG };
    }
    if (prevSize === 0 && currSize < 0) {
      return { eventType: 'OPEN_SHORT', side: PositionSide.SHORT };
    }

    // Position closed to 0
    if (prevSize !== 0 && currSize === 0) {
      const side = prevSize > 0 ? PositionSide.LONG : PositionSide.SHORT;
      return { eventType: 'CLOSE_POSITION', side };
    }

    // Long Position modified
    if (prevSize > 0 && currSize > 0) {
      return {
        eventType: currSize > prevSize ? 'INCREASE_POSITION' : 'REDUCE_POSITION',
        side: PositionSide.LONG,
      };
    }

    // Short Position modified
    if (prevSize < 0 && currSize < 0) {
      const prevAbs = Math.abs(prevSize);
      const currAbs = Math.abs(currSize);
      return {
        eventType: currAbs > prevAbs ? 'INCREASE_POSITION' : 'REDUCE_POSITION',
        side: PositionSide.SHORT,
      };
    }

    // Flip position from Long to Short or Short to Long
    if ((prevSize > 0 && currSize < 0) || (prevSize < 0 && currSize > 0)) {
      return {
        eventType: currSize > 0 ? 'OPEN_LONG' : 'OPEN_SHORT',
        side: currSize > 0 ? PositionSide.LONG : PositionSide.SHORT,
      };
    }

    return null;
  }

  static constructPositionEvent(params: {
    id: string;
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
    marketContext?: MarketAssetContext;
  }): HyperPositionEvent | null {
    const classification = this.classifyPositionChange(
      params.prevSize,
      params.currSize,
      params.isLiquidation
    );

    if (!classification) return null;

    const absoluteSize = Math.abs(params.currSize);
    const positionUsdValue = absoluteSize * params.markPrice;
    const isWhale = positionUsdValue >= this.WHALE_THRESHOLD_USD;

    return {
      id: params.id,
      userAddress: params.userAddress.toLowerCase(),
      coin: params.coin,
      eventType: classification.eventType,
      side: classification.side,
      positionSize: absoluteSize,
      sizeChange: Math.abs(params.currSize - params.prevSize),
      entryPrice: params.entryPrice,
      markPrice: params.markPrice,
      liquidationPrice: params.liquidationPrice,
      unrealizedPnl: params.unrealizedPnl,
      closedPnl: params.closedPnl,
      leverage: params.leverage,
      openInterest: params.marketContext?.openInterest,
      fundingRate: params.marketContext?.fundingRate,
      isWhale,
      timestamp: new Date().toISOString(),
      txHash: params.txHash,
    };
  }
}
