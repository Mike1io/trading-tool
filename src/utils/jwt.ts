import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { UnauthorizedError } from './errors.js';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRATION as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRATION as jwt.SignOptions['expiresIn'],
  });
}

export async function generateTokenPair(payload: TokenPayload): Promise<GeneratedTokens> {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in Redis mapped to user ID
  const redisKey = `${REFRESH_TOKEN_PREFIX}${payload.userId}:${refreshToken}`;
  await redis.set(redisKey, 'valid', 'EX', REFRESH_TOKEN_TTL_SECONDS);

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    
    // Check if token exists in Redis (not revoked)
    const redisKey = `${REFRESH_TOKEN_PREFIX}${payload.userId}:${token}`;
    const exists = await redis.get(redisKey);

    if (!exists) {
      throw new UnauthorizedError('Refresh token has been revoked or expired');
    }

    return payload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export async function revokeRefreshToken(userId: string, token: string): Promise<void> {
  const redisKey = `${REFRESH_TOKEN_PREFIX}${userId}:${token}`;
  await redis.del(redisKey);
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  const stream = redis.scanStream({ match: `${REFRESH_TOKEN_PREFIX}${userId}:*` });
  stream.on('data', (keys: string[]) => {
    if (keys.length > 0) {
      const pipeline = redis.pipeline();
      keys.forEach((key) => pipeline.del(key));
      pipeline.exec();
    }
  });
}
