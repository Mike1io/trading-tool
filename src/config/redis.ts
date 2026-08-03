import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let hasLoggedError = false;

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying after 3 attempts if Redis is offline
    }
    return Math.min(times * 1000, 3000);
  },
});

redis.on('connect', () => {
  hasLoggedError = false;
  logger.info('🔴 Redis client connected successfully');
});

redis.on('error', (err) => {
  if (!hasLoggedError) {
    if (err?.message?.includes('ECONNREFUSED')) {
      logger.warn(`⚠️ Redis not reachable at ${env.REDIS_HOST}:${env.REDIS_PORT}. Run 'docker-compose up' to start Redis.`);
    } else {
      logger.warn(`⚠️ Redis warning: ${err?.message || err}`);
    }
    hasLoggedError = true;
  }
});

export async function connectRedis(): Promise<boolean> {
  try {
    await redis.connect();
    return true;
  } catch (error: any) {
    if (!hasLoggedError) {
      logger.warn(`⚠️ Could not connect to Redis at ${env.REDIS_HOST}:${env.REDIS_PORT}: ${error?.message || error}`);
      hasLoggedError = true;
    }
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info('👋 Redis disconnected');
  } catch (e) {
    // ignore
  }
}
