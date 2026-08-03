import { redis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { RawTransferPayload } from './types.js';

export const RAW_TRANSFERS_STREAM = 'stream:raw_transfers';

export class IngestionService {
  static async publishRawTransfer(payload: RawTransferPayload): Promise<string> {
    try {
      const messageId = await redis.xadd(
        RAW_TRANSFERS_STREAM,
        '*',
        'chain', payload.chain,
        'blockNumber', payload.blockNumber.toString(),
        'blockTimestamp', payload.blockTimestamp.toISOString(),
        'txHash', payload.txHash,
        'fromAddress', payload.fromAddress,
        'toAddress', payload.toAddress,
        'tokenAddress', payload.tokenAddress,
        'tokenSymbol', payload.tokenSymbol,
        'rawAmount', payload.rawAmount,
        'amountUsd', payload.amountUsd.toString()
      );

      return messageId as string;
    } catch (error) {
      logger.error('❌ Failed to publish raw transfer to Redis Stream:', error);
      throw error;
    }
  }

  static async publishBatchRawTransfers(payloads: RawTransferPayload[]): Promise<number> {
    const pipeline = redis.pipeline();
    for (const payload of payloads) {
      pipeline.xadd(
        RAW_TRANSFERS_STREAM,
        '*',
        'chain', payload.chain,
        'blockNumber', payload.blockNumber.toString(),
        'blockTimestamp', payload.blockTimestamp.toISOString(),
        'txHash', payload.txHash,
        'fromAddress', payload.fromAddress,
        'toAddress', payload.toAddress,
        'tokenAddress', payload.tokenAddress,
        'tokenSymbol', payload.tokenSymbol,
        'rawAmount', payload.rawAmount,
        'amountUsd', payload.amountUsd.toString()
      );
    }
    await pipeline.exec();
    return payloads.length;
  }
}
