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
    <div className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <span className="text-brand-700 bg-brand-50 border-brand-200 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
            {listing.category}
          </span>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
          {listing.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
        <span className="text-gray-500">
          Posted by <span className="font-medium text-gray-700">{listing.postedBy.name}</span>
        </span>

        {isOwner && (
          <Link
            to={`/lost/${listing.id}/edit`}
            className="text-brand-600 hover:text-brand-700 text-xs font-semibold"
          >
            ✏️ Edit
          </Link>
        )}
      </div>
    </div>
  );
}

export default LostListingCard;
