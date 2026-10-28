import type { ReactElement } from 'react';
import { CATEGORIES, type Category } from '../types/found-listing.types';
import { useLocations } from '../hooks/useLocations';

export type FilterValues = {
  category: Category | '';
  locationId: string;
  foundFrom: string;
  foundTo: string;
};

export type FilterBarProps = {
  filters: FilterValues;
  onFilterChange: (updated: Partial<FilterValues>) => void;
  onReset: () => void;
};

export function FilterBar({ filters, onFilterChange, onReset }: FilterBarProps): ReactElement {
  const { data: locations, isLoading: isLoadingLocations } = useLocations();

  const hasActiveFilters = Boolean(
    filters.category || filters.locationId || filters.foundFrom || filters.foundTo,
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Category Filter */}
        <div>
          <label htmlFor="filter-category" className="block text-xs font-semibold text-gray-700">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value as Category | '' })}
            className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label htmlFor="filter-location" className="block text-xs font-semibold text-gray-700">
            Security Post Location
          </label>
          <select
            id="filter-location"
            value={filters.locationId}
            disabled={isLoadingLocations}
            onChange={(e) => onFilterChange({ locationId: e.target.value })}
            className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 disabled:opacity-50"
          >
            <option value="">All Locations</option>
            {locations?.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="filter-found-from" className="block text-xs font-semibold text-gray-700">
            Found From
          </label>
          <input
            id="filter-found-from"
            type="date"
            value={filters.foundFrom}
            onChange={(e) => onFilterChange({ foundFrom: e.target.value })}
            className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="filter-found-to" className="block text-xs font-semibold text-gray-700">
            Found To
          </label>
          <input
            id="filter-found-to"
            type="date"
            value={filters.foundTo}
            onChange={(e) => onFilterChange({ foundTo: e.target.value })}
            className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex justify-end border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={onReset}
            className="text-brand-600 hover:text-brand-800 text-xs font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
