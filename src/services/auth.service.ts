import { prisma } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateTokenPair,
  verifyRefreshToken,
  revokeRefreshToken,
  GeneratedTokens,
} from '../utils/jwt.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export class AuthService {
  static async register(input: RegisterInput): Promise<{ user: any; tokens: GeneratedTokens }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  static async login(input: LoginInput): Promise<{ user: any; tokens: GeneratedTokens }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials or account deactivated');
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
    };

    return { user: userResponse, tokens };
  }

  static async refreshToken(token: string): Promise<GeneratedTokens> {
    const payload = await verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    // Revoke old refresh token & generate new pair (Token Rotation)
    await revokeRefreshToken(user.id, token);

    return generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }

  static async logout(userId: string, refreshToken: string): Promise<void> {
    await revokeRefreshToken(userId, refreshToken);
  }
}
