import { Chain } from '@prisma/client';
import { IngestionService } from './ingestion.service.js';
import { RawTransferPayload } from './types.js';

export class EVMIngestor {
  static parseERC20TransferLog(
    chain: Chain,
    log: {
      blockNumber: number;
      timestamp: Date;
      transactionHash: string;
      from: string;
      to: string;
      contractAddress: string;
      tokenSymbol: string;
      value: string;
      tokenPriceUsd: number;
      decimals: number;
    }
  ): RawTransferPayload {
    const rawAmountNum = parseFloat(log.value) / Math.pow(10, log.decimals);
    const amountUsd = rawAmountNum * log.tokenPriceUsd;

    return {
      chain,
      blockNumber: log.blockNumber,
      blockTimestamp: log.timestamp,
      txHash: log.transactionHash,
      fromAddress: log.from.toLowerCase(),
      toAddress: log.to.toLowerCase(),
      tokenAddress: log.contractAddress.toLowerCase(),
      tokenSymbol: log.tokenSymbol,
      rawAmount: log.value,
      amountUsd,
    };
  }

  static async ingestEVMTransfer(
    chain: Chain,
    transferLog: Parameters<typeof EVMIngestor.parseERC20TransferLog>[1]
  ): Promise<string> {
    const payload = this.parseERC20TransferLog(chain, transferLog);
    return IngestionService.publishRawTransfer(payload);
  }
}
