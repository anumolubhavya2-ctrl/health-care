import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { generateTokenPair, generateAccessToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PATIENT', 'DOCTOR']).optional().default('PATIENT'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      sendError(res, 'Email already registered', 409);
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role as UserRole,
        phone: data.phone,
        // Create profile based on role
        ...(data.role === 'PATIENT' || !data.role
          ? {
              patient: {
                create: {
                  firstName: data.firstName,
                  lastName: data.lastName,
                },
              },
            }
          : {
              doctor: {
                create: {
                  firstName: data.firstName,
                  lastName: data.lastName,
                },
              },
            }),
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const { passwordHash: _pw, ...userWithoutPassword } = user;

    sendCreated(res, {
      user: userWithoutPassword,
      ...tokens,
    }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        patient: true,
        doctor: { include: { specialties: { include: { specialty: true } } } },
        admin: true,
      },
    });

    if (!user) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account is deactivated. Please contact support.', 403);
      return;
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token & update last login
    await Promise.all([
      prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    const { passwordHash: _pw, ...userWithoutPassword } = user;

    sendSuccess(res, {
      user: userWithoutPassword,
      ...tokens,
    }, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    const payload = verifyRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      sendUnauthorized(res, 'Invalid or expired refresh token');
      return;
    }

    if (storedToken.userId !== payload.userId) {
      sendUnauthorized(res, 'Token mismatch');
      return;
    }

    // Rotate refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const newTokens = generateTokenPair({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    await prisma.refreshToken.create({
      data: {
        token: newTokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    sendSuccess(res, newTokens, 'Tokens refreshed');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    }

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        patient: true,
        doctor: {
          include: {
            specialties: { include: { specialty: true } },
            queue: true,
          },
        },
        admin: true,
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const { passwordHash: _pw, ...userWithoutPassword } = user;
    sendSuccess(res, userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
