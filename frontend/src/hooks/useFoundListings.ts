import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { createFoundListingApi } from '../api/found-listings.api';
import type { FoundListing } from '../types/found-listing.types';
import type { ApiError } from '../api/client';

export const FOUND_LISTINGS_QUERY_KEY = ['found-listings'] as const;

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
