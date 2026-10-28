import { apiClient } from './client';
import type { ReportItem, CreateReportPayload } from '../types/report.types';

export async function createReportApi(
  listingId: string,
  payload: CreateReportPayload,
): Promise<ReportItem> {
  return apiClient<ReportItem>(`/found-listings/${listingId}/report`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
