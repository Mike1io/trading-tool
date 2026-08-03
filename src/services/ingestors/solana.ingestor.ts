import { Chain } from '@prisma/client';
import { IngestionService } from './ingestion.service.js';
import { RawTransferPayload } from './types.js';

export class SolanaIngestor {
  static parseSolanaTransfer(data: {
    slot: number;
    timestamp: Date;
    signature: string;
    sender: string;
    receiver: string;
    mintAddress: string;
    tokenSymbol: string;
    amount: string;
    decimals: number;
    priceUsd: number;
  }): RawTransferPayload {
    const rawAmountNum = parseFloat(data.amount) / Math.pow(10, data.decimals);
    const amountUsd = rawAmountNum * data.priceUsd;

    return {
      chain: Chain.SOLANA,
      blockNumber: data.slot,
      blockTimestamp: data.timestamp,
      txHash: data.signature,
      fromAddress: data.sender,
      toAddress: data.receiver,
      tokenAddress: data.mintAddress,
      tokenSymbol: data.tokenSymbol,
      rawAmount: data.amount,
      amountUsd,
    };
  }

  static async ingestSolanaTransfer(
    data: Parameters<typeof SolanaIngestor.parseSolanaTransfer>[0]
  ): Promise<string> {
    const payload = this.parseSolanaTransfer(data);
    return IngestionService.publishRawTransfer(payload);
  }
}
