import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import { ReportStatus } from '@prisma/client';

export type CreatedReportResult = {
  id: string;
  reason: string | null;
  status: ReportStatus;
  foundListingId: string;
  createdAt: Date;
};

/**
 * Creates a report against a found listing for fraudulent or spam content.
 * - Does NOT hide or delete the listing (Invariant #5).
 * - Listing gains an "under review" badge while remaining visible in search.
 * - Prevents duplicate reports from the same user on the same listing.
 * - Records acting user ID (Invariant #7).
 */
export async function createReport(
  userId: string,
  foundListingId: string,
  reason: string,
): Promise<CreatedReportResult> {
  const listing = await prisma.foundListing.findUnique({
    where: { id: foundListingId },
    select: {
      id: true,
      reportedById: true,
      removedAt: true,
    },
  });

  if (!listing || listing.removedAt !== null) {
    throw new AppError('LISTING_NOT_FOUND', 'Found item listing not found.', 404);
  }

  if (listing.reportedById === userId) {
    throw new AppError(
      'CANNOT_REPORT_OWN_LISTING',
      'You cannot submit a report against your own listing.',
      400,
    );
  }

  // Prevent duplicate reports from the same user (enforced also by Prisma @@unique constraint)
  const existingReport = await prisma.report.findUnique({
    where: {
      reportedById_foundListingId: {
        reportedById: userId,
        foundListingId,
      },
    },
  });

  if (existingReport) {
    throw new AppError(
      'REPORT_ALREADY_SUBMITTED',
      'You have already submitted a report for this listing.',
      409,
    );
  }

  const report = await prisma.report.create({
    data: {
      reason,
      status: ReportStatus.PENDING,
      reportedById: userId,
      foundListingId,
    },
    select: {
      id: true,
      reason: true,
      status: true,
      foundListingId: true,
      createdAt: true,
    },
  });

  return report;
}
