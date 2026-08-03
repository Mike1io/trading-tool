export type CopyTradingRating = 'A+' | 'A' | 'B' | 'C' | 'D';

export interface WalletProfitabilityMetrics {
  totalRealizedPnlUsd: number;
  totalUnrealizedPnlUsd: number;
  roiPercentage: number;
  winRate30d: number;
  totalTradesCount: number;
  avgHoldingTimeHours: number;
  maxDrawdownPercentage: number;
}

export interface AIWalletAnalysisReport {
  address: string;
  chain: string;
  primaryLabel?: string;
  smartMoneyScore: number; // 0 to 100
  profitability: WalletProfitabilityMetrics;
  copyTrading: {
    rating: CopyTradingRating;
    score: number;
    recommendedAllocationUsd: number;
    maxSlippageRisk: string;
    summary: string;
  };
  behavior: {
    phase: 'ACCUMULATION' | 'DISTRIBUTION' | 'HOLDING' | 'LIQUIDATED';
    accumulationIndex: number; // -1.0 to +1.0
    topAccumulatedToken?: string;
    recentActivityCount: number;
  };
  sentimentProbabilities: {
    bullishProbability: number; // 0% to 100%
    bearishProbability: number; // 0% to 100%
  };
  riskScore: number; // 1 to 10
  aiSummary: string; // Generated AI Executive Summary
  keyInsights: string[];
  riskWarnings: string[];
}

export interface AITokenAnalysisReport {
  tokenSymbol: string;
  tokenAddress: string;
  chain: string;
  accumulationIndex: number; // -1.0 to +1.0
  smartMoneyHoldersCount: number;
  whaleNetFlow24hUsd: number;
  bullishProbability: number;
  bearishProbability: number;
  aiSummary: string;
}
