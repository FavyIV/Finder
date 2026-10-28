import type { ReactElement } from 'react';
import type { FoundStatus } from '../types/found-listing.types';

export type StatusBadgeProps = {
  status: FoundStatus;
  isUnderReview?: boolean;
};

type BadgeConfig = {
  label: string;
  className: string;
};

const STATUS_STYLE_MAP: Record<FoundStatus, BadgeConfig> = {
  AVAILABLE: {
    label: 'Available',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  CLAIMED: {
    label: 'Claimed',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

/**
 * Renders consistent status badges across all screens.
 * Ensures text accompanies color for accessibility (styling rule).
 */
export function StatusBadge({ status, isUnderReview = false }: StatusBadgeProps): ReactElement {
  const config = STATUS_STYLE_MAP[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
      >
        {config.label}
      </span>

      {isUnderReview && (
        <span
          title="This listing has been reported and is being reviewed by moderators"
          className="inline-flex items-center rounded-full border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800"
        >
          ⚠️ Under Review
        </span>
      )}
    </div>
  );
}

export default StatusBadge;
