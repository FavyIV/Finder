import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createFoundListing,
  searchFoundListings,
  getFoundListingById,
} from './found-listings.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import { Category, FoundStatus, Role } from '@prisma/client';

describe('FoundListingsService', () => {
  let testUserId: string;
  let testLocationId: string;
  let activeListingId: string;
  let expiredListingId: string;
  let removedListingId: string;

  before(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `finder.${Date.now()}@futa.edu.ng`,
        name: 'Test Finder',
        passwordHash: 'dummy_hash',
        role: Role.USER,
      },
    });
    testUserId = user.id;

    // Get an existing location from seed
    const location = await prisma.location.findFirst();
    if (!location) {
      throw new Error('Seed locations must exist before running tests.');
    }
    testLocationId = location.id;

    // 1. Create an active listing
    const active = await prisma.foundListing.create({
      data: {
        photoUrl: 'https://res.cloudinary.com/demo/image/upload/active.jpg',
        category: Category.KEYS,
        locationId: testLocationId,
        foundAt: new Date(),
        description: 'Active car keys',
        reportedById: testUserId,
        status: FoundStatus.AVAILABLE,
      },
    });
    activeListingId = active.id;

    // 2. Create an expired listing (created 35 days ago)
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    const expired = await prisma.foundListing.create({
      data: {
        photoUrl: 'https://res.cloudinary.com/demo/image/upload/expired.jpg',
        category: Category.BOOKS,
        locationId: testLocationId,
        foundAt: thirtyFiveDaysAgo,
        description: 'Expired notebook',
        reportedById: testUserId,
        status: FoundStatus.AVAILABLE,
        createdAt: thirtyFiveDaysAgo,
      },
    });
    expiredListingId = expired.id;

    // 3. Create a listing that was removed by admin
    const removed = await prisma.foundListing.create({
      data: {
        photoUrl: 'https://res.cloudinary.com/demo/image/upload/removed.jpg',
        category: Category.ELECTRONICS,
        locationId: testLocationId,
        foundAt: new Date(),
        description: 'Spam listing',
        reportedById: testUserId,
        status: FoundStatus.AVAILABLE,
        removedAt: new Date(),
      },
    });
    removedListingId = removed.id;
  });

  after(async () => {
    await prisma.foundListing.deleteMany({
      where: {
        id: { in: [activeListingId, expiredListingId, removedListingId] },
      },
    });
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  describe('createFoundListing', () => {
    it('should throw 404 if the drop-off location does not exist', async () => {
      await assert.rejects(
        async () => {
          await createFoundListing(
            testUserId,
            {
              category: Category.KEYS,
              locationId: 'non-existent-location-id',
              foundAt: new Date(),
              description: 'Room keys with blue ribbon',
            },
            'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          );
        },
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'LOCATION_NOT_FOUND');
          assert.equal(error.httpStatus, 404);
          return true;
        },
      );
    });

    it('should create a found listing with status AVAILABLE and correct relations', async () => {
      const photoUrl = 'https://res.cloudinary.com/demo/image/upload/keys.jpg';
      const foundAt = new Date();

      const listing = await createFoundListing(
        testUserId,
        {
          category: Category.KEYS,
          locationId: testLocationId,
          foundAt,
          description: 'Set of silver keys found near the entrance',
        },
        photoUrl,
      );

      assert.ok(listing.id);
      assert.equal(listing.photoUrl, photoUrl);
      assert.equal(listing.category, Category.KEYS);
      assert.equal(listing.status, 'AVAILABLE');
      assert.equal(listing.location.id, testLocationId);
      assert.equal(listing.reportedBy.id, testUserId);
      assert.equal(listing.reportedBy.name, 'Test Finder');

      // Invariant #6: Reporter's email or phone must NOT be exposed in listing response
      assert.equal('email' in listing.reportedBy, false);
      assert.equal('phone' in listing.reportedBy, false);

      // Clean up newly created listing
      await prisma.foundListing.delete({ where: { id: listing.id } });
    });
  });

  describe('searchFoundListings', () => {
    it('should return active listings and automatically exclude expired & removed listings', async () => {
      const result = await searchFoundListings({
        page: 1,
        pageSize: 20,
      });

      assert.ok(result.items.some((item) => item.id === activeListingId));
      // 30-day read-time expiry: expired listing must NOT appear
      assert.equal(
        result.items.some((item) => item.id === expiredListingId),
        false,
      );
      // Removed listing must NOT appear
      assert.equal(
        result.items.some((item) => item.id === removedListingId),
        false,
      );
    });

    it('should filter listings by category', async () => {
      const result = await searchFoundListings({
        category: Category.KEYS,
        page: 1,
        pageSize: 20,
      });

      assert.ok(result.items.length > 0);
      for (const item of result.items) {
        assert.equal(item.category, Category.KEYS);
      }
    });

    it('should filter listings by locationId', async () => {
      const result = await searchFoundListings({
        locationId: testLocationId,
        page: 1,
        pageSize: 20,
      });

      assert.ok(result.items.length > 0);
      for (const item of result.items) {
        assert.equal(item.location.id, testLocationId);
      }
    });

    it('should paginate results with meta', async () => {
      const result = await searchFoundListings({
        page: 1,
        pageSize: 1,
      });

      assert.equal(result.items.length, 1);
      assert.equal(result.meta.page, 1);
      assert.equal(result.meta.pageSize, 1);
      assert.ok(result.meta.total >= 1);
      assert.ok(result.meta.totalPages >= 1);
    });
  });

  describe('getFoundListingById', () => {
    it('should return active listing detail', async () => {
      const listing = await getFoundListingById(activeListingId);
      assert.equal(listing.id, activeListingId);
      assert.equal(listing.status, 'AVAILABLE');
      assert.equal(listing.isUnderReview, false);
      assert.equal('email' in listing.reportedBy, false);
    });

    it('should return EXPIRED effective status for listings older than 30 days', async () => {
      const listing = await getFoundListingById(expiredListingId);
      assert.equal(listing.id, expiredListingId);
      assert.equal(listing.status, 'EXPIRED');
    });

    it('should throw 404 for removed listings', async () => {
      await assert.rejects(
        async () => {
          await getFoundListingById(removedListingId);
        },
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'LISTING_NOT_FOUND');
          assert.equal(error.httpStatus, 404);
          return true;
        },
      );
    });

    it('should throw 404 for non-existent listing ID', async () => {
      await assert.rejects(
        async () => {
          await getFoundListingById('non-existent-id');
        },
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'LISTING_NOT_FOUND');
          assert.equal(error.httpStatus, 404);
          return true;
        },
      );
    });
  });
});
