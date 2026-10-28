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

export type AdminReportListingSummary = {
  id: string;
  photoUrl: string;
  category: string;
  description: string | null;
  foundAt: Date;
  status: string;
  removedAt: Date | null;
  createdAt: Date;
  location: {
    id: string;
    name: string;
  };
};

export type AdminReportItem = {
  id: string;
  status: ReportStatus;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
  reportedBy: {
    id: string;
    name: string;
  };
  reviewedBy: {
    id: string;
    name: string;
  } | null;
  reviewedAt: Date | null;
  foundListing: AdminReportListingSummary;
};

export type ListAdminReportsParams = {
  status: ReportStatus;
  page: number;
  pageSize: number;
};

export type PaginatedAdminReports = {
  items: AdminReportItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Lists reports for the admin moderation queue.
 * - Sourced only by ADMIN role.
 * - Never returns reporter/reviewer contact info (Invariant #6).
 */
export async function listAdminReports(
  params: ListAdminReportsParams,
): Promise<PaginatedAdminReports> {
  const { status, page, pageSize } = params;
  const skip = (page - 1) * pageSize;

  const [total, reports] = await Promise.all([
    prisma.report.count({
      where: { status },
    }),
    prisma.report.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        status: true,
        reason: true,
        createdAt: true,
        updatedAt: true,
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewedAt: true,
        foundListing: {
          select: {
            id: true,
            photoUrl: true,
            category: true,
            description: true,
            foundAt: true,
            status: true,
            removedAt: true,
            createdAt: true,
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: reports,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

/**
 * Resolves a report in the admin queue.
 * - Can only be resolved if current status is PENDING (otherwise 409).
 * - If status is REMOVED: sets FoundListing.removedAt to now, excluding it from search (Invariant #5).
 * - If status is DISMISSED: report status updated, listing remains available.
 * - Records acting admin ID as reviewedById and sets reviewedAt (Invariant #7).
 */
export async function resolveReport(
  adminUserId: string,
  reportId: string,
  resolutionStatus: ReportStatus,
): Promise<AdminReportItem> {
  if (resolutionStatus !== ReportStatus.DISMISSED && resolutionStatus !== ReportStatus.REMOVED) {
    throw new AppError(
      'INVALID_RESOLUTION',
      'Resolution must be either DISMISSED or REMOVED.',
      400,
    );
  }

  const existing = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      foundListingId: true,
    },
  });

  if (!existing) {
    throw new AppError('REPORT_NOT_FOUND', 'Report not found.', 404);
  }

  if (existing.status !== ReportStatus.PENDING) {
    throw new AppError('REPORT_ALREADY_RESOLVED', 'This report has already been resolved.', 409);
  }

  const now = new Date();

  // If REMOVED, execute in a transaction to update both Report and FoundListing.removedAt atomically
  if (resolutionStatus === ReportStatus.REMOVED) {
    const [updatedReport] = await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.REMOVED,
          reviewedById: adminUserId,
          reviewedAt: now,
        },
        select: {
          id: true,
          status: true,
          reason: true,
          createdAt: true,
          updatedAt: true,
          reportedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          reviewedAt: true,
          foundListing: {
            select: {
              id: true,
              photoUrl: true,
              category: true,
              description: true,
              foundAt: true,
              status: true,
              removedAt: true,
              createdAt: true,
              location: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.foundListing.update({
        where: { id: existing.foundListingId },
        data: {
          removedAt: now,
        },
      }),
    ]);

    return updatedReport;
  }

  // If DISMISSED, only update the Report
  const updatedReport = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: ReportStatus.DISMISSED,
      reviewedById: adminUserId,
      reviewedAt: now,
    },
    select: {
      id: true,
      status: true,
      reason: true,
      createdAt: true,
      updatedAt: true,
      reportedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      reviewedAt: true,
      foundListing: {
        select: {
          id: true,
          photoUrl: true,
          category: true,
          description: true,
          foundAt: true,
          status: true,
          removedAt: true,
          createdAt: true,
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return updatedReport;
}
