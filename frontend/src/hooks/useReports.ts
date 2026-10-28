import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { createReportApi } from '../api/reports.api';
import { FOUND_LISTINGS_QUERY_KEY } from './useFoundListings';
import type { ReportItem, CreateReportPayload } from '../types/report.types';
import type { ApiError } from '../api/client';

export function useCreateReport(
  listingId: string,
): UseMutationResult<ReportItem, ApiError, CreateReportPayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReportPayload) => createReportApi(listingId, payload),
    onSuccess: () => {
      // Invalidate detail query and listings list so the "Under Review" status badge reflects immediately
      void queryClient.invalidateQueries({ queryKey: [...FOUND_LISTINGS_QUERY_KEY, listingId] });
      void queryClient.invalidateQueries({ queryKey: FOUND_LISTINGS_QUERY_KEY });
    },
  });
}
