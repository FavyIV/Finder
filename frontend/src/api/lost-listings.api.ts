import { apiClient, apiClientWithMeta, type PaginatedResponse } from './client';
import type {
  LostListing,
  CreateLostListingPayload,
  UpdateLostListingPayload,
  LostListingFilters,
  PaginationMeta,
} from '../types/lost-listing.types';

export async function createLostListingApi(
  payload: CreateLostListingPayload,
): Promise<LostListing> {
  return apiClient<LostListing>('/lost-listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getLostListingsApi(
  filters: LostListingFilters = {},
): Promise<PaginatedResponse<LostListing[], PaginationMeta>> {
  const query = new URLSearchParams();

  if (filters.category) {
    query.set('category', filters.category);
  }
  if (filters.page) {
    query.set('page', String(filters.page));
  }
  if (filters.pageSize) {
    query.set('pageSize', String(filters.pageSize));
  }
  if (filters.mineOnly) {
    query.set('mineOnly', 'true');
  }

  const queryString = query.toString();
  const endpoint = queryString ? `/lost-listings?${queryString}` : '/lost-listings';

  return apiClientWithMeta<LostListing[], PaginationMeta>(endpoint, {
    method: 'GET',
  });
}

export async function getLostListingByIdApi(id: string): Promise<LostListing> {
  return apiClient<LostListing>(`/lost-listings/${id}`, {
    method: 'GET',
  });
}

export async function updateLostListingApi(
  id: string,
  payload: UpdateLostListingPayload,
): Promise<LostListing> {
  return apiClient<LostListing>(`/lost-listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
