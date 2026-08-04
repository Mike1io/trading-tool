import { prisma } from '../../config/database.js';
import { Prisma, PositionSide, OrderSide } from '@prisma/client';
import { HyperPositionEvent } from './types.js';
import { logger } from '../../utils/logger.js';

export class HyperliquidStorage {
  /**
   * Evaluates if a wallet qualifies as a Whale based on:
   * 1. Position size >= $250,000
   * 2. Cumulative volume >= $5,000,000
   * 3. Realized PnL >= $1,000,000
   */
  static async checkAndUpsertWhale(data: {
    userAddress: string;
    positionSizeUsd: number;
    tradeUsdValue?: number;
    closedPnl?: number;
  }): Promise<{ isWhale: boolean; reason?: string }> {
    try {
      const userAddr = data.userAddress.toLowerCase();

      // Fetch existing whale record or cumulative metrics
      const existing = await prisma.hyperWhale.findUnique({
        where: { userAddress: userAddr },
      });

      const currentMaxPos = Math.max(
        data.positionSizeUsd,
        existing ? Number(existing.maxPositionSizeUsd) : 0
      );
      const newCumVolume = (existing ? Number(existing.cumulativeVolumeUsd) : 0) + (data.tradeUsdValue || 0);
      const newPnl = (existing ? Number(existing.realizedPnlUsd) : 0) + (data.closedPnl || 0);

      let isWhale = false;
      let reason = '';

      if (currentMaxPos >= 250000) {
        isWhale = true;
        reason = 'POSITION_SIZE_GE_250K';
      } else if (newCumVolume >= 5000000) {
        isWhale = true;
        reason = 'CUMULATIVE_VOLUME_GE_5M';
      } else if (Math.abs(newPnl) >= 1000000) {
        isWhale = true;
        reason = 'REALIZED_PNL_GE_1M';
      }

      if (isWhale) {
        await prisma.hyperWhale.upsert({
          where: { userAddress: userAddr },
          update: {
            cumulativeVolumeUsd: new Prisma.Decimal(newCumVolume),
            realizedPnlUsd: new Prisma.Decimal(newPnl),
            maxPositionSizeUsd: new Prisma.Decimal(currentMaxPos),
            isWhale: true,
            qualificationReason: reason,
            lastActiveAt: new Date(),
          },
          create: {
            userAddress: userAddr,
            cumulativeVolumeUsd: new Prisma.Decimal(newCumVolume),
            realizedPnlUsd: new Prisma.Decimal(newPnl),
            maxPositionSizeUsd: new Prisma.Decimal(currentMaxPos),
            isWhale: true,
            qualificationReason: reason,
          },
        });
      }

      return { isWhale, reason };
    } catch (err) {
      logger.error('Error checking whale qualification:', err);
      return { isWhale: data.positionSizeUsd >= 250000 };
    }
  }

  /**
   * Save or update active position in hyper_positions
   */
  static async upsertPosition(event: HyperPositionEvent): Promise<any> {
    try {
      const positionSizeUsd = event.positionSize * event.markPrice;

      // Check Whale status
      const whaleStatus = await HyperliquidStorage.checkAndUpsertWhale({
        userAddress: event.userAddress,
        positionSizeUsd,
        closedPnl: event.closedPnl,
      });

      const isWhale = whaleStatus.isWhale || event.isWhale || positionSizeUsd >= 250000;

      // Find or create associated Wallet record
      const wallet = await prisma.wallet.upsert({
        where: { address: event.userAddress },
        update: { lastActiveAt: new Date(event.timestamp) },
        create: {
          address: event.userAddress,
          chain: 'HYPERLIQUID',
          lastActiveAt: new Date(event.timestamp),
        },
      });

      // If position size is 0 (Close Position), remove
      if (event.positionSize === 0) {
        await prisma.hyperPosition.deleteMany({
          where: {
            userAddress: { equals: event.userAddress, mode: 'insensitive' },
            coin: event.coin,
          },
        });
        return null;
      }

      const existing = await prisma.hyperPosition.findFirst({
        where: {
          userAddress: { equals: event.userAddress, mode: 'insensitive' },
          coin: event.coin,
        },
      });

      if (existing) {
        return await prisma.hyperPosition.update({
          where: { id: existing.id },
          data: {
            positionSize: new Prisma.Decimal(event.positionSize),
            entryPrice: new Prisma.Decimal(event.entryPrice),
            markPrice: new Prisma.Decimal(event.markPrice),
            liquidationPrice: event.liquidationPrice
              ? new Prisma.Decimal(event.liquidationPrice)
              : null,
            unrealizedPnl: new Prisma.Decimal(event.unrealizedPnl),
            leverage: event.leverage,
            side: event.side,
            isWhale,
            updatedAt: new Date(event.timestamp),
          },
        });
      }

      return await prisma.hyperPosition.create({
        data: {
          walletId: wallet.id,
          userAddress: event.userAddress,
          coin: event.coin,
          positionSize: new Prisma.Decimal(event.positionSize),
          entryPrice: new Prisma.Decimal(event.entryPrice),
          markPrice: new Prisma.Decimal(event.markPrice),
          liquidationPrice: event.liquidationPrice
            ? new Prisma.Decimal(event.liquidationPrice)
            : null,
          unrealizedPnl: new Prisma.Decimal(event.unrealizedPnl),
          leverage: event.leverage,
          side: event.side,
          isWhale,
        },
      });
    } catch (error) {
      logger.error('❌ Error storing Hyperliquid position:', error);
      throw error;
    }
  }

  /**
   * Save Hyperliquid trade fill into hyper_trades table (Filters small retail trades)
   */
  static async recordTrade(trade: {
    userAddress: string;
    coin: string;
    side: OrderSide;
    price: number;
    size: number;
    usdValue: number;
    fee: number;
    tradeTimestamp: Date;
    hash: string;
  }): Promise<any> {
    try {
      // Evaluate whale classification and accumulate volume
      const whaleStatus = await HyperliquidStorage.checkAndUpsertWhale({
        userAddress: trade.userAddress,
        positionSizeUsd: trade.usdValue,
        tradeUsdValue: trade.usdValue,
      });

      // FILTER: Ignore retail trades under $50,000 USD unless trader is a qualified whale
      if (!whaleStatus.isWhale && trade.usdValue < 50000) {
        return null; // Ignore small retail trade
      }

      const wallet = await prisma.wallet.upsert({
        where: { address: trade.userAddress },
        update: { lastActiveAt: trade.tradeTimestamp },
        create: {
          address: trade.userAddress,
          chain: 'HYPERLIQUID',
          lastActiveAt: trade.tradeTimestamp,
        },
      });

      return await prisma.hyperTrade.create({
        data: {
          walletId: wallet.id,
          userAddress: trade.userAddress.toLowerCase(),
          coin: trade.coin,
          side: trade.side,
          price: new Prisma.Decimal(trade.price),
          size: new Prisma.Decimal(trade.size),
          usdValue: new Prisma.Decimal(trade.usdValue),
          fee: new Prisma.Decimal(trade.fee),
          tradeTimestamp: trade.tradeTimestamp,
          hash: trade.hash,
        },
      });
    } catch (error) {
      logger.error('❌ Error recording Hyperliquid trade:', error);
      throw error;
    }
  }
}
