import type { Category, PaginationMeta } from './found-listing.types';

export type LostListing = {
  id: string;
  category: Category;
  description: string;
  createdAt: string;
  updatedAt: string;
  postedBy: {
    id: string;
    name: string;
  };
};

export type CreateLostListingPayload = {
  category: Category;
  description: string;
};

export type UpdateLostListingPayload = {
  category?: Category;
  description?: string;
};

export type LostListingFilters = {
  category?: Category;
  page?: number;
  pageSize?: number;
  mineOnly?: boolean;
};

export type { PaginationMeta };
