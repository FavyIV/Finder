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

export type AdminReportListingSummary = {
  id: string;
  photoUrl: string;
  category: string;
  description: string | null;
  foundAt: string;
  status: string;
  removedAt: string | null;
  createdAt: string;
  location: {
    id: string;
    name: string;
  };
};

export type AdminReportItem = {
  id: string;
  status: ReportStatus;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  reportedBy: {
    id: string;
    name: string;
  };
  reviewedBy: {
    id: string;
    name: string;
  } | null;
  reviewedAt: string | null;
  foundListing: AdminReportListingSummary;
};

export type AdminReportFilters = {
  status?: ReportStatus;
  page?: number;
  pageSize?: number;
};

export type ResolveReportPayload = {
  status: 'DISMISSED' | 'REMOVED';
};
