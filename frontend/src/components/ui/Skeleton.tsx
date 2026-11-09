import type { ReactElement } from 'react';

export interface SkeletonProps {
  variant?: 'card' | 'text' | 'avatar' | 'full';
  count?: number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  count = 1,
  className = '',
}: SkeletonProps): ReactElement {
  if (variant === 'text' && count > 1) {
    return (
      <div className="w-full space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`skeleton h-4 w-full ${i === count - 1 ? 'w-3/4' : ''} ${className}`}
          />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return <div className={`skeleton h-10 w-10 shrink-0 rounded-full ${className}`} />;
  }

  if (variant === 'card') {
    return <div className={`skeleton h-64 w-full rounded-2xl ${className}`} />;
  }

  if (variant === 'full') {
    return <div className={`skeleton h-full w-full rounded-2xl ${className}`} />;
  }

  return <div className={`skeleton h-4 w-full ${className}`} />;
}

export function CardSkeletonGrid({ count = 8 }: { count?: number }): ReactElement {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shadow-card overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="skeleton aspect-[3/2] w-full" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-3.5 w-1/3" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-3 w-1/2 pt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
