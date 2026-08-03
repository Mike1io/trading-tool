import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { wsService } from './services/websocket.service.js';
import { WalletTrackerWorker } from './workers/walletTracker.worker.js';
import { HyperliquidTrackerWorker } from './workers/hyperliquidTracker.worker.js';
import { setHyperliquidWorkerInstance } from './controllers/hyperliquid.controller.js';
import { ExchangeSeeder } from './services/exchange/exchangeSeeder.js';
import { AlertEvaluatorEngine } from './services/alert/alertEvaluator.engine.js';
import { NotificationDispatcher } from './services/alert/notificationDispatcher.js';
import { BlockchainIngestorWorker } from './workers/blockchainIngestor.worker.js';

async function bootstrap() {
  // Connect data stores
  const isDbConnected = await connectDatabase();
  const isRedisConnected = await connectRedis();

  // Seed Exchange Labels Database if DB is reachable
  if (isDbConnected) {
    await ExchangeSeeder.seedExchanges();
  } else {
    logger.warn('⚠️ Skipping Exchange DB Seeding: PostgreSQL is offline.');
  }

  const app = createApp();

  // Create HTTP Server
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`📍 API Prefix: http://localhost:${env.PORT}${env.API_PREFIX}`);
  });

  // Attach WebSocket Gateway
  wsService.init(server);

  // Initialize workers & alert evaluation if Redis is reachable
  const chainIngestorWorker = new BlockchainIngestorWorker();
  await chainIngestorWorker.start();

  const walletWorker = new WalletTrackerWorker();
  const hyperWorker = new HyperliquidTrackerWorker();
  const alertEvaluator = new AlertEvaluatorEngine();
  const notificationDispatcher = new NotificationDispatcher();

  if (isRedisConnected) {
    await walletWorker.start();
    await hyperWorker.start();
    await alertEvaluator.start();
    await notificationDispatcher.start();
  } else {
    logger.warn('⚠️ Skipping Redis Queue Workers & Alert Engine: Redis is offline.');
    // Hyperliquid worker can still track positions in memory if needed
    await hyperWorker.start();
  }

  setHyperliquidWorkerInstance(hyperWorker);

  // Graceful Shutdown Handler
  const shutdown = async (signal: string) => {
    logger.info(`⚠️ Received ${signal}. Starting graceful shutdown...`);

    walletWorker.stop();
    hyperWorker.stop();
    alertEvaluator.stop();
    notificationDispatcher.stop();
    wsService.close();

    server.close(async () => {
      logger.info('🛑 HTTP server closed.');

      await disconnectDatabase();
      await disconnectRedis();

      logger.info('✅ Shutdown completed cleanly.');
      process.exit(0);
    });

    // Force shutdown after 10s if connections fail to close cleanly
    setTimeout(() => {
      logger.error('❌ Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('💥 Unhandled Rejection:', reason);
    process.exit(1);
  });
}

bootstrap();
