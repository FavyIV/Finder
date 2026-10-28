import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  createLostListingApi,
  getLostListingsApi,
  getLostListingByIdApi,
  updateLostListingApi,
} from '../api/lost-listings.api';
import type {
  LostListing,
  CreateLostListingPayload,
  UpdateLostListingPayload,
  LostListingFilters,
  PaginationMeta,
} from '../types/lost-listing.types';
import type { ApiError, PaginatedResponse } from '../api/client';

export const LOST_LISTINGS_QUERY_KEY = ['lost-listings'] as const;

export function useLostListings(
  filters: LostListingFilters = {},
): UseQueryResult<PaginatedResponse<LostListing[], PaginationMeta>, ApiError> {
  return useQuery({
    queryKey: [...LOST_LISTINGS_QUERY_KEY, filters],
    queryFn: () => getLostListingsApi(filters),
  });
}

export function useLostListing(id: string): UseQueryResult<LostListing, ApiError> {
  return useQuery({
    queryKey: [...LOST_LISTINGS_QUERY_KEY, id],
    queryFn: () => getLostListingByIdApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateLostListing(): UseMutationResult<
  LostListing,
  ApiError,
  CreateLostListingPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLostListingApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LOST_LISTINGS_QUERY_KEY });
    },
  });
}

export function useUpdateLostListing(
  id: string,
): UseMutationResult<LostListing, ApiError, UpdateLostListingPayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLostListingPayload) => updateLostListingApi(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData([...LOST_LISTINGS_QUERY_KEY, id], updated);
      void queryClient.invalidateQueries({ queryKey: LOST_LISTINGS_QUERY_KEY });
    },
  });
}
