import { forwardRef, type InputHTMLAttributes, type ReactElement } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...props },
  ref,
): ReactElement {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`focus:ring-brand-500 focus:border-brand-500 block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-100 disabled:opacity-50 dark:bg-gray-900 dark:text-gray-100 dark:disabled:bg-gray-800 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700'
            : 'border-gray-300 dark:border-gray-700'
        } ${className}`}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;
