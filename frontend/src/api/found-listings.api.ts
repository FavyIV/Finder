import { apiClient } from './client';
import type { FoundListing } from '../types/found-listing.types';

export async function createFoundListingApi(formData: FormData): Promise<FoundListing> {
  return apiClient<FoundListing>('/found-listings', {
    method: 'POST',
    body: formData,
  });
}
