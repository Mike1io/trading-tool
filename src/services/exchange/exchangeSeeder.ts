import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { INITIAL_EXCHANGE_SEED_DATA } from './exchangeSeedData.js';
import { LabelCategory } from '@prisma/client';

export class ExchangeSeeder {
  static async seedExchanges(): Promise<void> {
    try {
      logger.info('🏦 Verifying Exchange Label Seed Database...');
      let seededCount = 0;

      for (const item of INITIAL_EXCHANGE_SEED_DATA) {
        const addressLower = item.hotWalletAddress.toLowerCase();

        // 1. Upsert ExchangeLabel
        const existingExchangeLabel = await prisma.exchangeLabel.findFirst({
          where: {
            chain: item.chain,
            hotWalletAddress: { equals: addressLower, mode: 'insensitive' },
          },
        });

        if (!existingExchangeLabel) {
          await prisma.exchangeLabel.create({
            data: {
              exchangeName: item.exchangeName,
              hotWalletAddress: addressLower,
              chain: item.chain,
              depositTagPrefix: item.depositTagPrefix,
            },
          });
          seededCount++;
        }

        // 2. Upsert Wallet & WalletLabel
        const wallet = await prisma.wallet.upsert({
          where: { address: addressLower },
          update: {},
          create: {
            address: addressLower,
            chain: item.chain,
          },
        });

        const existingWalletLabel = await prisma.walletLabel.findFirst({
          where: { walletId: wallet.id, label: item.label },
        });

        if (!existingWalletLabel) {
          await prisma.walletLabel.create({
            data: {
              walletId: wallet.id,
              label: item.label,
              category: LabelCategory.CEX,
              confidenceScore: 1.0,
              source: 'official_seed',
            },
          });
        }
      }

      if (seededCount > 0) {
        logger.info(`✅ Successfully seeded ${seededCount} new exchange wallet records.`);
      } else {
        logger.info('✨ Exchange seed records are already up to date.');
      }
    } catch (error) {
      logger.error('❌ Failed to seed exchange label database:', error);
    }
  }
}
