export type ReportStatus = 'PENDING' | 'DISMISSED' | 'REMOVED';

export type ReportItem = {
  id: string;
  reason: string | null;
  status: ReportStatus;
  foundListingId: string;
  createdAt: string;
};

export type CreateReportPayload = {
  reason: string;
};
