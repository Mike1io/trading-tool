import { Chain } from '@prisma/client';
import { IngestionService } from './ingestion.service.js';
import { RawTransferPayload } from './types.js';

export class BitcoinIngestor {
  static parseBitcoinUTXO(data: {
    blockHeight: number;
    timestamp: Date;
    txid: string;
    inputAddress: string;
    outputAddress: string;
    satsAmount: bigint;
    btcPriceUsd: number;
  }): RawTransferPayload {
    const btcAmount = Number(data.satsAmount) / 1e8;
    const amountUsd = btcAmount * data.btcPriceUsd;

    return {
      chain: Chain.BITCOIN,
      blockNumber: data.blockHeight,
      blockTimestamp: data.timestamp,
      txHash: data.txid,
      fromAddress: data.inputAddress,
      toAddress: data.outputAddress,
      tokenAddress: 'BTC',
      tokenSymbol: 'BTC',
      rawAmount: data.satsAmount.toString(),
      amountUsd,
    };
  }

  static async ingestBitcoinTransfer(
    data: Parameters<typeof BitcoinIngestor.parseBitcoinUTXO>[0]
  ): Promise<string> {
    const payload = this.parseBitcoinUTXO(data);
    return IngestionService.publishRawTransfer(payload);
  }
}
