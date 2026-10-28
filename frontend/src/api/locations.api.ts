import { apiClient } from './client';
import type { CampusLocation } from '../types/found-listing.types';

export async function getLocationsApi(): Promise<CampusLocation[]> {
  return apiClient<CampusLocation[]>('/locations', {
    method: 'GET',
  });
}
