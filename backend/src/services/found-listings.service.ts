import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import { FoundStatus } from '@prisma/client';
import type { CreateFoundListingInput } from '../schemas/found-listings.schema';
import type { Category } from '@prisma/client';

export type FoundListingDetail = {
  id: string;
  photoUrl: string;
  category: Category;
  description: string | null;
  foundAt: Date;
  status: FoundStatus;
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

  return listing;
}
