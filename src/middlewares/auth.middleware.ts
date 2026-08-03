import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  req.user = payload;
  next();
}

export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }

    next();
  };
}
