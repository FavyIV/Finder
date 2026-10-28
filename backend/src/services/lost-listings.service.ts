import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import type { Category, Prisma } from '@prisma/client';
import type {
  CreateLostListingInput,
  UpdateLostListingInput,
  QueryLostListingsInput,
} from '../schemas/lost-listings.schema';

export type LostListingItem = {
  id: string;
  category: Category;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  postedBy: {
    id: string;
    name: string;
  };
};

export type PaginatedLostListings = {
  items: LostListingItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Creates a new lost-item listing.
 * - Records acting user ID (Invariant #7).
 * - Never returns user contact details (Invariant #6).
 */
export async function createLostListing(
  userId: string,
  input: CreateLostListingInput,
): Promise<LostListingItem> {
  const listing = await prisma.lostListing.create({
    data: {
      category: input.category,
      description: input.description,
      postedById: userId,
    },
    select: {
      id: true,
      category: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      postedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return listing;
}

/**
 * Lists lost-item listings.
 * - Visible to all authenticated users per decision #5.
 * - Allows filtering by category or own listings (mineOnly).
 */
export async function listLostListings(
  params: Partial<QueryLostListingsInput> = {},
  currentUserId?: string,
): Promise<PaginatedLostListings> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const { category, mineOnly } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.LostListingWhereInput = {};

  if (category) {
    where.category = category;
  }

  if (mineOnly && currentUserId) {
    where.postedById = currentUserId;
  }

  const [total, items] = await Promise.all([
    prisma.lostListing.count({ where }),
    prisma.lostListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        category: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        postedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

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
 * Retrieves a single lost-item listing by ID.
 */
export async function getLostListingById(id: string): Promise<LostListingItem> {
  const listing = await prisma.lostListing.findUnique({
    where: { id },
    select: {
      id: true,
      category: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      postedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!listing) {
    throw new AppError('LOST_LISTING_NOT_FOUND', 'Lost item listing not found.', 404);
  }

  return listing;
}

/**
 * Updates a lost-item listing.
 * - Restricted to the owner (postedById === userId).
 */
export async function updateLostListing(
  userId: string,
  id: string,
  input: UpdateLostListingInput,
): Promise<LostListingItem> {
  const existing = await prisma.lostListing.findUnique({
    where: { id },
    select: {
      id: true,
      postedById: true,
    },
  });

  if (!existing) {
    throw new AppError('LOST_LISTING_NOT_FOUND', 'Lost item listing not found.', 404);
  }

  if (existing.postedById !== userId) {
    throw new AppError('NOT_LISTING_OWNER', 'You are not authorized to edit this listing.', 403);
  }

  const updated = await prisma.lostListing.update({
    where: { id },
    data: {
      ...(input.category ? { category: input.category } : {}),
      ...(input.description ? { description: input.description } : {}),
    },
    select: {
      id: true,
      category: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      postedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return updated;
}
