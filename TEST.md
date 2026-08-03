# Real-Time Data Source Verification & Testing Guide

This document details the live data sources, endpoints, tested connection statuses, PostgreSQL storage tables, and verification instructions for the **Crypto Intelligence Platform**.

---

## 1. Live Data Source & Verification Matrix

| Feature / Data Stream | Source File | Endpoint / Protocol | Connection Tested | Data Status | PostgreSQL Table |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ethereum Transfers** | `src/workers/blockchainIngestor.worker.ts` | `https://ethereum-rpc.publicnode.com` (JSON-RPC `eth_getLogs`) | ✅ **VERIFIED LIVE** | Real On-Chain Event Logs | `transfers` |
| **Solana Transfers** | `src/workers/blockchainIngestor.worker.ts` | `https://api.mainnet-beta.solana.com` (JSON-RPC `getSignaturesForAddress`) | ✅ **VERIFIED LIVE** | Real On-Chain Signatures | `transfers` |
| **Base L2 Transfers** | `src/workers/blockchainIngestor.worker.ts` | `https://mainnet.base.org` (JSON-RPC `eth_getLogs`) | ✅ **VERIFIED LIVE** | Real On-Chain Event Logs | `transfers` |
| **Arbitrum One Transfers** | `src/workers/blockchainIngestor.worker.ts` | `https://arb1.arbitrum.io/rpc` (JSON-RPC `eth_getLogs`) | ✅ **VERIFIED LIVE** | Real On-Chain Event Logs | `transfers` |
| **BNB Chain Transfers** | `src/workers/blockchainIngestor.worker.ts` | `https://bsc-dataseed.binance.org` (JSON-RPC `eth_getLogs`) | ✅ **VERIFIED LIVE** | Real On-Chain Event Logs | `transfers` |
| **Bitcoin Transfers** | `src/workers/blockchainIngestor.worker.ts` | `https://mempool.space/api/mempool/recent` & `/tx/{txid}` | ✅ **VERIFIED LIVE** | Real Mempool & Block Tx | `transfers` |
| **Tron TRC-20 USDT** | `src/workers/blockchainIngestor.worker.ts` | `https://api.trongrid.io/v1/contracts/.../events` | ✅ **VERIFIED LIVE** | Real TRC-20 Event Logs | `transfers` |
| **Hyperliquid Trades & Fills** | `src/services/hyperliquid/hyperliquid.client.ts` | `wss://api.hyperliquid.xyz/ws` (`trades`, `allMids`, `webData2`) | ✅ **VERIFIED LIVE** | Real L1 Market & Fills | `hyper_trades` |
| **Hyperliquid Whale Positions** | `src/workers/hyperliquidTracker.worker.ts` | `wss://api.hyperliquid.xyz/ws` | ✅ **VERIFIED LIVE** | Real L1 Whale Positions | `hyper_positions` |
| **CEX Exchange Labels** | `src/services/exchange/exchangeDetection.engine.ts` | Seeded CEX Hot Wallets (Binance, Coinbase, OKX, Bybit, etc.) | ✅ **VERIFIED LIVE** | Official Seed & DB Matcher | `exchange_labels` |

---

## 2. Verification Steps

### A. Testing Live Multi-Chain Ingestion

1. Ensure `.env` is configured with your database and RPC endpoints.
2. Start the backend development server:
   ```powershell
   npm run dev
   ```
3. Observe the console logs as `BlockchainIngestorWorker` connects to RPC endpoints and ingests real blocks:
   - EVM log events ingested on Ethereum, Base, Arbitrum, BSC.
   - Solana signatures ingested from `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`.
   - Bitcoin transactions fetched from `mempool.space`.
   - Tron TRC-20 USDT transfers fetched from `api.trongrid.io`.

4. Verify database persistence in PostgreSQL:
   ```powershell
   npx prisma studio
   ```
   Inspect the `transfers` table to view stored records with real block numbers, transaction hashes, addresses, and USD amounts.

---

### B. Testing Official Hyperliquid L1 WebSocket

1. Start the backend:
   ```powershell
   npm run dev
   ```
2. Verify connection output:
   `⚡ Connected to Hyperliquid L1 WebSocket`
3. The client receives live `allMids` price ticks (e.g. `BTC mid price: 63464.5`) and streams real-time trade fills.
4. Active whale positions ($\ge \$250,000$ USD) are automatically updated in `hyper_positions` and `hyper_trades` PostgreSQL tables.

---

### C. Testing Dashboard Pages (Frontend)

1. Start the frontend Next.js server:
   ```powershell
   npm run dev:frontend
   ```
2. Open **[http://localhost:3000](http://localhost:3000)**:
   - **Dashboard (`/`)**: Displays live 24h volume and real-time ingested transfers.
   - **Transfers Stream (`/transfers`)**: Displays live multi-chain transfers fetched directly from `/api/v1/transfers`.
   - **Whales Monitor (`/whales`)**: Displays active Hyperliquid whale positions fetched directly from `/api/v1/hyperliquid/positions?isWhale=true`.
   - **Wallets Directory (`/wallets`)**: Displays wallet records stored in PostgreSQL.
   - **Leaderboard (`/leaderboard`)**: Displays smart money wallet rankings from PostgreSQL.
