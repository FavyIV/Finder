import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { createReportApi, getAdminReportsApi, resolveAdminReportApi } from '../api/reports.api';
import { FOUND_LISTINGS_QUERY_KEY } from './useFoundListings';
import type {
  ReportItem,
  CreateReportPayload,
  AdminReportItem,
  AdminReportFilters,
  ResolveReportPayload,
} from '../types/report.types';
import type { PaginationMeta } from '../types/found-listing.types';
import type { ApiError, PaginatedResponse } from '../api/client';

export const ADMIN_REPORTS_QUERY_KEY = ['admin-reports'] as const;

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

export function useAdminReports(
  filters: AdminReportFilters = {},
): UseQueryResult<PaginatedResponse<AdminReportItem[], PaginationMeta>, ApiError> {
  return useQuery({
    queryKey: [...ADMIN_REPORTS_QUERY_KEY, filters],
    queryFn: () => getAdminReportsApi(filters),
  });
}

export function useResolveReport(): UseMutationResult<
  AdminReportItem,
  ApiError,
  { reportId: string; payload: ResolveReportPayload }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, payload }) => resolveAdminReportApi(reportId, payload),
    onSuccess: (resolvedReport) => {
      // Invalidate admin reports query
      void queryClient.invalidateQueries({ queryKey: ADMIN_REPORTS_QUERY_KEY });
      // Invalidate found listings so changes (such as removal or badge clearing) update immediately
      void queryClient.invalidateQueries({ queryKey: FOUND_LISTINGS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...FOUND_LISTINGS_QUERY_KEY, resolvedReport.foundListing.id],
      });
    },
  });
}
