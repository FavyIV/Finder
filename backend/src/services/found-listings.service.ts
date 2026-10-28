import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import { FoundStatus, type Category, type Prisma } from '@prisma/client';
import { notExpiredWhere, isListingExpired } from './listing-expiry';
import type {
  CreateFoundListingInput,
  SearchFoundListingsQuery,
  UpdateFoundListingInput,
} from '../schemas/found-listings.schema';

export type EffectiveFoundStatus = 'AVAILABLE' | 'CLAIMED' | 'EXPIRED';

export type FoundListingDetail = {
  id: string;
  photoUrl: string;
  category: Category;
  description: string | null;
  foundAt: Date;
  status: EffectiveFoundStatus;
  isUnderReview: boolean;
  createdAt: Date;
  location: {
    id: string;
    name: string;
    isSecurityPost: boolean;
  };
  reportedBy: {
    id: string;
    name: string;
  };
};

export type SearchFoundListingsResult = {
  items: FoundListingDetail[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Creates a new found-item listing.
 * - Enforces that the drop-off location exists.
 * - Populates reportedById from authenticated session (Invariant #7).
 * - Saves status as AVAILABLE.
 * - Never returns contact info of reporter (Invariant #6).
 */
export async function createFoundListing(
  userId: string,
  input: CreateFoundListingInput,
  photoUrl: string,
): Promise<FoundListingDetail> {
  const location = await prisma.location.findUnique({
    where: { id: input.locationId },
  });

  if (!location) {
    throw new AppError('LOCATION_NOT_FOUND', 'Selected drop-off location does not exist.', 404);
  }

  const listing = await prisma.foundListing.create({
    data: {
      photoUrl,
      category: input.category,
      locationId: input.locationId,
      foundAt: input.foundAt,
      description: input.description ?? null,
      reportedById: userId,
      status: FoundStatus.AVAILABLE,
    },
    select: {
      id: true,
      photoUrl: true,
      category: true,
      description: true,
      foundAt: true,
      status: true,
      createdAt: true,
      location: {
        select: {
          id: true,
          name: true,
          isSecurityPost: true,
        },
      },
      reportedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    ...listing,
    status: 'AVAILABLE',
    isUnderReview: false,
  };
}

/**
 * Searches and filters found-item listings.
 * - Excludes listings that are removed by admin (Invariant #5).
 * - Automatically excludes listings older than 30 days via notExpiredWhere() (Goal #5).
 * - Listings under active review remain visible with isUnderReview = true (Invariant #5).
 * - Supports structured filtering by category, locationId, and foundAt date range (Goal #2).
 * - Applies standard pagination (max pageSize 50).
 */
export async function searchFoundListings(
  query: SearchFoundListingsQuery,
): Promise<SearchFoundListingsResult> {
  const { category, locationId, foundFrom, foundTo, page, pageSize } = query;

  // Build where clause
  const where: Prisma.FoundListingWhereInput = {
    removedAt: null,
    status: FoundStatus.AVAILABLE,
    ...notExpiredWhere(),
  };

  if (category) {
    where.category = category;
  }

  if (locationId) {
    where.locationId = locationId;
  }

  if (foundFrom || foundTo) {
    where.foundAt = {};
    if (foundFrom) {
      where.foundAt.gte = foundFrom;
    }
    if (foundTo) {
      where.foundAt.lte = foundTo;
    }
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [total, listings] = await Promise.all([
    prisma.foundListing.count({ where }),
    prisma.foundListing.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        photoUrl: true,
        category: true,
        description: true,
        foundAt: true,
        status: true,
        createdAt: true,
        location: {
          select: {
            id: true,
            name: true,
            isSecurityPost: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        reports: {
          where: {
            status: 'PENDING',
          },
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  const items: FoundListingDetail[] = listings.map((item) => ({
    id: item.id,
    photoUrl: item.photoUrl,
    category: item.category,
    description: item.description,
    foundAt: item.foundAt,
    status: 'AVAILABLE',
    isUnderReview: item.reports.length > 0,
    createdAt: item.createdAt,
    location: item.location,
    reportedBy: item.reportedBy,
  }));

  const totalPages = Math.ceil(total / pageSize);

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

/**
 * Retrieves a single found-item listing by ID.
 * - Computes read-time expiry: if createdAt > 30 days and status is AVAILABLE, returns EXPIRED.
 * - Returns isUnderReview: true if an active PENDING report exists.
 * - Throws 404 if listing does not exist or was removed by admin.
 */
export async function getFoundListingById(id: string): Promise<FoundListingDetail> {
  const listing = await prisma.foundListing.findUnique({
    where: { id },
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
          isSecurityPost: true,
        },
      },
      reportedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      reports: {
        where: {
          status: 'PENDING',
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!listing || listing.removedAt !== null) {
    throw new AppError('LISTING_NOT_FOUND', 'Found item listing not found.', 404);
  }

  let effectiveStatus: EffectiveFoundStatus = listing.status;
  if (listing.status === FoundStatus.AVAILABLE && isListingExpired(listing.createdAt)) {
    effectiveStatus = 'EXPIRED';
  }

  return {
    id: listing.id,
    photoUrl: listing.photoUrl,
    category: listing.category,
    description: listing.description,
    foundAt: listing.foundAt,
    status: effectiveStatus,
    isUnderReview: listing.reports.length > 0,
    createdAt: listing.createdAt,
    location: listing.location,
    reportedBy: listing.reportedBy,
  };
}

/**
 * Updates a found listing (owner-only, while status is AVAILABLE).
 * - Enforces ownership (Invariant #4).
 * - Blocks edits if listing is CLAIMED or EXPIRED (Invariant #4).
 * - Preserves PENDING report status if the listing was under review (decision recorded in spec).
 * - Validates locationId if updated.
 */
export async function updateFoundListing(
  userId: string,
  listingId: string,
  input: UpdateFoundListingInput,
  photoUrl?: string,
): Promise<FoundListingDetail> {
  const listing = await prisma.foundListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      removedAt: true,
      reportedById: true,
      reports: {
        where: {
          status: 'PENDING',
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!listing || listing.removedAt !== null) {
    throw new AppError('LISTING_NOT_FOUND', 'Found item listing not found.', 404);
  }

  // Enforce ownership: only the user who reported the item may edit it
  if (listing.reportedById !== userId) {
    throw new AppError('NOT_LISTING_OWNER', 'You can only edit listings you reported.', 403);
  }

  // Enforce status constraint: can only edit while AVAILABLE and not expired
  if (listing.status !== FoundStatus.AVAILABLE || isListingExpired(listing.createdAt)) {
    throw new AppError(
      'LISTING_NOT_EDITABLE',
      'Listings that are claimed or expired cannot be edited.',
      409,
    );
  }

  // If location is being updated, verify it exists
  if (input.locationId) {
    const location = await prisma.location.findUnique({
      where: { id: input.locationId },
    });
    if (!location) {
      throw new AppError('LOCATION_NOT_FOUND', 'Selected drop-off location does not exist.', 404);
    }
  }

  const updated = await prisma.foundListing.update({
    where: { id: listingId },
    data: {
      category: input.category,
      locationId: input.locationId,
      foundAt: input.foundAt,
      description: input.description,
      ...(photoUrl ? { photoUrl } : {}),
    },
    select: {
      id: true,
      photoUrl: true,
      category: true,
      description: true,
      foundAt: true,
      status: true,
      createdAt: true,
      location: {
        select: {
          id: true,
          name: true,
          isSecurityPost: true,
        },
      },
      reportedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    ...updated,
    status: 'AVAILABLE',
    isUnderReview: listing.reports.length > 0,
  };
}

/**
 * Marks a found listing as CLAIMED by a staff member (SECURITY or ADMIN).
 * - Enforces state transitions: only AVAILABLE items can be claimed.
 * - Rejects already CLAIMED items (409 ALREADY_CLAIMED).
 * - Rejects EXPIRED items (409 LISTING_EXPIRED).
 * - Records claimedById and claimedAt (Invariants #3, #7).
 */
export async function claimFoundListing(
  staffUserId: string,
  listingId: string,
): Promise<FoundListingDetail> {
  const listing = await prisma.foundListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      removedAt: true,
      reports: {
        where: {
          status: 'PENDING',
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!listing || listing.removedAt !== null) {
    throw new AppError('LISTING_NOT_FOUND', 'Found item listing not found.', 404);
  }

  if (listing.status === FoundStatus.CLAIMED) {
    throw new AppError('ALREADY_CLAIMED', 'This item has already been marked as claimed.', 409);
  }

  if (isListingExpired(listing.createdAt)) {
    throw new AppError('LISTING_EXPIRED', 'Expired listings cannot be marked as claimed.', 409);
  }

  const updated = await prisma.foundListing.update({
    where: { id: listingId },
    data: {
      status: FoundStatus.CLAIMED,
      claimedById: staffUserId,
      claimedAt: new Date(),
    },
    select: {
      id: true,
      photoUrl: true,
      category: true,
      description: true,
      foundAt: true,
      status: true,
      createdAt: true,
      location: {
        select: {
          id: true,
          name: true,
          isSecurityPost: true,
        },
      },
      reportedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    ...updated,
    status: 'CLAIMED',
    isUnderReview: listing.reports.length > 0,
  };
}
