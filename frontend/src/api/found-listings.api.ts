import { apiClient, apiClientWithMeta, type PaginatedResponse } from './client';
import type {
  FoundListing,
  SearchFoundListingsParams,
  PaginationMeta,
} from '../types/found-listing.types';

export async function createFoundListingApi(formData: FormData): Promise<FoundListing> {
  return apiClient<FoundListing>('/found-listings', {
    method: 'POST',
    body: formData,
  });
}

export async function searchFoundListingsApi(
  params: SearchFoundListingsParams = {},
): Promise<PaginatedResponse<FoundListing[], PaginationMeta>> {
  const query = new URLSearchParams();

  if (params.category) {
    query.set('category', params.category);
  }
  if (params.locationId) {
    query.set('locationId', params.locationId);
  }
  if (params.foundFrom) {
    query.set('foundFrom', params.foundFrom);
  }
  if (params.foundTo) {
    query.set('foundTo', params.foundTo);
  }
  if (params.page) {
    query.set('page', String(params.page));
  }
  if (params.pageSize) {
    query.set('pageSize', String(params.pageSize));
  }

  const queryString = query.toString();
  const endpoint = queryString ? `/found-listings?${queryString}` : '/found-listings';

  return apiClientWithMeta<FoundListing[], PaginationMeta>(endpoint, {
    method: 'GET',
  });
}

export async function getFoundListingByIdApi(id: string): Promise<FoundListing> {
  return apiClient<FoundListing>(`/found-listings/${id}`, {
    method: 'GET',
  });
}

export async function updateFoundListingApi(id: string, formData: FormData): Promise<FoundListing> {
  return apiClient<FoundListing>(`/found-listings/${id}`, {
    method: 'PATCH',
    body: formData,
  });
}
