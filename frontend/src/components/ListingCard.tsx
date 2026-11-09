import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import type { FoundListing } from '../types/found-listing.types';

export type ListingCardProps = {
  listing: FoundListing;
};

export function ListingCard({ listing }: ListingCardProps): ReactElement {
  const formattedDate = new Date(listing.foundAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      to={`/found/${listing.id}`}
      className="shadow-card hover:shadow-card-hover group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-150 hover:-translate-y-0.5 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={listing.photoUrl}
          alt={listing.description || `${listing.category} found on campus`}
          className="h-full w-full object-cover object-center transition duration-200 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute right-2.5 top-2.5">
          <StatusBadge status={listing.status} isUnderReview={listing.isUnderReview} />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <span className="bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {listing.category}
          </span>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
            {listing.description || 'No additional description provided.'}
          </p>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 truncate font-medium text-gray-800 dark:text-gray-200">
              <span aria-hidden="true">📍</span> {listing.location.name}
            </span>
            <span className="shrink-0">{formattedDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ListingCard;
