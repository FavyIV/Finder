import { useState, type ReactElement, type FormEvent } from 'react';
import { useCreateReport } from '../hooks/useReports';
import { Button } from './ui/Button';

export type ReportModalProps = {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function ReportModal({ listingId, isOpen, onClose }: ReportModalProps): ReactElement | null {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const reportMutation = useCreateReport(listingId);

  if (!isOpen) {
    return null;
  }

  const handleClose = (): void => {
    setReason('');
    setValidationError(null);
    setServerError(null);
    setIsSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setValidationError(null);
    setServerError(null);

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      setValidationError('Please provide a reason of at least 5 characters.');
      return;
    }
    if (trimmedReason.length > 500) {
      setValidationError('Report reason cannot exceed 500 characters.');
      return;
    }

    try {
      await reportMutation.mutateAsync({ reason: trimmedReason });
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to submit report. Please try again.');
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="backdrop-blur-xs animate-fade-in fixed inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="shadow-dialog animate-slide-in relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <h2
              id="report-modal-title"
              className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100"
            >
              🚩 Report Found Listing
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Flag this listing for campus admin review if you notice suspicious or fraudulent
              details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="my-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center text-xs text-green-800 dark:border-green-800 dark:bg-green-950/60 dark:text-green-300">
            <span className="text-2xl">✓</span>
            <p className="mt-2 text-sm font-bold">Report submitted successfully</p>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              The listing has been marked as Under Review and campus moderators have been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="report-reason"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
              >
                Reason for report <span className="text-red-500">*</span>
              </label>
              <textarea
                id="report-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this listing is fraudulent, inappropriate, or incorrect..."
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                maxLength={500}
                required
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
                <span>Min 5 characters</span>
                <span>{reason.length}/500</span>
              </div>
            </div>

            {validationError && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              >
                {validationError}
              </div>
            )}

            {serverError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
              >
                {serverError}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleClose}
                disabled={reportMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="md"
                loading={reportMutation.isPending}
                disabled={reportMutation.isPending || reason.trim().length < 5}
              >
                {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
