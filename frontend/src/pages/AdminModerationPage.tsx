import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { useAdminReports, useResolveReport } from '../hooks/useReports';
import type { ReportStatus } from '../types/report.types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <p className="text-sm text-gray-500">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon="🚫"
          title="Access Restricted"
          description="The moderation queue is strictly restricted to authorized campus administrator accounts."
          actions={[{ label: 'Return to Home', href: '/', variant: 'primary' }]}
        />
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            <span>🛡️</span> Moderation Queue
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review user-flagged listings for policy violations, misleading drop-offs, or fraud.
          </p>
        </div>

        <div>
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            Admin: {currentUser.name}
          </span>
        </div>
      </div>

      {/* Status Filter Pill Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-2xl bg-gray-200/70 p-1 dark:bg-gray-800/80">
        {(['PENDING', 'DISMISSED', 'REMOVED'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setSelectedStatus(status);
              setCurrentPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 ${
              selectedStatus === status
                ? 'shadow-xs bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="shadow-card rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex gap-4">
                <Skeleton variant="avatar" className="h-20 w-20 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="w-1/3" />
                  <Skeleton variant="text" count={2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
        >
          <p className="text-base font-bold">Error Loading Queue</p>
          <p className="mt-1 text-xs">{error.message}</p>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon="✓"
          title={`No ${selectedStatus.toLowerCase()} reports`}
          description={`There are currently no listings flagged with ${selectedStatus} status in the queue.`}
        />
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
              <Card key={report.id} padding="md">
                {/* Report Metadata Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
                      🚩 Flagged by {report.reportedBy.name}
                    </span>
                    <span className="text-xs text-gray-400">• {formattedReportedAt}</span>
                  </div>

                  <div>
                    {report.status === 'PENDING' && (
                      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
                        Action Required
                      </span>
                    )}
                    {report.status === 'DISMISSED' && (
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        Dismissed by {report.reviewedBy?.name ?? 'Admin'} ({formattedReviewedAt})
                      </span>
                    )}
                    {report.status === 'REMOVED' && (
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/70 dark:text-red-300">
                        Listing Removed by {report.reviewedBy?.name ?? 'Admin'} (
                        {formattedReviewedAt})
                      </span>
                    )}
                  </div>
                </div>

                {/* Reporter Reason Box */}
                <div className="my-3.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-800 dark:bg-amber-950/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Reporter's Statement:
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-amber-950 dark:text-amber-100">
                    "{report.reason || 'No specific statement provided.'}"
                  </p>
                </div>

                {/* Associated Listing Snapshot */}
                <div className="dark:bg-gray-850 mt-4 flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 sm:flex-row sm:items-center dark:border-gray-800">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <img
                      src={report.foundListing.photoUrl}
                      alt={report.foundListing.description || 'Reported item'}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-brand-700 dark:text-brand-300 text-[10px] font-bold uppercase tracking-wider">
                        {report.foundListing.category}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        📍 {report.foundListing.location.name}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {report.foundListing.description || 'Item listing without description'}
                    </p>

                    <div className="pt-1 text-xs">
                      {report.foundListing.removedAt ? (
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          ✕ Removed from public search
                        </span>
                      ) : (
                        <Link
                          to={`/found/${report.foundListing.id}`}
                          className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-semibold"
                        >
                          View full item listing →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Actions for Pending Reports */}
                  {report.status === 'PENDING' && (
                    <div className="flex flex-row gap-2 pt-2 sm:flex-col sm:border-l sm:border-gray-200 sm:pl-4 sm:pt-0 dark:sm:border-gray-700">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenConfirm(report.id, 'DISMISSED')}
                      >
                        Dismiss Report
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenConfirm(report.id, 'REMOVED')}
                      >
                        Remove Listing
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="px-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                Page {currentPage} of {meta.totalPages} ({meta.total} total)
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= meta.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Resolution Confirmation Modal */}
      <Dialog
        isOpen={Boolean(activeReportId && resolutionTarget)}
        onClose={handleCloseConfirm}
        title={
          resolutionTarget === 'REMOVED'
            ? 'Confirm Permanent Removal'
            : 'Dismiss Report & Clear Flag'
        }
      >
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          {resolutionTarget === 'REMOVED' ? (
            <>
              You are about to permanently remove this listing from the public directory. It will no
              longer appear in search results, and users will not be able to interact with it.
            </>
          ) : (
            <>
              You are about to dismiss this user flag. The listing will remain active and the{' '}
              <strong className="text-amber-600">Under Review</strong> notice will be cleared.
            </>
          )}
        </p>

        {actionError && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
          >
            {actionError}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={resolveMutation.isPending}
            onClick={handleCloseConfirm}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={resolutionTarget === 'REMOVED' ? 'danger' : 'primary'}
            size="md"
            loading={resolveMutation.isPending}
            onClick={handleExecuteResolution}
          >
            {resolutionTarget === 'REMOVED' ? 'Remove Listing' : 'Dismiss Flag'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default AdminModerationPage;
