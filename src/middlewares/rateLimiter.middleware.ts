import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis.js';

function createRateLimiterStore(prefix: string) {
  if (redis.status === 'ready' || redis.status === 'connecting' || redis.status === 'connect') {
    try {
      return new RedisStore({
        // @ts-expect-error - Redis client compatible interface
        sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
        prefix,
      });
    } catch {
      return undefined;
    }
  }
  return undefined; // Default Express MemoryStore
}

export const globalRateLimiter = rateLimit({
  store: createRateLimiterStore('rl:global:'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

export const authRateLimiter = rateLimit({
  store: createRateLimiterStore('rl:auth:'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit sensitive auth operations to 10 per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});
