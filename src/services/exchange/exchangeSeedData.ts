import { Chain } from '@prisma/client';

export interface ExchangeSeedItem {
  exchangeName: string;
  hotWalletAddress: string;
  chain: Chain;
  label: string;
  depositTagPrefix?: string;
}

export const INITIAL_EXCHANGE_SEED_DATA: ExchangeSeedItem[] = [
  // --- BINANCE ---
  { exchangeName: 'Binance', hotWalletAddress: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', chain: Chain.ETHEREUM, label: 'Binance Hot Wallet 1' },
  { exchangeName: 'Binance', hotWalletAddress: '0x28c6c06298d514db089934071355e5743bf21d60', chain: Chain.ETHEREUM, label: 'Binance Hot Wallet 2' },
  { exchangeName: 'Binance', hotWalletAddress: '0x21a31ee1afc51d94c2efccaa2092ad1028285549', chain: Chain.ETHEREUM, label: 'Binance Hot Wallet 3' },
  { exchangeName: 'Binance', hotWalletAddress: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', chain: Chain.BSC, label: 'Binance BSC Hot Wallet 1' },
  { exchangeName: 'Binance', hotWalletAddress: '0x8894e0a0c962cb323c19727f429993f617468657', chain: Chain.ARBITRUM, label: 'Binance Arbitrum Hot Wallet' },
  { exchangeName: 'Binance', hotWalletAddress: '2ojv2haceu9xkhf9p2dwly5m2epc8w91fghy4cbg2c5v', chain: Chain.SOLANA, label: 'Binance Solana Hot Wallet 1' },
  { exchangeName: 'Binance', hotWalletAddress: '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ', chain: Chain.BITCOIN, label: 'Binance Bitcoin Cold Storage' },
  { exchangeName: 'Binance', hotWalletAddress: 'NDdYhM59iC9u2vj5iW9X2X5W7V4v4v4v4v', chain: Chain.TRON, label: 'Binance Tron Deposit Router' },

  // --- COINBASE ---
  { exchangeName: 'Coinbase', hotWalletAddress: '0x7160ec94128021197426378f54bad3f06d7efc49', chain: Chain.ETHEREUM, label: 'Coinbase Hot Wallet 1' },
  { exchangeName: 'Coinbase', hotWalletAddress: '0x503828976d22510aad0201ac7ec88293211d23da', chain: Chain.ETHEREUM, label: 'Coinbase Prime Vault' },
  { exchangeName: 'Coinbase', hotWalletAddress: '0x3154cf16ccdb4c6d922629664174b904d80f2c35', chain: Chain.BASE, label: 'Coinbase Base Bridge Vault' },
  { exchangeName: 'Coinbase', hotWalletAddress: 'GJRs4zi2ahewq1u3v8a9s1k8p3q2x1v5a2b3c', chain: Chain.SOLANA, label: 'Coinbase Solana Custody' },

  // --- BYBIT ---
  { exchangeName: 'Bybit', hotWalletAddress: '0xf89d7b9c3752e50529d10e5cf7d41f021c5f3e9c', chain: Chain.ETHEREUM, label: 'Bybit Hot Wallet 1' },
  { exchangeName: 'Bybit', hotWalletAddress: '0x1db3224a2626e3a9a13b0cfa0ea7e04fbdb7d612', chain: Chain.ETHEREUM, label: 'Bybit Hot Wallet 2' },
  { exchangeName: 'Bybit', hotWalletAddress: 'BybitSolanaCustodyHotWalletAddress1111111111', chain: Chain.SOLANA, label: 'Bybit Solana Hot Wallet' },

  // --- OKX ---
  { exchangeName: 'OKX', hotWalletAddress: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', chain: Chain.ETHEREUM, label: 'OKX Hot Wallet 1' },
  { exchangeName: 'OKX', hotWalletAddress: '0x50b1c9771465f544e99f4d76f0d148ffb73be5c6', chain: Chain.ETHEREUM, label: 'OKX Deposit Vault' },
  { exchangeName: 'OKX', hotWalletAddress: 'OKXSolanaHotWalletAddress1111111111111111', chain: Chain.SOLANA, label: 'OKX Solana Custody' },

  // --- BITGET ---
  { exchangeName: 'Bitget', hotWalletAddress: '0x1ab670d381057e627f12660d1956e1b65e94b321', chain: Chain.ETHEREUM, label: 'Bitget Hot Wallet 1' },
  { exchangeName: 'Bitget', hotWalletAddress: '0x9b31d8e1329c2941199320ac6ee3a90321c51980', chain: Chain.BSC, label: 'Bitget BSC Wallet' },

  // --- GATE.IO ---
  { exchangeName: 'Gate', hotWalletAddress: '0x0d0707963952f2fba59dd06f2b425ace40b492fe', chain: Chain.ETHEREUM, label: 'Gate.io Hot Wallet 1' },
  { exchangeName: 'Gate', hotWalletAddress: '0x1c479675ad5b2a41161a423a4e35630600ed35ef', chain: Chain.ARBITRUM, label: 'Gate.io Arbitrum Bridge' },

  // --- MEXC ---
  { exchangeName: 'MEXC', hotWalletAddress: '0x9e886090e544fe457f8efedb1fb8d6729ef5e971', chain: Chain.ETHEREUM, label: 'MEXC Hot Wallet 1' },
  { exchangeName: 'MEXC', hotWalletAddress: '0x32be343b94f860124dc4fee278fadbd387602500', chain: Chain.BSC, label: 'MEXC BSC Custody' },

  // --- KRAKEN ---
  { exchangeName: 'Kraken', hotWalletAddress: '0x2910543af39aba0cd09bfb26024d8178a8303f27', chain: Chain.ETHEREUM, label: 'Kraken Hot Wallet 1' },
  { exchangeName: 'Kraken', hotWalletAddress: '0xfa52274dd61e1643d2205169732f29114bc240b3', chain: Chain.ETHEREUM, label: 'Kraken Hot Wallet 2' },

  // --- KUCOIN ---
  { exchangeName: 'Kucoin', hotWalletAddress: '0x1634764d852069e25d0c3eb1df30e84c98bf35ce', chain: Chain.ETHEREUM, label: 'Kucoin Hot Wallet 1' },
  { exchangeName: 'Kucoin', hotWalletAddress: '0xd6216fc66f0459745143891d65db5574b78f8c65', chain: Chain.ETHEREUM, label: 'Kucoin Hot Wallet 2' },
];
