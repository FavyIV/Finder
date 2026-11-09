import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { FilterBar, type FilterValues } from '../components/FilterBar';
import { ListingCard } from '../components/ListingCard';
import { useSearchFoundListings } from '../hooks/useFoundListings';
import { useCurrentUser } from '../hooks/useAuth';
import { CardSkeletonGrid } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export function SearchFoundItemsPage(): ReactElement {
  const { data: currentUser } = useCurrentUser();
  const [filters, setFilters] = useState<FilterValues>({
    category: '',
    locationId: '',
    foundFrom: '',
    foundTo: '',
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useSearchFoundListings({
    ...filters,
    page,
    pageSize: 12,
  });

  const handleFilterChange = (updated: Partial<FilterValues>): void => {
    setFilters((prev) => ({ ...prev, ...updated }));
    setPage(1); // Reset to first page on filter change
  };

  const handleResetFilters = (): void => {
    setFilters({
      category: '',
      locationId: '',
      foundFrom: '',
      foundTo: '',
    });
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            Found Items Directory
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Search items stored physically at campus security posts awaiting verified collection.
          </p>
        </div>

        {currentUser && (
          <div>
            <Link to="/report-found">
              <Button variant="primary" size="md">
                + Report Found Item
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Directory Switcher Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-2xl bg-gray-200/70 p-1 dark:bg-gray-800/80">
        <span className="shadow-xs rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-900 dark:bg-gray-900 dark:text-gray-100">
          Found Items
        </span>
        <Link
          to="/lost"
          className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          Lost Notices
        </Link>
      </div>

      {/* Structured Filter Bar */}
      <div className="mb-8">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Listings Section */}
      {isLoading ? (
        <CardSkeletonGrid count={8} />
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
        >
          <p className="text-base font-bold">Unable to load found listings</p>
          <p className="mt-1 text-xs">{error.message}</p>
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div>
          <div className="mb-5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing{' '}
              <strong className="font-semibold text-gray-800 dark:text-gray-200">
                {data.data.length}
              </strong>{' '}
              of{' '}
              <strong className="font-semibold text-gray-800 dark:text-gray-200">
                {data.meta.total}
              </strong>{' '}
              available items
            </span>
            <span>
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination Controls */}
          {data.meta.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={data.meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="px-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={data.meta.page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon="🔍"
          title="No matching found items"
          description="We couldn't find any unclaimed items matching your selected criteria. If you lost an item, post a lost notice so finders know what to look out for."
          actions={[
            {
              label: 'Clear Filters',
              onClick: handleResetFilters,
              variant: 'secondary',
            },
            {
              label: 'Post a Lost Item Notice',
              href: '/report-lost',
              variant: 'primary',
            },
          ]}
        />
      )}
    </div>
  );
}

export default SearchFoundItemsPage;
