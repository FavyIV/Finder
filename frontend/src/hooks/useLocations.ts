import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getLocationsApi } from '../api/locations.api';
import type { CampusLocation } from '../types/found-listing.types';
import type { ApiError } from '../api/client';

export const LOCATIONS_QUERY_KEY = ['locations'] as const;

export function useLocations(): UseQueryResult<CampusLocation[], ApiError> {
  return useQuery({
    queryKey: LOCATIONS_QUERY_KEY,
    queryFn: getLocationsApi,
    staleTime: 1000 * 60 * 10, // 10 minutes - locations change infrequently
  });
}
