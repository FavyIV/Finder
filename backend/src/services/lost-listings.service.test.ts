import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLostListing,
  listLostListings,
  getLostListingById,
  updateLostListing,
} from './lost-listings.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import { Category, Role } from '@prisma/client';

describe('LostListingsService', () => {
  let userAId: string;
  let userBId: string;
  let createdListingId: string;

  before(async () => {
    const userA = await prisma.user.create({
      data: {
        email: `usera.lost.${Date.now()}@futa.edu.ng`,
        name: 'Student A',
        passwordHash: 'dummy_hash',
        role: Role.USER,
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: `userb.lost.${Date.now()}@futa.edu.ng`,
        name: 'Student B',
        passwordHash: 'dummy_hash',
        role: Role.USER,
      },
    });
    userBId = userB.id;
  });

  after(async () => {
    if (createdListingId) {
      await prisma.lostListing.delete({ where: { id: createdListingId } }).catch(() => {});
    }
    if (userAId) {
      await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    }
    if (userBId) {
      await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
    }
  });

  it('should create a lost listing and record acting user id (Invariant #7)', async () => {
    const listing = await createLostListing(userAId, {
      category: Category.BOOKS,
      description: 'Lost calculus textbook inside ETF lecture hall 2',
    });

    createdListingId = listing.id;

    assert.ok(listing.id);
    assert.equal(listing.category, Category.BOOKS);
    assert.equal(listing.description, 'Lost calculus textbook inside ETF lecture hall 2');
    assert.equal(listing.postedBy.id, userAId);
    assert.equal(listing.postedBy.name, 'Student A');
    // Invariant #6: never expose email or phone
    assert.equal((listing.postedBy as unknown as Record<string, unknown>).email, undefined);
  });

  it('should list all lost listings for any authenticated user (decision #5)', async () => {
    const result = await listLostListings({ page: 1, pageSize: 20 });

    assert.ok(result.items.length >= 1);
    assert.ok(result.meta.total >= 1);

    const match = result.items.find((item) => item.id === createdListingId);
    assert.ok(match);
    assert.equal(match.category, Category.BOOKS);
    assert.equal(match.postedBy.name, 'Student A');
    // Invariant #6: never expose email or phone
    assert.equal((match.postedBy as unknown as Record<string, unknown>).email, undefined);
  });

  it('should filter lost listings by category', async () => {
    const booksResult = await listLostListings({ category: Category.BOOKS, page: 1, pageSize: 20 });
    const match = booksResult.items.find((item) => item.id === createdListingId);
    assert.ok(match);

    const electronicsResult = await listLostListings({
      category: Category.ELECTRONICS,
      page: 1,
      pageSize: 20,
    });
    const noMatch = electronicsResult.items.find((item) => item.id === createdListingId);
    assert.equal(noMatch, undefined);
  });

  it('should filter by mineOnly when requested by the owner', async () => {
    const userAResult = await listLostListings({ mineOnly: true, page: 1, pageSize: 20 }, userAId);
    const match = userAResult.items.find((item) => item.id === createdListingId);
    assert.ok(match);

    const userBResult = await listLostListings({ mineOnly: true, page: 1, pageSize: 20 }, userBId);
    const noMatch = userBResult.items.find((item) => item.id === createdListingId);
    assert.equal(noMatch, undefined);
  });

  it('should retrieve a lost listing by ID', async () => {
    const listing = await getLostListingById(createdListingId);
    assert.equal(listing.id, createdListingId);
    assert.equal(listing.postedBy.name, 'Student A');
  });

  it('should throw 404 when retrieving a non-existent lost listing', async () => {
    await assert.rejects(
      async () => {
        await getLostListingById('non-existent-id');
      },
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'LOST_LISTING_NOT_FOUND');
        assert.equal(error.httpStatus, 404);
        return true;
      },
    );
  });

  it('should allow the owner to update their lost listing', async () => {
    const updated = await updateLostListing(userAId, createdListingId, {
      description: 'Lost calculus textbook (3rd edition) with blue cover in ETF',
    });

    assert.equal(updated.id, createdListingId);
    assert.equal(
      updated.description,
      'Lost calculus textbook (3rd edition) with blue cover in ETF',
    );
  });

  it('should reject a non-owner attempting to edit the lost listing with 403 NOT_LISTING_OWNER', async () => {
    await assert.rejects(
      async () => {
        await updateLostListing(userBId, createdListingId, {
          description: 'Hacked description by non-owner',
        });
      },
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'NOT_LISTING_OWNER');
        assert.equal(error.httpStatus, 403);
        return true;
      },
    );
  });

  it('should reject editing a non-existent lost listing with 404', async () => {
    await assert.rejects(
      async () => {
        await updateLostListing(userAId, 'non-existent-id', {
          description: 'Non-existent edit',
        });
      },
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'LOST_LISTING_NOT_FOUND');
        assert.equal(error.httpStatus, 404);
        return true;
      },
    );
  });
});
