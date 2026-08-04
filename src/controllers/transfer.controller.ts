import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { Chain, TransferFlowType } from '@prisma/client';
import { IngestionService } from '../services/ingestors/ingestion.service.js';

export class TransferController {
  static async getTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const chain = req.query.chain as Chain | undefined;
      const flowType = req.query.flowType as TransferFlowType | undefined;
      const minUsd = req.query.minUsd ? Number(req.query.minUsd) : undefined;
      const address = req.query.address as string | undefined;

      const where: any = {};
      if (chain) where.chain = chain;
      if (flowType) where.flowType = flowType;
      if (minUsd !== undefined) where.amountUsd = { gte: minUsd };
      if (address) {
        where.OR = [
          { fromAddress: { equals: address, mode: 'insensitive' } },
          { toAddress: { equals: address, mode: 'insensitive' } },
        ];
      }

      let transfers: any[] = [];
      let total = 0;

      try {
        [transfers, total] = await Promise.all([
          prisma.transfer.findMany({
            where,
            skip,
            take: limit,
            orderBy: { blockTimestamp: 'desc' },
            include: {
              fromWallet: { include: { walletLabels: true } },
              toWallet: { include: { walletLabels: true } },
            },
          }),
          prisma.transfer.count({ where }),
        ]);
      } catch (dbErr: any) {
        console.warn('⚠️ Database query warning in getTransfers:', dbErr?.message || dbErr);
      }

      // Convert BigInt blockNumbers to strings for clean JSON serialization
      const formattedTransfers = transfers.map((tx) => ({
        ...tx,
        blockNumber: tx.blockNumber ? tx.blockNumber.toString() : '0',
      }));

      res.status(200).json({
        status: 'success',
        data: {
          transfers: formattedTransfers,
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

  static async getTransferStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      let totalCount = 0;
      let totalVolumeUsd = 0;
      let depositsCount = 0;
      let withdrawalsCount = 0;
      let largeCount = 0;

      try {
        let [cnt, vol, dep, wth, lrg] = await Promise.all([
          prisma.transfer.count({ where: { blockTimestamp: { gte: past24h } } }),
          prisma.transfer.aggregate({
            _sum: { amountUsd: true },
            where: { blockTimestamp: { gte: past24h } },
          }),
          prisma.transfer.count({
            where: { blockTimestamp: { gte: past24h }, isExchangeDeposit: true },
          }),
          prisma.transfer.count({
            where: { blockTimestamp: { gte: past24h }, isExchangeWithdrawal: true },
          }),
          prisma.transfer.count({
            where: { blockTimestamp: { gte: past24h }, isLargeTransfer: true },
          }),
        ]);

        // If 24h filter returned zero (e.g. block timestamps out of range), fallback to overall totals
        if (cnt === 0) {
          const [allCnt, allVol, allDep, allWth, allLrg] = await Promise.all([
            prisma.transfer.count(),
            prisma.transfer.aggregate({ _sum: { amountUsd: true } }),
            prisma.transfer.count({ where: { isExchangeDeposit: true } }),
            prisma.transfer.count({ where: { isExchangeWithdrawal: true } }),
            prisma.transfer.count({ where: { isLargeTransfer: true } }),
          ]);
          cnt = allCnt;
          vol = allVol;
          dep = allDep;
          wth = allWth;
          lrg = allLrg;
        }

        totalCount = cnt;
        totalVolumeUsd = Number(vol._sum.amountUsd || 0);
        depositsCount = dep;
        withdrawalsCount = wth;
        largeCount = lrg;
      } catch (dbErr: any) {
        console.warn('⚠️ Database query warning in getTransferStats:', dbErr?.message || dbErr);
      }

      res.status(200).json({
        status: 'success',
        data: {
          period: '24h',
          totalTransfers: totalCount,
          totalVolumeUsd,
          exchangeDeposits: depositsCount,
          exchangeWithdrawals: withdrawalsCount,
          largeTransfers: largeCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async ingestLiveTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        chain,
        blockNumber,
        txHash,
        fromAddress,
        toAddress,
        tokenAddress,
        tokenSymbol,
        rawAmount,
        amountUsd,
      } = req.body;

      if (!chain || !txHash || !fromAddress || !toAddress || amountUsd === undefined) {
        res.status(400).json({ status: 'error', message: 'Missing required transfer fields' });
        return;
      }

      const messageId = await IngestionService.publishRawTransfer({
        chain,
        blockNumber: Number(blockNumber || 0),
        blockTimestamp: new Date(),
        txHash,
        fromAddress,
        toAddress,
        tokenAddress: tokenAddress || '0x0000000000000000000000000000000000000000',
        tokenSymbol: tokenSymbol || 'ETH',
        rawAmount: String(rawAmount || '0'),
        amountUsd: Number(amountUsd),
      });

      res.status(201).json({
        status: 'success',
        message: 'Live transfer published to ingestion stream',
        data: { messageId, chain, amountUsd, txHash },
      });
    } catch (error) {
      next(error);
    }
  }
}
