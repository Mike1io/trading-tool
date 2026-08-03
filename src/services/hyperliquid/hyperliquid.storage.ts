import { prisma } from '../../config/database.js';
import { Prisma, PositionSide, OrderSide } from '@prisma/client';
import { HyperPositionEvent } from './types.js';
import { logger } from '../../utils/logger.js';

export class HyperliquidStorage {
  /**
   * Save or update active position in hyper_positions
   */
  static async upsertPosition(event: HyperPositionEvent): Promise<any> {
    try {
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

      // If position size is 0 (Close Position), remove or set size to 0
      if (event.positionSize === 0) {
        const deleted = await prisma.hyperPosition.deleteMany({
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
            isWhale: event.isWhale,
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
          isWhale: event.isWhale,
        },
      });
    } catch (error) {
      logger.error('❌ Error storing Hyperliquid position:', error);
      throw error;
    }
  }

  /**
   * Save Hyperliquid trade fill into hyper_trades table
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
