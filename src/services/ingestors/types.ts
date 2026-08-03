import { Chain } from '@prisma/client';

export interface RawTransferPayload {
  chain: Chain;
  blockNumber: number;
  blockTimestamp: Date;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  rawAmount: string;
  amountUsd: number;
}
