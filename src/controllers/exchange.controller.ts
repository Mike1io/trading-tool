import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { Chain } from '@prisma/client';
import { ExchangeDetectionEngine } from '../services/exchange/exchangeDetection.engine.js';

export class ExchangeController {
  static async getExchanges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exchanges = await prisma.exchangeLabel.groupBy({
        by: ['exchangeName'],
        _count: { _all: true },
      });

      const supportedExchanges = [
        'Binance',
        'Bybit',
        'OKX',
        'Bitget',
        'Gate',
        'MEXC',
        'Kraken',
        'Coinbase',
        'Kucoin',
      ];

      const data = supportedExchanges.map((name) => {
        const found = exchanges.find((e) => e.exchangeName.toLowerCase() === name.toLowerCase());
        return {
          exchangeName: name,
          trackedWalletsCount: found ? found._count._all : 0,
        };
      });

      res.status(200).json({
        status: 'success',
        data: { exchanges: data },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getExchangeWallets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exchangeName = req.query.exchange as string | undefined;
      const chain = req.query.chain as Chain | undefined;

      const where: any = {};
      if (exchangeName) where.exchangeName = { equals: exchangeName, mode: 'insensitive' };
      if (chain) where.chain = chain;

      const wallets = await prisma.exchangeLabel.findMany({
        where,
        orderBy: { exchangeName: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        data: { wallets },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getExchangeFlows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const chain = req.query.chain as Chain | undefined;

      const where: any = { blockTimestamp: { gte: past24h } };
      if (chain) where.chain = chain;

      const [deposits, withdrawals] = await Promise.all([
        prisma.transfer.aggregate({
          where: { ...where, isExchangeDeposit: true },
          _count: { _all: true },
          _sum: { amountUsd: true },
        }),
        prisma.transfer.aggregate({
          where: { ...where, isExchangeWithdrawal: true },
          _count: { _all: true },
          _sum: { amountUsd: true },
        }),
      ]);

      const depositVolume = deposits._sum.amountUsd || 0;
      const withdrawalVolume = withdrawals._sum.amountUsd || 0;

      res.status(200).json({
        status: 'success',
        data: {
          period: '24h',
          deposits: {
            count: deposits._count._all,
            volumeUsd: depositVolume,
          },
          withdrawals: {
            count: withdrawals._count._all,
            volumeUsd: withdrawalVolume,
          },
          netFlowUsd: Number(depositVolume) - Number(withdrawalVolume),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addExchangeWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { exchangeName, hotWalletAddress, chain, label } = req.body;

      if (!exchangeName || !hotWalletAddress || !chain) {
        res.status(400).json({
          status: 'error',
          message: 'exchangeName, hotWalletAddress, and chain are required',
        });
        return;
      }

      await ExchangeDetectionEngine.registerExchangeWallet(
        exchangeName,
        hotWalletAddress,
        chain,
        label
      );

      res.status(201).json({
        status: 'success',
        message: 'Exchange wallet registered and cached successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
