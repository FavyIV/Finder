import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { LostListing } from '../types/lost-listing.types';

export type LostListingCardProps = {
  listing: LostListing;
  isOwner?: boolean;
};

export function LostListingCard({ listing, isOwner = false }: LostListingCardProps): ReactElement {
  const formattedDate = new Date(listing.createdAt).toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });

  return (
    <div className="shadow-card hover:shadow-card-hover flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-150 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
          <span className="bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {listing.category}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          {listing.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
        <span className="text-gray-500 dark:text-gray-400">
          Posted by{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {listing.postedBy.name}
          </span>
        </span>

        {isOwner && (
          <Link
            to={`/lost/${listing.id}/edit`}
            className="text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 font-semibold"
          >
            ✏️ Edit
          </Link>
        )}
      </div>
    </div>
  );
}

export default LostListingCard;
