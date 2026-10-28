import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * Single Prisma client for the entire backend.
 * Never call `new PrismaClient()` anywhere else — always import from here.
 *
 * The globalThis trick prevents multiple client instances during hot-reload
 * in development (tsx watch).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
