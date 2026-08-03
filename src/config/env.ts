import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('8080'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform((val) => parseInt(val, 10)).default('6379'),
  REDIS_PASSWORD: z.string().optional().default(''),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  ETH_RPC_URL: z.string().default('https://ethereum-rpc.publicnode.com'),
  SOLANA_RPC_URL: z.string().default('https://api.mainnet-beta.solana.com'),
  BASE_RPC_URL: z.string().default('https://mainnet.base.org'),
  ARBITRUM_RPC_URL: z.string().default('https://arb1.arbitrum.io/rpc'),
  BSC_RPC_URL: z.string().default('https://bsc-dataseed.binance.org'),
  BITCOIN_API_URL: z.string().default('https://mempool.space/api'),
  TRONGRID_API_URL: z.string().default('https://api.trongrid.io'),
  TRONGRID_API_KEY: z.string().optional().default(''),
  HYPERLIQUID_WS_URL: z.string().default('wss://api.hyperliquid.xyz/ws'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
