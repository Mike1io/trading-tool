import { redis } from '../config/redis.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { Chain, TransferFlowType, Prisma } from '@prisma/client';
import { RAW_TRANSFERS_STREAM } from '../services/ingestors/ingestion.service.js';
import { ExchangeDetectionEngine } from '../services/exchange/exchangeDetection.engine.js';

export const TRANSFER_EVENTS_PUBSUB = 'pubsub:transfer_events';
const CONSUMER_GROUP = 'group:wallet_tracker';
const CONSUMER_NAME = `worker_${process.pid}`;

export interface EnrichedTransferEvent {
  id: string;
  chain: Chain;
  blockNumber: number;
  blockTimestamp: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  flowType: TransferFlowType;
  fromLabel?: string;
  toLabel?: string;
  tokenAddress: string;
  tokenSymbol: string;
  rawAmount: string;
  amountUsd: number;
  isExchangeDeposit: boolean;
  isExchangeWithdrawal: boolean;
  isLargeTransfer: boolean;
}

export class WalletTrackerWorker {
  private isRunning = false;
  private LARGE_TRANSFER_THRESHOLD_USD = 100000; // $100k USD threshold

  async start(): Promise<void> {
    this.isRunning = true;
    logger.info(`⚙️ Starting WalletTrackerWorker [${CONSUMER_NAME}]...`);

    // Create consumer group if not already existing
    try {
      await redis.xgroup('CREATE', RAW_TRANSFERS_STREAM, CONSUMER_GROUP, '0', 'MKSTREAM');
      logger.info(`Created Redis Stream Consumer Group: ${CONSUMER_GROUP}`);
    } catch (err: any) {
      if (!err?.message?.includes('BUSYGROUP')) {
        logger.error('Error creating consumer group:', err);
      }
    }

    this.pollLoop();
  }

  stop(): void {
    this.isRunning = false;
    logger.info(`⏹️ Stopping WalletTrackerWorker [${CONSUMER_NAME}]...`);
  }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Read up to 50 stream messages with 2s block timeout
        const results = (await (redis as any).xreadgroup(
          'GROUP',
          CONSUMER_GROUP,
          CONSUMER_NAME,
          'BLOCK',
          2000,
          'COUNT',
          50,
          'STREAMS',
          RAW_TRANSFERS_STREAM,
          '>'
        )) as any;

        if (results && results.length > 0) {
          for (const [streamName, messages] of results) {
            for (const [messageId, fields] of messages) {
              await this.processMessage(messageId, fields);
            }
          }
        }
      } catch (error) {
        logger.error('Error in WalletTrackerWorker poll loop:', error);
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }

  private async processMessage(messageId: string, fields: string[]): Promise<void> {
    try {
      // Parse key-value pairs from Redis Stream fields array
      const rawData: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        rawData[fields[i]] = fields[i + 1];
      }

      const chain = rawData.chain as Chain;
      const blockNumber = parseInt(rawData.blockNumber, 10);
      const blockTimestamp = new Date(rawData.blockTimestamp);
      const txHash = rawData.txHash;
      const fromAddress = rawData.fromAddress;
      const toAddress = rawData.toAddress;
      const tokenAddress = rawData.tokenAddress;
      const tokenSymbol = rawData.tokenSymbol;
      const rawAmount = rawData.rawAmount;
      const amountUsd = parseFloat(rawData.amountUsd);

      // 1. Resolve Exchange Detection & Auto-Labeling via ExchangeDetectionEngine
      const cexResult = await ExchangeDetectionEngine.classifyTransfer(
        chain,
        fromAddress,
        toAddress
      );

      const isLargeTransfer = amountUsd >= this.LARGE_TRANSFER_THRESHOLD_USD;

      // 2. Ensure Wallets exist in DB
      const [fromWallet, toWallet] = await Promise.all([
        prisma.wallet.upsert({
          where: { address: fromAddress },
          update: { lastActiveAt: blockTimestamp },
          create: { address: fromAddress, chain, lastActiveAt: blockTimestamp },
        }),
        prisma.wallet.upsert({
          where: { address: toAddress },
          update: { lastActiveAt: blockTimestamp },
          create: { address: toAddress, chain, lastActiveAt: blockTimestamp },
        }),
      ]);

      // 3. Store Transfer in PostgreSQL
      const transfer = await prisma.transfer.create({
        data: {
          chain,
          blockNumber: BigInt(blockNumber),
          blockTimestamp,
          txHash,
          fromAddress,
          toAddress,
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
          flowType: cexResult.flowType,
          tokenAddress,
          tokenSymbol,
          rawAmount: new Prisma.Decimal(rawAmount),
          amountUsd: new Prisma.Decimal(amountUsd),
          isExchangeDeposit: cexResult.isExchangeDeposit,
          isExchangeWithdrawal: cexResult.isExchangeWithdrawal,
          isLargeTransfer,
        },
      });

      // 4. Construct enriched event payload
      const eventPayload: EnrichedTransferEvent = {
        id: transfer.id,
        chain,
        blockNumber,
        blockTimestamp: blockTimestamp.toISOString(),
        txHash,
        fromAddress,
        toAddress,
        flowType: cexResult.flowType,
        fromLabel: cexResult.fromExchangeName,
        toLabel: cexResult.toExchangeName,
        tokenAddress,
        tokenSymbol,
        rawAmount,
        amountUsd,
        isExchangeDeposit: cexResult.isExchangeDeposit,
        isExchangeWithdrawal: cexResult.isExchangeWithdrawal,
        isLargeTransfer,
      };

      // 5. Broadcast event via Redis Pub/Sub
      await redis.publish(TRANSFER_EVENTS_PUBSUB, JSON.stringify(eventPayload));

      // 6. Acknowledge message in Redis Stream
      await redis.xack(RAW_TRANSFERS_STREAM, CONSUMER_GROUP, messageId);
    } catch (error) {
      logger.error(`❌ Failed to process message ${messageId}:`, error);
    }
  }
}
