import { apiClient, apiClientWithMeta, type PaginatedResponse } from './client';
import type {
  ReportItem,
  CreateReportPayload,
  AdminReportItem,
  AdminReportFilters,
  ResolveReportPayload,
} from '../types/report.types';
import type { PaginationMeta } from '../types/found-listing.types';

export async function createReportApi(
  listingId: string,
  payload: CreateReportPayload,
): Promise<ReportItem> {
  return apiClient<ReportItem>(`/found-listings/${listingId}/report`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAdminReportsApi(
  filters: AdminReportFilters = {},
): Promise<PaginatedResponse<AdminReportItem[], PaginationMeta>> {
  const query = new URLSearchParams();

  if (filters.status) {
    query.set('status', filters.status);
  }
  if (filters.page) {
    query.set('page', String(filters.page));
  }
  if (filters.pageSize) {
    query.set('pageSize', String(filters.pageSize));
  }

  const queryString = query.toString();
  const endpoint = queryString ? `/admin/reports?${queryString}` : '/admin/reports';

  return apiClientWithMeta<AdminReportItem[], PaginationMeta>(endpoint, {
    method: 'GET',
  });
}

export async function resolveAdminReportApi(
  reportId: string,
  payload: ResolveReportPayload,
): Promise<AdminReportItem> {
  return apiClient<AdminReportItem>(`/admin/reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
