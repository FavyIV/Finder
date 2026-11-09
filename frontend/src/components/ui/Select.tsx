import { forwardRef, type SelectHTMLAttributes, type ReactElement } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, className = '', children, ...props },
  ref,
): ReactElement {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={`focus:ring-brand-500 focus:border-brand-500 block w-full appearance-none rounded-xl border bg-white py-2.5 pl-3.5 pr-10 text-sm text-gray-900 outline-none transition-all duration-150 focus:ring-2 disabled:bg-gray-100 disabled:opacity-50 dark:bg-gray-900 dark:text-gray-100 dark:disabled:bg-gray-800 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-700'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 dark:text-gray-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p
          id={`${selectId}-error`}
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
