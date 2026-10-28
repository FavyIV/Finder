import { prisma } from '../lib/prisma';

export type LocationItem = {
  id: string;
  name: string;
  isSecurityPost: boolean;
};

/**
 * Returns all active campus drop-off / security post locations
 * ordered alphabetically for dropdown selection.
 */
export async function listLocations(): Promise<LocationItem[]> {
  return prisma.location.findMany({
    select: {
      id: true,
      name: true,
      isSecurityPost: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}
