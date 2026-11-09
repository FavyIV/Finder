import type { ReactElement } from 'react';
import { CATEGORIES, type Category } from '../types/found-listing.types';
import { useLocations } from '../hooks/useLocations';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

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
    <div className="shadow-card rounded-2xl border border-gray-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Category Filter */}
        <Select
          label="Category"
          id="filter-category"
          value={filters.category}
          onChange={(e) => onFilterChange({ category: e.target.value as Category | '' })}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </Select>

        {/* Location Filter */}
        <Select
          label="Security Post Location"
          id="filter-location"
          value={filters.locationId}
          disabled={isLoadingLocations}
          onChange={(e) => onFilterChange({ locationId: e.target.value })}
        >
          <option value="">All Locations</option>
          {locations?.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </Select>

        {/* Date From */}
        <Input
          label="Found From"
          id="filter-found-from"
          type="date"
          value={filters.foundFrom}
          onChange={(e) => onFilterChange({ foundFrom: e.target.value })}
        />

        {/* Date To */}
        <Input
          label="Found To"
          id="filter-found-to"
          type="date"
          value={filters.foundTo}
          onChange={(e) => onFilterChange({ foundTo: e.target.value })}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">Filters applied</span>
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs font-semibold">
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
