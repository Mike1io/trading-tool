import { prisma } from '../../config/database.js';
import { SearchResponse, SearchResultItem } from './types.js';
import { logger } from '../../utils/logger.js';

export class SearchService {
  static async search(query: string, limit = 10): Promise<SearchResponse> {
    const q = query.trim();
    if (!q) {
      return {
        query: '',
        totalResults: 0,
        categories: {
          wallets: [],
          transactions: [],
          tokens: [],
          exchanges: [],
          hyperliquidTraders: [],
        },
      };
    }

    try {
      const addressQuery = q.toLowerCase();

      // 1. Search Wallets & Wallet Labels
      const wallets = await prisma.wallet.findMany({
        where: {
          OR: [
            { address: { contains: addressQuery, mode: 'insensitive' } },
            { walletLabels: { some: { label: { contains: q, mode: 'insensitive' } } } },
          ],
        },
        take: limit,
        include: { walletLabels: true },
      });

      const walletResults: SearchResultItem[] = wallets.map((w) => {
        const primaryLabel = w.walletLabels[0]?.label || 'Unlabeled Wallet';
        return {
          id: w.id,
          type: 'WALLET',
          title: primaryLabel,
          subtitle: w.address,
          chain: w.chain,
          badge: w.isSmartMoney ? 'SMART MONEY' : 'WALLET',
          metadata: {
            smartMoneyScore: w.smartMoneyScore,
            totalPnlUsd: w.totalPnlUsd,
          },
        };
      });

      // 2. Search Transactions (Tx Hash, Sender, Receiver, Token Symbol)
      const transfers = await prisma.transfer.findMany({
        where: {
          OR: [
            { txHash: { contains: addressQuery, mode: 'insensitive' } },
            { fromAddress: { contains: addressQuery, mode: 'insensitive' } },
            { toAddress: { contains: addressQuery, mode: 'insensitive' } },
            { tokenSymbol: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { blockTimestamp: 'desc' },
      });

      const transferResults: SearchResultItem[] = transfers.map((t) => ({
        id: t.id,
        type: 'TRANSACTION',
        title: `Tx ${t.txHash.substring(0, 10)}...`,
        subtitle: `Transfer of $${Number(t.amountUsd).toLocaleString()} USD (${t.tokenSymbol})`,
        chain: t.chain,
        badge: t.flowType,
        metadata: {
          fromAddress: t.fromAddress,
          toAddress: t.toAddress,
          amountUsd: t.amountUsd,
        },
      }));

      // 3. Search Tokens
      const tokens = await prisma.transfer.groupBy({
        by: ['tokenSymbol', 'tokenAddress', 'chain'],
        where: {
          OR: [
            { tokenSymbol: { contains: q, mode: 'insensitive' } },
            { tokenAddress: { contains: addressQuery, mode: 'insensitive' } },
          ],
        },
        _count: { _all: true },
        orderBy: { tokenSymbol: 'asc' },
        take: limit,
      });

      const tokenResults: SearchResultItem[] = tokens.map((tok) => ({
        id: `${tok.chain}_${tok.tokenSymbol}`,
        type: 'TOKEN',
        title: tok.tokenSymbol,
        subtitle: tok.tokenAddress,
        chain: tok.chain,
        badge: 'TOKEN CONTRACT',
        metadata: {
          transferCount: tok._count._all,
        },
      }));

      // 4. Search Exchanges
      const exchanges = await prisma.exchangeLabel.findMany({
        where: {
          OR: [
            { exchangeName: { contains: q, mode: 'insensitive' } },
            { hotWalletAddress: { contains: addressQuery, mode: 'insensitive' } },
          ],
        },
        take: limit,
      });

      const exchangeResults: SearchResultItem[] = exchanges.map((ex) => ({
        id: ex.id,
        type: 'EXCHANGE',
        title: ex.exchangeName,
        subtitle: ex.hotWalletAddress,
        chain: ex.chain,
        badge: 'CEX HOT WALLET',
      }));

      // 5. Search Hyperliquid Traders & Positions
      const hyperPositions = await prisma.hyperPosition.findMany({
        where: {
          OR: [
            { userAddress: { contains: addressQuery, mode: 'insensitive' } },
            { coin: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      const hyperResults: SearchResultItem[] = hyperPositions.map((hp) => ({
        id: hp.id,
        type: 'HYPERLIQUID_TRADER',
        title: `Hyperliquid Trader ${hp.userAddress.substring(0, 8)}...`,
        subtitle: `${hp.side} ${hp.leverage}x on ${hp.coin} (Size: $${(Number(hp.positionSize) * Number(hp.markPrice)).toLocaleString()} USD)`,
        chain: 'HYPERLIQUID',
        badge: hp.isWhale ? 'HYPER WHALE' : 'TRADER',
        metadata: {
          unrealizedPnl: hp.unrealizedPnl,
        },
      }));

      const totalResults =
        walletResults.length +
        transferResults.length +
        tokenResults.length +
        exchangeResults.length +
        hyperResults.length;

      return {
        query: q,
        totalResults,
        categories: {
          wallets: walletResults,
          transactions: transferResults,
          tokens: tokenResults,
          exchanges: exchangeResults,
          hyperliquidTraders: hyperResults,
        },
      };
    } catch (error) {
      logger.error(`Error executing SearchService for query "${query}":`, error);
      throw error;
    }
  }
}
