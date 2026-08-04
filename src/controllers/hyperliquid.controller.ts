import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { PositionSide } from '@prisma/client';
import { HyperliquidTrackerWorker } from '../workers/hyperliquidTracker.worker.js';

// Singleton instance reference for testing mock events
let hlWorkerInstance: HyperliquidTrackerWorker | null = null;

export function setHyperliquidWorkerInstance(worker: HyperliquidTrackerWorker) {
  hlWorkerInstance = worker;
}

export class HyperliquidController {
  static async getPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const coin = req.query.coin as string | undefined;
      const side = req.query.side as PositionSide | undefined;
      const isWhale = req.query.isWhale ? req.query.isWhale === 'true' : undefined;
      const address = req.query.address as string | undefined;

      const where: any = {};
      if (coin) where.coin = coin;
      if (side) where.side = side;
      if (isWhale !== undefined) where.isWhale = isWhale;
      if (address) where.userAddress = { equals: address, mode: 'insensitive' };

      const [positions, total] = await Promise.all([
        prisma.hyperPosition.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            wallet: { include: { walletLabels: true } },
          },
        }),
        prisma.hyperPosition.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          positions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const coin = req.query.coin as string | undefined;
      const address = req.query.address as string | undefined;

      const where: any = {};
      if (coin) where.coin = coin;
      if (address) where.userAddress = { equals: address, mode: 'insensitive' };

      const [trades, total] = await Promise.all([
        prisma.hyperTrade.findMany({
          where,
          skip,
          take: limit,
          orderBy: { tradeTimestamp: 'desc' },
          include: {
            wallet: { include: { walletLabels: true } },
          },
        }),
        prisma.hyperTrade.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          trades,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMarketSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [totalActivePositions, whalePositionsCount, topCoins] = await Promise.all([
        prisma.hyperPosition.count(),
        prisma.hyperPosition.count({ where: { isWhale: true } }),
        prisma.hyperPosition.groupBy({
          by: ['coin'],
          _count: { _all: true },
          _sum: { unrealizedPnl: true },
          orderBy: { _count: { coin: 'desc' } },
          take: 5,
        }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          totalActivePositions,
          whalePositionsCount,
          topCoinsSummary: topCoins,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWhales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const [whales, total] = await Promise.all([
        prisma.hyperWhale.findMany({
          where: { isWhale: true },
          skip,
          take: limit,
          orderBy: { maxPositionSizeUsd: 'desc' },
        }),
        prisma.hyperWhale.count({ where: { isWhale: true } }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          whales,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async ingestMockHyperEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        userAddress = '0x10b7f8c279c6563b769f3d9ce459954a2a1975e5',
        coin = 'ETH',
        prevSize = 0,
        currSize = 100,
        entryPrice = 3000,
        markPrice = 3050,
        leverage = 20,
        isLiquidation = false,
      } = req.body;

      if (!hlWorkerInstance) {
        res.status(500).json({ status: 'error', message: 'Hyperliquid worker not initialized' });
        return;
      }

      const event = await hlWorkerInstance.processPositionUpdate({
        userAddress,
        coin,
        prevSize: Number(prevSize),
        currSize: Number(currSize),
        entryPrice: Number(entryPrice),
        markPrice: Number(markPrice),
        liquidationPrice: Number(entryPrice) * 0.95,
        unrealizedPnl: (Number(markPrice) - Number(entryPrice)) * Number(currSize),
        leverage: Number(leverage),
        isLiquidation: Boolean(isLiquidation),
      });

      res.status(201).json({
        status: 'success',
        message: 'Live Hyperliquid event processed',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }
}
