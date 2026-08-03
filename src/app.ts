import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware.js';
import { NotFoundError } from './utils/errors.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // HTTP Logger
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Rate Limiter
  app.use(env.API_PREFIX, globalRateLimiter);

  // API Routes
  app.use(env.API_PREFIX, apiRouter);

  // 404 Route Handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
  });

  // Global Error Handler
  app.use(errorMiddleware);

  return app;
}
