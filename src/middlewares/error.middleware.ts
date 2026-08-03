import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { Prisma } from '@prisma/client';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, any> | undefined = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma specific unique constraint or query errors
    if (err.code === 'P2002') {
      statusCode = 409;
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      message = `A record with this ${target} already exists.`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Requested record was not found.';
    } else {
      statusCode = 400;
      message = 'Database request failed.';
    }
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - 500 Internal Error:`, err);
  } else {
    logger.warn(`[${req.method}] ${req.path} - ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
