import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  createFoundListingApi,
  searchFoundListingsApi,
  getFoundListingByIdApi,
} from '../api/found-listings.api';
import type {
  FoundListing,
  SearchFoundListingsParams,
  PaginationMeta,
} from '../types/found-listing.types';
import type { ApiError, PaginatedResponse } from '../api/client';

export const FOUND_LISTINGS_QUERY_KEY = ['found-listings'] as const;

export function useSearchFoundListings(
  params: SearchFoundListingsParams = {},
): UseQueryResult<PaginatedResponse<FoundListing[], PaginationMeta>, ApiError> {
  return useQuery({
    queryKey: [...FOUND_LISTINGS_QUERY_KEY, params],
    queryFn: () => searchFoundListingsApi(params),
  });
}

export function useFoundListing(id: string): UseQueryResult<FoundListing, ApiError> {
  return useQuery({
    queryKey: [...FOUND_LISTINGS_QUERY_KEY, id],
    queryFn: () => getFoundListingByIdApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateFoundListing(): UseMutationResult<FoundListing, ApiError, FormData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFoundListingApi,
    onSuccess: () => {
      // Invalidate found-listings list queries once created
      void queryClient.invalidateQueries({ queryKey: FOUND_LISTINGS_QUERY_KEY });
    },
  });
}
