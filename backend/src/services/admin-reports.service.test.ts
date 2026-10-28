import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createReport, listAdminReports, resolveReport } from './reports.service';
import { getFoundListingById, searchFoundListings } from './found-listings.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import { Category, FoundStatus, ReportStatus, Role } from '@prisma/client';

describe('AdminReportsService - listAdminReports & resolveReport', () => {
  let adminUserId: string;
  let ownerUserId: string;
  let reporterUserId: string;
  let testLocationId: string;
  let dismissListingId: string;
  let removeListingId: string;
  let dismissReportId: string;
  let removeReportId: string;

  before(async () => {
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: `admin.mod.${Date.now()}@futa.edu.ng`,
        name: 'Moderation Admin',
        passwordHash: 'dummy_hash',
        role: Role.ADMIN,
      },
    });
    adminUserId = admin.id;

    // Create listing owner
    const owner = await prisma.user.create({
      data: {
        email: `owner.mod.${Date.now()}@futa.edu.ng`,
        name: 'Listing Poster',
        passwordHash: 'dummy_hash',
        role: Role.USER,
      },
    });
    ownerUserId = owner.id;

    // Create reporter
    const reporter = await prisma.user.create({
      data: {
        email: `reporter.mod.${Date.now()}@futa.edu.ng`,
        name: 'Alert Student',
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

    // Create 2 listings to report (one for dismiss test, one for remove test)
    const listingForDismiss = await prisma.foundListing.create({
      data: {
        photoUrl: 'https://res.cloudinary.com/demo/image/upload/dismiss_item.jpg',
        category: Category.KEYS,
        locationId: testLocationId,
        foundAt: new Date(),
        description: 'Room keys found near cafeteria',
        reportedById: ownerUserId,
        status: FoundStatus.AVAILABLE,
      },
    });
    dismissListingId = listingForDismiss.id;

    const listingForRemove = await prisma.foundListing.create({
      data: {
        photoUrl: 'https://res.cloudinary.com/demo/image/upload/fake_macbook.jpg',
        category: Category.ELECTRONICS,
        locationId: testLocationId,
        foundAt: new Date(),
        description: 'Obvious scam / fake listing',
        reportedById: ownerUserId,
        status: FoundStatus.AVAILABLE,
      },
    });
    removeListingId = listingForRemove.id;

    // Submit reports
    const report1 = await createReport(
      reporterUserId,
      dismissListingId,
      'Legitimate keys, just verifying description accuracy.',
    );
    dismissReportId = report1.id;

    const report2 = await createReport(
      reporterUserId,
      removeListingId,
      'Fraudulent listing using stock internet photography.',
    );
    removeReportId = report2.id;
  });

  after(async () => {
    // Teardown created records safely
    if (dismissReportId) {
      await prisma.report.delete({ where: { id: dismissReportId } }).catch(() => {});
    }
    if (removeReportId) {
      await prisma.report.delete({ where: { id: removeReportId } }).catch(() => {});
    }
    if (dismissListingId) {
      await prisma.foundListing.delete({ where: { id: dismissListingId } }).catch(() => {});
    }
    if (removeListingId) {
      await prisma.foundListing.delete({ where: { id: removeListingId } }).catch(() => {});
    }
    if (reporterUserId) {
      await prisma.user.delete({ where: { id: reporterUserId } }).catch(() => {});
    }
    if (ownerUserId) {
      await prisma.user.delete({ where: { id: ownerUserId } }).catch(() => {});
    }
    if (adminUserId) {
      await prisma.user.delete({ where: { id: adminUserId } }).catch(() => {});
    }
  });

  it('should list pending reports with pagination and without exposing reporter email (Invariant #6)', async () => {
    const result = await listAdminReports({
      status: ReportStatus.PENDING,
      page: 1,
      pageSize: 20,
    });

    assert.ok(result.items.length >= 2);
    assert.ok(result.meta.total >= 2);

    const foundDismiss = result.items.find((r) => r.id === dismissReportId);
    assert.ok(foundDismiss);
    assert.equal(foundDismiss.status, ReportStatus.PENDING);
    assert.equal(foundDismiss.reportedBy.name, 'Alert Student');
    // Ensure email is not in the object (Invariant #6)
    assert.equal((foundDismiss.reportedBy as unknown as Record<string, unknown>).email, undefined);
    assert.ok(foundDismiss.foundListing);
    assert.equal(foundDismiss.foundListing.id, dismissListingId);
  });

  it('should resolve report as DISMISSED: marks report dismissed and clears under review badge while keeping listing available', async () => {
    const resolved = await resolveReport(adminUserId, dismissReportId, ReportStatus.DISMISSED);

    assert.equal(resolved.id, dismissReportId);
    assert.equal(resolved.status, ReportStatus.DISMISSED);
    assert.equal(resolved.reviewedBy?.name, 'Moderation Admin');
    assert.ok(resolved.reviewedAt);

    // Verify listing still exists and is available
    const listing = await getFoundListingById(dismissListingId);
    assert.equal(listing.status, 'AVAILABLE');
    // No more pending reports, so isUnderReview should be false
    assert.equal(listing.isUnderReview, false);

    // Listing must still appear in search results
    const search = await searchFoundListings({ page: 1, pageSize: 20 });
    const match = search.items.find((item) => item.id === dismissListingId);
    assert.ok(match);
    assert.equal(match.isUnderReview, false);
  });

  it('should resolve report as REMOVED: marks report removed and hides listing from search and detail (Invariant #5)', async () => {
    const resolved = await resolveReport(adminUserId, removeReportId, ReportStatus.REMOVED);

    assert.equal(resolved.id, removeReportId);
    assert.equal(resolved.status, ReportStatus.REMOVED);
    assert.equal(resolved.reviewedBy?.name, 'Moderation Admin');
    assert.ok(resolved.reviewedAt);

    // Invariant #5: getFoundListingById must now throw 404 because listing has removedAt set
    await assert.rejects(
      async () => {
        await getFoundListingById(removeListingId);
      },
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'LISTING_NOT_FOUND');
        assert.equal(error.httpStatus, 404);
        return true;
      },
    );

    // Invariant #5: searchFoundListings must exclude the removed listing
    const search = await searchFoundListings({ page: 1, pageSize: 20 });
    const match = search.items.find((item) => item.id === removeListingId);
    assert.equal(match, undefined);
  });

  it('should reject resolving an already resolved report with 409 REPORT_ALREADY_RESOLVED', async () => {
    await assert.rejects(
      async () => {
        await resolveReport(adminUserId, dismissReportId, ReportStatus.DISMISSED);
      },
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'REPORT_ALREADY_RESOLVED');
        assert.equal(error.httpStatus, 409);
        return true;
      },
    );
  });

  it('should reject resolving a non-existent report with 404 REPORT_NOT_FOUND', async () => {
    await assert.rejects(
      async () => {
        await resolveReport(adminUserId, 'non-existent-report-id', ReportStatus.DISMISSED);
      },
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'REPORT_NOT_FOUND');
        assert.equal(error.httpStatus, 404);
        return true;
      },
    );
  });
});
