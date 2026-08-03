import { PositionSide, OrderSide } from '@prisma/client';

export type HyperEventType =
  | 'OPEN_LONG'
  | 'OPEN_SHORT'
  | 'INCREASE_POSITION'
  | 'REDUCE_POSITION'
  | 'CLOSE_POSITION'
  | 'LIQUIDATION';

export interface HyperliquidFill {
  coin: string;
  px: string;
  sz: string;
  side: 'B' | 'A'; // 'B' = Buy, 'A' = Sell
  time: number;
  hash: string;
  startPosition: string;
  dir: string;
  closedPnl: string;
  fee: string;
  tid: number;
}

export interface HyperliquidUserState {
  assetPositions: Array<{
    position: {
      coin: string;
      szi: string;
      entryPx: string;
      positionValue: string;
      returnOnEquity: string;
      unrealizedPnl: string;
      leverage: {
        type: string;
        value: number;
      };
      liquidationPx: string | null;
      marginUsed: string;
    };
  }>;
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
}

export interface MarketAssetContext {
  coin: string;
  markPrice: number;
  openInterest: number;
  fundingRate: number;
  premium: number;
  volume24h: number;
}

export interface HyperPositionEvent {
  id: string;
  userAddress: string;
  coin: string;
  eventType: HyperEventType;
  side: PositionSide;
  positionSize: number;
  sizeChange: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number | null;
  unrealizedPnl: number;
  closedPnl?: number;
  leverage: number;
  openInterest?: number;
  fundingRate?: number;
  isWhale: boolean;
  timestamp: string;
  txHash?: string;
}
