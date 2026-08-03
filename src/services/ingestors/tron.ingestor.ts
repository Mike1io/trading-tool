import { Chain } from '@prisma/client';
import { IngestionService } from './ingestion.service.js';
import { RawTransferPayload } from './types.js';

export class TronIngestor {
  static parseTronTransfer(data: {
    blockNum: number;
    timestamp: Date;
    txHash: string;
    ownerAddress: string;
    toAddress: string;
    contractAddress: string;
    tokenSymbol: string;
    rawAmount: string;
    decimals: number;
    tokenPriceUsd: number;
  }): RawTransferPayload {
    const rawAmountNum = parseFloat(data.rawAmount) / Math.pow(10, data.decimals);
    const amountUsd = rawAmountNum * data.tokenPriceUsd;

    return {
      chain: Chain.TRON,
      blockNumber: data.blockNum,
      blockTimestamp: data.timestamp,
      txHash: data.txHash,
      fromAddress: data.ownerAddress,
      toAddress: data.toAddress,
      tokenAddress: data.contractAddress,
      tokenSymbol: data.tokenSymbol,
      rawAmount: data.rawAmount,
      amountUsd,
    };
  }

  static async ingestTronTransfer(
    data: Parameters<typeof TronIngestor.parseTronTransfer>[0]
  ): Promise<string> {
    const payload = this.parseTronTransfer(data);
    return IngestionService.publishRawTransfer(payload);
  }
}
