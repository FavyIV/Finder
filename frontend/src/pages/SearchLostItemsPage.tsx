import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { useLostListings } from '../hooks/useLostListings';
import { LostListingCard } from '../components/LostListingCard';
import { CATEGORIES, type Category } from '../types/found-listing.types';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeletonGrid } from '../components/ui/Skeleton';

export function SearchLostItemsPage(): ReactElement {
  const { data: currentUser } = useCurrentUser();
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [mineOnly, setMineOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useLostListings({
    category: selectedCategory || undefined,
    mineOnly: mineOnly || undefined,
    page: currentPage,
    pageSize: 12,
  });

  const listings = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation & Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            Lost Items Notices
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Browse items reported missing across campus or post your own notice so finders know who
            to alert.
          </p>
        </div>

        <div>
          <Link to="/report-lost">
            <Button variant="primary" size="md">
              + Post Lost Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Directory Switcher Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-2xl bg-gray-200/70 p-1 dark:bg-gray-800/80">
        <Link
          to="/found"
          className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          Found Items
        </Link>
        <span className="shadow-xs rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-900 dark:bg-gray-900 dark:text-gray-100">
          Lost Notices
        </span>
      </div>

      {/* Filter Controls Bar */}
      <div className="shadow-card mb-6 rounded-2xl border border-gray-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-xs">
            <Select
              label="Filter Category"
              id="filter-cat"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as Category | '');
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>

          {currentUser && (
            <label className="flex cursor-pointer items-center gap-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => {
                  setMineOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="text-brand-600 focus:ring-brand-500 h-4 w-4 rounded-md border-gray-300"
              />
              Show only my notices
            </label>
          )}
        </div>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
        >
          <p className="text-base font-bold">Error loading notices</p>
          <p className="mt-1 text-xs">{error.message}</p>
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No lost notices found"
          description={
            mineOnly
              ? "You haven't posted any lost item notices yet."
              : 'No missing items currently match your filter criteria.'
          }
          actions={[
            {
              label: 'Post a Notice Now',
              href: '/report-lost',
              variant: 'primary',
            },
          ]}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <LostListingCard
                key={item.id}
                listing={item}
                isOwner={currentUser?.id === item.postedBy.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="px-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                Page {currentPage} of {meta.totalPages} ({meta.total} notices)
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= meta.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchLostItemsPage;
