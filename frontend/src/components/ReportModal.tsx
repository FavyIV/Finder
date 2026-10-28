import { useState, type ReactElement, type FormEvent } from 'react';
import { useCreateReport } from '../hooks/useReports';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        <h2 id="report-modal-title" className="text-lg font-bold text-gray-900">
          🚩 Report Found Listing
        </h2>
        <p className="mt-1 text-xs text-gray-600">
          Flag this listing for campus admin review if you believe it contains fraudulent details,
          spam, or misleading information.
        </p>

        {isSuccess ? (
          <div className="my-6 rounded-md border border-green-200 bg-green-50 p-4 text-center text-xs text-green-800">
            <p className="font-semibold">✓ Report submitted successfully</p>
            <p className="mt-1 text-gray-600">
              The listing has been marked as under review and campus moderators have been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
            <div>
              <label htmlFor="report-reason" className="block text-xs font-semibold text-gray-700">
                Reason for report <span className="text-red-500">*</span>
              </label>
              <textarea
                id="report-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this listing is fraudulent, inappropriate, or incorrect (min 5 characters)..."
                className="mt-1 block w-full rounded-md border border-gray-300 p-2.5 text-xs text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                maxLength={500}
                required
              />
              <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                <span>Min 5 characters</span>
                <span>{reason.length}/500</span>
              </div>
            </div>

            {validationError && (
              <div
                role="alert"
                className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800"
              >
                {validationError}
              </div>
            )}

            {serverError && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
              >
                {serverError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={reportMutation.isPending}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportMutation.isPending || reason.trim().length < 5}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
