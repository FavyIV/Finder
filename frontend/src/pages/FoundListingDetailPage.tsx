import { useState, type ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFoundListing, useClaimFoundListing } from '../hooks/useFoundListings';
import { useCurrentUser } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { ReportModal } from '../components/ReportModal';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';

export function FoundListingDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const listingId = id ?? '';
  const { data: listing, isLoading, error } = useFoundListing(listingId);
  const { data: currentUser } = useCurrentUser();
  const claimMutation = useClaimFoundListing(listingId);

  const [isConfirmingClaim, setIsConfirmingClaim] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="shadow-card overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <Skeleton variant="full" className="min-h-[340px]" />
            <div className="space-y-4 p-6 sm:p-8">
              <Skeleton variant="text" count={2} />
              <Skeleton variant="card" className="h-28" />
              <Skeleton variant="text" count={4} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-8">
        <Card padding="lg" className="max-w-md text-center">
          <div className="mb-3 text-4xl">🔍</div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Listing Not Found</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error?.message || 'The requested item could not be found or has been removed.'}
          </p>
          <div className="mt-6">
            <Link to="/found">
              <Button variant="primary">Back to Found Items</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const formattedFoundAt = new Date(listing.foundAt).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const isOwner = currentUser?.id === listing.reportedBy.id;
  const isSecurityOrAdmin = currentUser?.role === 'SECURITY' || currentUser?.role === 'ADMIN';

  const handleExecuteClaim = async (): Promise<void> => {
    setClaimError(null);
    try {
      await claimMutation.mutateAsync();
      setIsConfirmingClaim(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setClaimError(err.message);
      } else {
        setClaimError('Failed to record item claim.');
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb & Badges */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/found"
          className="text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 text-xs font-semibold"
        >
          ← Back to Found Items
        </Link>
        <StatusBadge status={listing.status} isUnderReview={listing.isUnderReview} />
      </div>

      <div className="shadow-card overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Display */}
          <div className="relative flex aspect-square w-full items-center justify-center bg-gray-100 p-4 md:aspect-auto dark:bg-gray-800">
            <img
              src={listing.photoUrl}
              alt={listing.description || `${listing.category} found on campus`}
              className="max-h-[460px] w-full rounded-xl object-contain"
            />
          </div>

          {/* Details Panel */}
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <span className="bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {listing.category}
                </span>
                <h1 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-gray-900 dark:text-gray-100">
                  {listing.description || `${listing.category} Item`}
                </h1>
              </div>

              {/* Security Post Drop-off Callout */}
              <div className="border-brand-200 dark:border-brand-800 bg-brand-50/70 dark:bg-brand-950/60 rounded-2xl border p-5">
                <span className="text-brand-700 dark:text-brand-300 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                  📍 Stored Drop-Off Security Post
                </span>
                <p className="text-brand-900 dark:text-brand-100 mt-1 text-lg font-extrabold">
                  {listing.location.name}
                </p>
                <p className="text-brand-800/80 dark:text-brand-300/80 mt-1 text-xs leading-relaxed">
                  This item is held physically at the campus security desk above. All claims and
                  handoffs must be conducted in person with a valid student or staff ID.
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs dark:border-gray-800">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Date &amp; Time Discovered
                  </span>
                  <p className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
                    {formattedFoundAt}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Logged By</span>
                  <p className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
                    {listing.reportedBy.name}
                  </p>
                </div>
              </div>

              {/* Status Instructions */}
              {listing.status === 'CLAIMED' ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-xs text-green-800 dark:border-green-800 dark:bg-green-950/60 dark:text-green-300">
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <span>✓</span> Handed Over &amp; Claimed
                  </p>
                  <p className="mt-1">
                    This item was verified and collected by its owner at the campus security desk.
                  </p>
                </div>
              ) : listing.status === 'EXPIRED' ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <p className="text-sm font-bold">⌛ Listing Expired</p>
                  <p className="mt-1">
                    This item remained unclaimed for over 30 days and has been archived per campus
                    policy.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-4 text-xs text-gray-600 dark:bg-gray-800/80 dark:text-gray-300">
                  <p className="font-bold text-gray-900 dark:text-gray-100">Is this item yours?</p>
                  <ol className="mt-2 list-inside list-decimal space-y-1">
                    <li>Visit the security post listed above in person.</li>
                    <li>Present your valid school ID card.</li>
                    <li>Accurately describe identifying features or unlock code to the officer.</li>
                    <li>Security will confirm ownership and record the claim in the system.</li>
                  </ol>
                </div>
              )}

              {/* Security Officer Verification Panel */}
              {isSecurityOrAdmin && listing.status === 'AVAILABLE' && (
                <div className="border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/50 rounded-2xl border p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-brand-900 dark:text-brand-100 text-xs font-bold uppercase tracking-wider">
                        🛡️ Security Desk Action
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                        Owner physically present with verified student/staff ID?
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsConfirmingClaim(true)}
                      className="shrink-0 bg-green-600 hover:bg-green-700 active:bg-green-800"
                    >
                      Mark as Claimed
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              {isOwner && listing.status === 'AVAILABLE' ? (
                <Link to={`/found/${listing.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    ✏️ Edit Listing
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {!isOwner && (
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs font-semibold text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
                >
                  🚩 Report this listing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        listingId={listing.id}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Security Claim Confirmation Dialog */}
      <Dialog
        isOpen={isConfirmingClaim}
        onClose={() => {
          setIsConfirmingClaim(false);
          setClaimError(null);
        }}
        title="Confirm Handover & Claim"
      >
        <p className="text-xs text-gray-600 dark:text-gray-300">
          You are about to record this item as claimed in the campus records. Please confirm all
          mandatory physical checks:
        </p>

        <ul className="mt-3 list-inside list-disc space-y-1.5 rounded-xl bg-gray-50 p-3.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <li>Claimant's physical Student or Staff ID has been inspected.</li>
          <li>Claimant has accurately described identifying features or passcode.</li>
          <li>The physical item has been handed over directly to the verified owner.</li>
        </ul>

        {claimError && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
          >
            {claimError}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={claimMutation.isPending}
            onClick={() => {
              setIsConfirmingClaim(false);
              setClaimError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={claimMutation.isPending}
            onClick={handleExecuteClaim}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirm Handover
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default FoundListingDetailPage;
