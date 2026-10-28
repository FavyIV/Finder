import { LISTING_EXPIRY_DAYS } from '../config/constants';
import type { Prisma } from '@prisma/client';

/**
 * Returns a Date representing the cutoff point for listing expiry.
 * Any listing created before this date is considered expired.
 */
export function getExpiryCutoffDate(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LISTING_EXPIRY_DAYS);
  return cutoff;
}

/**
 * Returns a Prisma `where` fragment that filters for listings created within
 * the last LISTING_EXPIRY_DAYS days.
 *
 * Every service query that returns available found listings MUST use this helper
 * to guarantee consistent read-time expiry enforcement without background jobs.
 */
export function notExpiredWhere(): Prisma.FoundListingWhereInput {
  return {
    createdAt: {
      gte: getExpiryCutoffDate(),
    },
  };
}

/**
 * Computes whether an individual listing has exceeded the 30-day expiry threshold.
 */
export function isListingExpired(createdAt: Date): boolean {
  return createdAt.getTime() < getExpiryCutoffDate().getTime();
}
