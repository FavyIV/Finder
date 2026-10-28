import { useState, type ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFoundListing, useClaimFoundListing } from '../hooks/useFoundListings';
import { useCurrentUser } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { ReportModal } from '../components/ReportModal';

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Loading item details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-red-700">Listing Not Found</h2>
          <p className="mt-1 text-sm text-gray-600">
            {error?.message || 'The requested item could not be found or has been removed.'}
          </p>
          <div className="mt-4">
            <Link
              to="/found"
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              Back to Search
            </Link>
          </div>
        </div>
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
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/found" className="text-brand-600 hover:text-brand-500 text-sm font-medium">
            ← Back to Found Items
          </Link>
          <StatusBadge status={listing.status} isUnderReview={listing.isUnderReview} />
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image Gallery / Preview */}
            <div className="relative aspect-square w-full bg-gray-100 sm:aspect-auto sm:h-full">
              <img
                src={listing.photoUrl}
                alt={listing.description || `${listing.category} found on campus`}
                className="h-full w-full object-contain object-center p-2"
              />
            </div>

            {/* Details Panel */}
            <div className="flex flex-col justify-between p-6 sm:p-8">
              <div className="space-y-6">
                <div>
                  <span className="text-brand-700 text-xs font-bold uppercase tracking-wider">
                    {listing.category}
                  </span>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                    {listing.description || `${listing.category} Item`}
                  </h1>
                </div>

                {/* Drop-off Location Card (Invariant #3 & Core Flow) */}
                <div className="border-brand-200 bg-brand-50 rounded-md border p-4">
                  <h3 className="text-brand-900 text-xs font-semibold uppercase tracking-wider">
                    📍 Stored Drop-Off Location
                  </h3>
                  <p className="text-brand-900 mt-1 text-lg font-bold">{listing.location.name}</p>
                  <p className="text-brand-700 mt-1 text-xs">
                    This item is held physically at the security post above. All handoffs happen in
                    person.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs">
                  <div>
                    <span className="text-gray-500">Date &amp; Time Discovered</span>
                    <p className="mt-0.5 font-medium text-gray-800">{formattedFoundAt}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Logged By</span>
                    <p className="mt-0.5 font-medium text-gray-800">{listing.reportedBy.name}</p>
                  </div>
                </div>

                {/* Claim instructions or Claimed status banner */}
                {listing.status === 'CLAIMED' ? (
                  <div className="rounded-md border border-green-200 bg-green-50 p-4 text-xs text-green-800">
                    <p className="text-sm font-semibold">✓ Item Handed Over &amp; Claimed</p>
                    <p className="mt-1">
                      This item has been successfully claimed by its verified owner at the security
                      desk and is no longer available.
                    </p>
                  </div>
                ) : listing.status === 'EXPIRED' ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                    <p className="text-sm font-semibold">⌛ Listing Expired</p>
                    <p className="mt-1">
                      This item has been stored for over 30 days without being claimed and is
                      archived.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md bg-gray-50 p-4 text-xs text-gray-600">
                    <p className="font-semibold text-gray-800">Is this your item?</p>
                    <ol className="mt-1.5 list-inside list-decimal space-y-1">
                      <li>Visit the security post listed above in person.</li>
                      <li>Present your valid school ID card.</li>
                      <li>
                        Accurately describe identifying features to the security officer on duty.
                      </li>
                      <li>Security will confirm ownership and record the claim.</li>
                    </ol>
                  </div>
                )}

                {/* Security Verification Action Box */}
                {isSecurityOrAdmin && listing.status === 'AVAILABLE' && (
                  <div className="border-brand-200 bg-brand-50/50 rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-brand-900 text-xs font-semibold">
                          🛡️ Security Verification Desk
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          Owner present at post with verified school ID?
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingClaim(true)}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Mark as Claimed
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Roles & Moderation */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Owner edit trigger (Step 6) */}
                  {isOwner && listing.status === 'AVAILABLE' && (
                    <Link
                      to={`/found/${listing.id}/edit`}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      ✏️ Edit My Listing
                    </Link>
                  )}

                  {/* Report listing button (Step 8 - Invariant #5: non-owner can flag) */}
                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(true)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 focus:outline-none"
                    >
                      🚩 Report this listing
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Listing Modal */}
        <ReportModal
          listingId={listing.id}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />

        {/* Claim Confirmation Modal */}
        {isConfirmingClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900">Confirm Handover &amp; Item Claim</h3>
              <p className="mt-2 text-xs text-gray-600">
                You are about to mark this item as claimed in the campus records. Please confirm all
                in-person security checks have been performed:
              </p>

              <ul className="mt-3 list-inside list-disc space-y-1 rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                <li>Claimant's physical Student/Staff ID has been verified.</li>
                <li>Claimant has accurately described identifying features or passcode.</li>
                <li>Item has been handed over physically to the verified owner.</li>
              </ul>

              {claimError && (
                <div
                  role="alert"
                  className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  {claimError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={claimMutation.isPending}
                  onClick={() => {
                    setIsConfirmingClaim(false);
                    setClaimError(null);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={claimMutation.isPending}
                  onClick={handleExecuteClaim}
                  className="rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {claimMutation.isPending ? 'Recording claim...' : 'Confirm Handover'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FoundListingDetailPage;
