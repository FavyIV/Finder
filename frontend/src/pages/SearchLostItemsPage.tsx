import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { useLostListings } from '../hooks/useLostListings';
import { LostListingCard } from '../components/LostListingCard';
import { CATEGORIES, type Category } from '../types/found-listing.types';

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
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/" className="text-brand-600 hover:text-brand-500 text-xs font-medium">
                ← Home
              </Link>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              Campus Lost Items Notices
            </h1>
            <p className="mt-1 text-xs text-gray-600">
              Browse items reported missing across campus or post your own notice.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/report-lost"
              className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 rounded-md px-3.5 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2"
            >
              + Post Lost Item
            </Link>
          </div>
        </div>

        {/* Directory Switcher Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <Link
              to="/found"
              className="border-b-2 border-transparent pb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:border-gray-300 hover:text-gray-700"
            >
              Found Items Directory
            </Link>
            <span className="border-brand-600 text-brand-600 border-b-2 pb-3 text-xs font-semibold uppercase tracking-wider">
              Lost Items Notices
            </span>
          </nav>
        </div>

        {/* Filter Controls Bar */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="filter-cat" className="text-xs font-semibold text-gray-700">
                Filter Category:
              </label>
              <select
                id="filter-cat"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as Category | '');
                  setCurrentPage(1);
                }}
                className="focus:border-brand-500 focus:ring-brand-500 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 shadow-sm focus:outline-none focus:ring-1"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {currentUser && (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(e) => {
                    setMineOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="text-brand-600 focus:ring-brand-500 h-4 w-4 rounded border-gray-300"
                />
                Show only my lost items
              </label>
            )}
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-white">
            <p className="text-xs text-gray-500">Loading lost item notices...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-white p-6 text-center">
            <h2 className="text-sm font-bold text-red-700">Error Loading Notices</h2>
            <p className="mt-1 text-xs text-gray-600">{error.message}</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
            <span className="text-3xl">🔍</span>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No lost notices found</h3>
            <p className="mt-1 text-xs text-gray-500">
              {mineOnly
                ? "You haven't posted any lost item notices yet."
                : 'No missing items currently match your filter criteria.'}
            </p>
            <div className="mt-4">
              <Link
                to="/report-lost"
                className="bg-brand-600 hover:bg-brand-700 rounded-md px-3.5 py-2 text-xs font-semibold text-white"
              >
                Post a Notice Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page {currentPage} of {meta.totalPages} ({meta.total} total)
                </span>
                <button
                  type="button"
                  disabled={currentPage >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchLostItemsPage;
