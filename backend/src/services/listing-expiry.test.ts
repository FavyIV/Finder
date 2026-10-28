import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isListingExpired, getExpiryCutoffDate, notExpiredWhere } from './listing-expiry';
import { LISTING_EXPIRY_DAYS } from '../config/constants';

describe('listing-expiry helper', () => {
  it('should calculate cutoff date 30 days prior', () => {
    const cutoff = getExpiryCutoffDate();
    const now = new Date();
    const diffDays = Math.round((now.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, LISTING_EXPIRY_DAYS);
  });

  it('should consider a listing created 1 day ago as NOT expired', () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    assert.equal(isListingExpired(oneDayAgo), false);
  });

  it('should consider a listing created 31 days ago as EXPIRED', () => {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    assert.equal(isListingExpired(thirtyOneDaysAgo), true);
  });

  it('should return a valid Prisma where fragment with gte', () => {
    const fragment = notExpiredWhere();
    assert.ok(fragment.createdAt);
    if (
      typeof fragment.createdAt === 'object' &&
      fragment.createdAt !== null &&
      'gte' in fragment.createdAt
    ) {
      assert.ok(fragment.createdAt.gte instanceof Date);
    } else {
      assert.fail('fragment.createdAt should be an object with gte');
    }
  });
});
