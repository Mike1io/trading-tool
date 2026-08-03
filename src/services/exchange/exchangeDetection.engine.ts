import { redis } from '../../config/redis.js';
import { prisma } from '../../config/database.js';
import { Chain, TransferFlowType } from '@prisma/client';
import { logger } from '../../utils/logger.js';

export interface ExchangeMatchResult {
  isExchangeDeposit: boolean;
  isExchangeWithdrawal: boolean;
  flowType: TransferFlowType;
  fromExchangeName?: string;
  toExchangeName?: string;
}

const CEX_CACHE_KEY_PREFIX = 'cache:cex:wallet:';
const CEX_CACHE_TTL = 86400; // 24 hours

export class ExchangeDetectionEngine {
  /**
   * Fast Redis-backed resolution of an address to an exchange name
   */
  static async resolveAddressExchange(
    chain: Chain,
    address: string
  ): Promise<string | null> {
    const addressLower = address.toLowerCase();
    const cacheKey = `${CEX_CACHE_KEY_PREFIX}${chain}:${addressLower}`;

    try {
      // 1. Check Redis Cache
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return cached === '__NONE__' ? null : cached;
      }

      // 2. Query PostgreSQL Database
      const exchangeLabel = await prisma.exchangeLabel.findFirst({
        where: {
          chain,
          hotWalletAddress: { equals: addressLower, mode: 'insensitive' },
        },
      });

      if (exchangeLabel) {
        await redis.set(cacheKey, exchangeLabel.exchangeName, 'EX', CEX_CACHE_TTL);
        return exchangeLabel.exchangeName;
      } else {
        await redis.set(cacheKey, '__NONE__', 'EX', 3600); // cache negative lookup for 1 hour
        return null;
      }
    } catch (error) {
      logger.error(`Error resolving exchange for address ${address}:`, error);
      return null;
    }
  }

  /**
   * Classify transaction transfer flow between sender and receiver
   */
  static async classifyTransfer(
    chain: Chain,
    fromAddress: string,
    toAddress: string
  ): Promise<ExchangeMatchResult> {
    const [fromExchangeName, toExchangeName] = await Promise.all([
      this.resolveAddressExchange(chain, fromAddress),
      this.resolveAddressExchange(chain, toAddress),
    ]);

    let flowType: TransferFlowType = TransferFlowType.WALLET_TO_WALLET;
    let isExchangeDeposit = false;
    let isExchangeWithdrawal = false;

    if (fromExchangeName && toExchangeName) {
      flowType = TransferFlowType.INTERNAL_EXCHANGE;
    } else if (toExchangeName) {
      flowType = TransferFlowType.WALLET_TO_EXCHANGE;
      isExchangeDeposit = true;
    } else if (fromExchangeName) {
      flowType = TransferFlowType.EXCHANGE_TO_WALLET;
      isExchangeWithdrawal = true;
    }

    return {
      isExchangeDeposit,
      isExchangeWithdrawal,
      flowType,
      fromExchangeName: fromExchangeName || undefined,
      toExchangeName: toExchangeName || undefined,
    };
  }

  /**
   * Register a new exchange wallet dynamically
   */
  static async registerExchangeWallet(
    exchangeName: string,
    hotWalletAddress: string,
    chain: Chain,
    labelName?: string
  ): Promise<void> {
    const addressLower = hotWalletAddress.toLowerCase();

    await prisma.exchangeLabel.upsert({
      where: {
        chain_hotWalletAddress: {
          chain,
          hotWalletAddress: addressLower,
        },
      },
      update: { exchangeName },
      create: {
        exchangeName,
        hotWalletAddress: addressLower,
        chain,
      },
    });

    // Invalidate Redis cache
    const cacheKey = `${CEX_CACHE_KEY_PREFIX}${chain}:${addressLower}`;
    await redis.set(cacheKey, exchangeName, 'EX', CEX_CACHE_TTL);
  }
}
