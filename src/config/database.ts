import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    logger.info('🐘 PostgreSQL database connected via Prisma');
    return true;
  } catch (error: any) {
    logger.warn(`⚠️ PostgreSQL connection warning: Can't reach database at localhost:5432. Ensure Postgres is running or start via 'docker-compose up'.`);
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('👋 PostgreSQL database disconnected');
  } catch (e) {
    // ignore
  }
}
