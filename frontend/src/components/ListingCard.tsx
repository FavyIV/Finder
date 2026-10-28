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
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={listing.photoUrl}
          alt={listing.description || `${listing.category} found on campus`}
          className="h-full w-full object-cover object-center transition duration-200 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute right-2 top-2">
          <StatusBadge status={listing.status} isUnderReview={listing.isUnderReview} />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <span className="text-brand-700 text-xs font-semibold uppercase tracking-wider">
            {listing.category}
          </span>
          <p className="mt-1 line-clamp-2 text-sm text-gray-700">
            {listing.description || 'No additional description provided.'}
          </p>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span className="truncate font-medium text-gray-800">📍 {listing.location.name}</span>
            <span className="shrink-0">{formattedDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ListingCard;
