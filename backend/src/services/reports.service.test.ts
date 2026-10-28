import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createReport } from './reports.service';
import { getFoundListingById, searchFoundListings } from './found-listings.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import { Category, FoundStatus, ReportStatus, Role } from '@prisma/client';

describe('ReportsService - createReport', () => {
  let ownerUserId: string;
  let reporterUserId: string;
  let testLocationId: string;
  let testListingId: string;
  let createdReportId: string;

  before(async () => {
    // Create owner user
    const owner = await prisma.user.create({
      data: {
        email: `listing.owner.${Date.now()}@futa.edu.ng`,
        name: 'Listing Owner',
        passwordHash: 'dummy_hash',
        role: Role.USER,
      },
    });
    ownerUserId = owner.id;

    // Create reporter user
    const reporter = await prisma.user.create({
      data: {
        email: `reporter.${Date.now()}@futa.edu.ng`,
        name: 'Concerned Student',
        passwordHash: 'dummy_hash',
        role: Role.USER,
      },
    });
    reporterUserId = reporter.id;

    // Fetch existing location
    const location = await prisma.location.findFirst();
    if (!location) {
      throw new Error('Seed location required for tests.');
    }
    testLocationId = location.id;

    // Create an active listing
    const listing = await prisma.foundListing.create({
      data: {
        photoUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        category: Category.ELECTRONICS,
        locationId: testLocationId,
        foundAt: new Date(),
        description: 'iPhone 13 with cracked screen',
        reportedById: ownerUserId,
        status: FoundStatus.AVAILABLE,
      },
    });
    testListingId = listing.id;
  });

  after(async () => {
    if (createdReportId) {
      await prisma.report.delete({ where: { id: createdReportId } }).catch(() => {});
    }
    if (testListingId) {
      await prisma.foundListing.delete({ where: { id: testListingId } }).catch(() => {});
    }
    if (reporterUserId) {
      await prisma.user.delete({ where: { id: reporterUserId } }).catch(() => {});
    }
    if (ownerUserId) {
      await prisma.user.delete({ where: { id: ownerUserId } }).catch(() => {});
    }
  });

  it('should reject reporting your own listing with 400', async () => {
    await assert.rejects(
      async () => {
        await createReport(ownerUserId, testListingId, 'This is spam');
      },
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'CANNOT_REPORT_OWN_LISTING');
        assert.equal(error.httpStatus, 400);
        return true;
      },
    );
  });

  it('should reject reporting a non-existent listing with 404', async () => {
    await assert.rejects(
      async () => {
        await createReport(reporterUserId, 'non-existent-listing-id', 'This is spam');
      },
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'LISTING_NOT_FOUND');
        assert.equal(error.httpStatus, 404);
        return true;
      },
    );
  });

  it('should create a report with status PENDING and mark listing as under review without hiding it (Invariant #5)', async () => {
    const report = await createReport(
      reporterUserId,
      testListingId,
      'This image appears to be downloaded from the internet, likely fraudulent.',
    );

    createdReportId = report.id;

    assert.ok(report.id);
    assert.equal(report.status, ReportStatus.PENDING);
    assert.equal(report.foundListingId, testListingId);

    // Invariant #5: The listing detail MUST now indicate isUnderReview: true
    const detail = await getFoundListingById(testListingId);
    assert.equal(detail.status, 'AVAILABLE');
    assert.equal(detail.isUnderReview, true);

    // Invariant #5: The listing MUST still be visible in search results
    const search = await searchFoundListings({ page: 1, pageSize: 20 });
    const match = search.items.find((item) => item.id === testListingId);
    assert.ok(match);
    assert.equal(match.isUnderReview, true);
  });

  it('should reject duplicate report from the same user with 409 REPORT_ALREADY_SUBMITTED', async () => {
    await assert.rejects(
      async () => {
        await createReport(
          reporterUserId,
          testListingId,
          'Submitting another report on the same listing',
        );
      },
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'REPORT_ALREADY_SUBMITTED');
        assert.equal(error.httpStatus, 409);
        return true;
      },
    );
  });
});
