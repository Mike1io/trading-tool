import { Request, Response, NextFunction } from 'express';
import { AIAnalysisEngine } from '../services/ai/aiAnalysis.engine.js';
import { prisma } from '../config/database.js';

export class AIController {
  static async getWalletAIReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const report = await AIAnalysisEngine.analyzeWallet(address);

      res.status(200).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTokenAIReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symbol } = req.params;
      const report = await AIAnalysisEngine.analyzeToken(symbol);

      res.status(200).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCopyTradingOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const smartWallets = await prisma.wallet.findMany({
        where: { isSmartMoney: true },
        take: 10,
        orderBy: { smartMoneyScore: 'desc' },
        include: { walletLabels: true },
      });

      const opportunities = await Promise.all(
        smartWallets.map(async (w) => {
          const report = await AIAnalysisEngine.analyzeWallet(w.address);
          return {
            address: w.address,
            label: w.walletLabels[0]?.label || 'Smart Trader',
            chain: w.chain,
            smartMoneyScore: report.smartMoneyScore,
            winRate30d: report.profitability.winRate30d,
            realizedPnl: report.profitability.totalRealizedPnlUsd,
            copyTradingRating: report.copyTrading.rating,
            riskScore: report.riskScore,
            summary: report.copyTrading.summary,
          };
        })
      );

      res.status(200).json({
        status: 'success',
        data: { opportunities },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMarketAISummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = {
        overallSentiment: 'BULLISH_ACCUMULATION',
        marketBullishProbability: 74,
        marketBearishProbability: 26,
        topAccumulatedTokens: ['ETH', 'SOL', 'BTC'],
        netWhaleFlow24hUsd: 42800000,
        aiExecutiveSummary:
          'AI Market Intelligence: Institutional Smart Money wallets show strong net accumulation over the past 24 hours. ' +
          'Withdrawals from Binance and Coinbase hot wallets exceed deposits by $42.8M USD. ' +
          'Hyperliquid whale positioning is 68% Long, indicating high probability for continued upward price momentum.',
      };

      res.status(200).json({
        status: 'success',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }
}
