import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { useAdminReports, useResolveReport } from '../hooks/useReports';
import type { ReportStatus } from '../types/report.types';

export function AdminModerationPage(): ReactElement {
  const { data: currentUser, isLoading: isAuthLoading } = useCurrentUser();
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>('PENDING');
  const [currentPage, setCurrentPage] = useState(1);

  // Resolution modal state
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [resolutionTarget, setResolutionTarget] = useState<'DISMISSED' | 'REMOVED' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error } = useAdminReports({
    status: selectedStatus,
    page: currentPage,
    pageSize: 10,
  });

  const resolveMutation = useResolveReport();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-red-700">Access Restricted</h2>
          <p className="mt-1 text-xs text-gray-600">
            The moderation queue is strictly restricted to campus administrator accounts.
          </p>
          <div className="mt-4">
            <Link
              to="/"
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-xs font-semibold text-white"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reports = data?.data ?? [];
  const meta = data?.meta;

  const handleOpenConfirm = (reportId: string, target: 'DISMISSED' | 'REMOVED'): void => {
    setActiveReportId(reportId);
    setResolutionTarget(target);
    setActionError(null);
  };

  const handleCloseConfirm = (): void => {
    setActiveReportId(null);
    setResolutionTarget(null);
    setActionError(null);
  };

  const handleExecuteResolution = async (): Promise<void> => {
    if (!activeReportId || !resolutionTarget) return;
    setActionError(null);
    try {
      await resolveMutation.mutateAsync({
        reportId: activeReportId,
        payload: { status: resolutionTarget },
      });
      handleCloseConfirm();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Failed to resolve report.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/" className="text-brand-600 hover:text-brand-500 text-xs font-medium">
                ← Home
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-semibold text-gray-700">Admin Moderation</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              🛡️ Moderation Queue
            </h1>
            <p className="mt-1 text-xs text-gray-600">
              Review user-flagged listings for policy violations, fraud, or inappropriate content.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
              Admin: {currentUser.name}
            </span>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            {(['PENDING', 'DISMISSED', 'REMOVED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setSelectedStatus(status);
                  setCurrentPage(1);
                }}
                className={`border-b-2 pb-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  selectedStatus === status
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-white">
            <p className="text-xs text-gray-500">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-white p-6 text-center">
            <h2 className="text-sm font-bold text-red-700">Error Loading Queue</h2>
            <p className="mt-1 text-xs text-gray-600">{error.message}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
            <span className="text-2xl">✓</span>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No {selectedStatus.toLowerCase()} reports
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              There are currently no reports marked as {selectedStatus}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const formattedReportedAt = new Date(report.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              const formattedReviewedAt = report.reviewedAt
                ? new Date(report.reviewedAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : null;

              return (
                <div
                  key={report.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  <div className="p-5">
                    {/* Report Metadata Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                          🚩 Flagged by {report.reportedBy.name}
                        </span>
                        <span className="text-xs text-gray-400">• {formattedReportedAt}</span>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {report.status === 'PENDING' && (
                          <span className="inline-flex items-center rounded-full border border-yellow-300 bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                            Action Required
                          </span>
                        )}
                        {report.status === 'DISMISSED' && (
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                            Dismissed by {report.reviewedBy?.name ?? 'Admin'} ({formattedReviewedAt}
                            )
                          </span>
                        )}
                        {report.status === 'REMOVED' && (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                            Listing Removed by {report.reviewedBy?.name ?? 'Admin'} (
                            {formattedReviewedAt})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reported Reason Box */}
                    <div className="my-3 rounded-md border border-amber-200 bg-amber-50/60 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                        Reporter's Statement:
                      </p>
                      <p className="mt-1 text-xs font-medium text-amber-950">
                        "{report.reason || 'No specific statement provided.'}"
                      </p>
                    </div>

                    {/* Associated Listing Snapshot */}
                    <div className="mt-4 flex flex-col gap-4 rounded-md border border-gray-100 bg-gray-50/80 p-4 sm:flex-row sm:items-center">
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                        <img
                          src={report.foundListing.photoUrl}
                          alt={report.foundListing.description || 'Reported item'}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-brand-700 text-[11px] font-bold uppercase tracking-wider">
                            {report.foundListing.category}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            📍 {report.foundListing.location.name}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-gray-900">
                          {report.foundListing.description || 'Item listing without description'}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-xs">
                          {report.foundListing.removedAt ? (
                            <span className="font-semibold text-red-600">
                              ✕ Removed from search
                            </span>
                          ) : (
                            <Link
                              to={`/found/${report.foundListing.id}`}
                              className="text-brand-600 hover:text-brand-700 font-medium underline"
                            >
                              View full item listing →
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Admin Actions for Pending Reports */}
                      {report.status === 'PENDING' && (
                        <div className="flex flex-row gap-2 pt-2 sm:flex-col sm:border-l sm:border-gray-200 sm:pl-4 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleOpenConfirm(report.id, 'DISMISSED')}
                            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                          >
                            Dismiss Report
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenConfirm(report.id, 'REMOVED')}
                            className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Remove Listing
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page {currentPage} of {meta.totalPages} ({meta.total} total)
                </span>
                <button
                  type="button"
                  disabled={currentPage >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resolution Confirmation Modal */}
        {activeReportId && resolutionTarget && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900">
                {resolutionTarget === 'REMOVED'
                  ? 'Confirm Permanent Listing Removal'
                  : 'Confirm Report Dismissal'}
              </h3>

              <p className="mt-2 text-xs text-gray-600">
                {resolutionTarget === 'REMOVED'
                  ? 'This action will immediately remove the reported item listing from all search results and public views. This action cannot be undone.'
                  : 'Dismissing this report confirms the listing does not violate policy. The "Under Review" warning badge will be removed and the listing will remain active in search.'}
              </p>

              {actionError && (
                <div
                  role="alert"
                  className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
                >
                  {actionError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={handleCloseConfirm}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={() => void handleExecuteResolution()}
                  className={`rounded-md px-4 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    resolutionTarget === 'REMOVED'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500'
                  }`}
                >
                  {resolveMutation.isPending
                    ? 'Processing...'
                    : resolutionTarget === 'REMOVED'
                      ? 'Remove Listing'
                      : 'Dismiss Report'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminModerationPage;
