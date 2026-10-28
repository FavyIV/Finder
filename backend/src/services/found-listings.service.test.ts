import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFoundListing } from './found-listings.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import { Category, FoundStatus, Role } from '@prisma/client';

describe('FoundListingsService - createFoundListing', () => {
  let testUserId: string;
  let testLocationId: string;
  let createdListingId: string;

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
  });

  after(async () => {
    if (createdListingId) {
      await prisma.foundListing.delete({ where: { id: createdListingId } }).catch(() => {});
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

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

    createdListingId = listing.id;

    assert.ok(listing.id);
    assert.equal(listing.photoUrl, photoUrl);
    assert.equal(listing.category, Category.KEYS);
    assert.equal(listing.status, FoundStatus.AVAILABLE);
    assert.equal(listing.location.id, testLocationId);
    assert.equal(listing.reportedBy.id, testUserId);
    assert.equal(listing.reportedBy.name, 'Test Finder');

    // Invariant #6: Reporter's email or phone must NOT be exposed in listing response
    assert.equal('email' in listing.reportedBy, false);
    assert.equal('phone' in listing.reportedBy, false);

    // Verify in database
    const dbListing = await prisma.foundListing.findUnique({
      where: { id: listing.id },
    });
    assert.ok(dbListing);
    assert.equal(dbListing.status, FoundStatus.AVAILABLE);
    assert.equal(dbListing.reportedById, testUserId);
    assert.equal(dbListing.locationId, testLocationId);
  });
});
