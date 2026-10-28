import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from '../errors/app-error';
import { isValidSchoolEmail } from '../lib/email/domain-check';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';
import type { Role } from '@prisma/client';

export type AuthResult = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
};

export type CurrentUserResult = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
};

export type JwtPayload = {
  userId: string;
  role: Role;
};

const BCRYPT_SALT_ROUNDS = 10;

export function generateToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const normalizedEmail = input.email.trim().toLowerCase();

  // Enforce school domain restriction
  if (!isValidSchoolEmail(normalizedEmail)) {
    throw new AppError(
      'INVALID_EMAIL_DOMAIN',
      'Registration is restricted to official @futa.edu.ng email addresses.',
      400,
    );
  }

  // Check for existing user
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(
      'EMAIL_ALREADY_EXISTS',
      'An account with this email address already exists.',
      409,
    );
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: input.role,
    },
  });

  const token = generateToken({ userId: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
  }

  const token = generateToken({ userId: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function getMe(userId: string): Promise<CurrentUserResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
  }

  return user;
}
