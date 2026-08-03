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

      const [transfers, total] = await Promise.all([
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

      // Convert BigInt blockNumbers to strings for clean JSON serialization
      const formattedTransfers = transfers.map((tx) => ({
        ...tx,
        blockNumber: tx.blockNumber.toString(),
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

      const [totalCount, totalVolume, depositsCount, withdrawalsCount, largeCount] = await Promise.all([
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

      res.status(200).json({
        status: 'success',
        data: {
          period: '24h',
          totalTransfers: totalCount,
          totalVolumeUsd: totalVolume._sum.amountUsd || 0,
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
