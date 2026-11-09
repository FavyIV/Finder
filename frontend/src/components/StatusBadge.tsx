import type { ReactElement } from 'react';
import type { FoundStatus } from '../types/found-listing.types';

export type StatusBadgeProps = {
  status: FoundStatus;
  isUnderReview?: boolean;
};

type BadgeConfig = {
  label: string;
  className: string;
  dotClassName: string;
};

const STATUS_STYLE_MAP: Record<FoundStatus, BadgeConfig> = {
  AVAILABLE: {
    label: 'Available',
    className:
      'bg-green-100 dark:bg-green-950/70 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    dotClassName: 'bg-green-500',
  },
  CLAIMED: {
    label: 'Claimed',
    className:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dotClassName: 'bg-slate-400',
  },
  EXPIRED: {
    label: 'Expired',
    className:
      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    dotClassName: 'bg-gray-400',
  },
};

/**
 * Renders consistent status badges across all screens.
 * Ensures text accompanies color dot for accessibility.
 */
export function StatusBadge({ status, isUnderReview = false }: StatusBadgeProps): ReactElement {
  const config = STATUS_STYLE_MAP[status] ?? {
    label: status,
    className:
      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    dotClassName: 'bg-gray-400',
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`} aria-hidden="true" />
        {config.label}
      </span>

      {isUnderReview && (
        <span
          title="This listing has been reported and is being reviewed by moderators"
          className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          Under Review
        </span>
      )}
    </div>
  );
}

export default StatusBadge;
