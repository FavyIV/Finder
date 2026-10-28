import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { FilterBar, type FilterValues } from '../components/FilterBar';
import { ListingCard } from '../components/ListingCard';
import { useSearchFoundListings } from '../hooks/useFoundListings';
import { useCurrentUser } from '../hooks/useAuth';

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
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="text-brand-600 hover:text-brand-500 text-sm font-medium">
              ← Back to Home
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Search Found Items
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Filter through items currently logged and stored at campus security posts.
            </p>
          </div>

          <div className="flex gap-2">
            {currentUser && (
              <Link
                to="/report-found"
                className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
              >
                + Report Found Item
              </Link>
            )}
          </div>
        </div>

        {/* Structured Filter Bar */}
        <div className="mb-8">
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Listings Section Handling Loading, Error, Empty States */}
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-white p-12">
            <p className="text-sm text-gray-500">Loading found items...</p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700"
          >
            <p className="font-semibold">Unable to load found listings</p>
            <p className="mt-1 text-xs">{error.message}</p>
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {data.data.length} of {data.meta.total} available items
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
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={data.meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page {data.meta.page} of {data.meta.totalPages}
                </span>
                <button
                  type="button"
                  disabled={data.meta.page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty State per Core User Flow */
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <span className="text-4xl">🔍</span>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">No matching found items</h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              We couldn't find any unclaimed items matching your selected filters. If you lost an
              item, you can post a lost item listing so it's on record.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <Link
                to="/lost-listings"
                className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
              >
                Post a Lost Item
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchFoundItemsPage;
