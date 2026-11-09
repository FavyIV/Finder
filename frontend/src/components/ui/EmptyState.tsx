import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Button, type ButtonVariant } from './Button';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: ButtonVariant;
}

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
}

export function EmptyState({
  icon = '🔍',
  title,
  description,
  actions,
  className = '',
}: EmptyStateProps): ReactElement {
  return (
    <div
      className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center sm:p-12 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="shadow-xs flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl dark:bg-gray-800">
        <span aria-hidden="true">{icon}</span>
      </div>
      <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {actions && actions.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action, idx) => {
            const btnVariant = action.variant ?? (idx === 0 ? 'primary' : 'secondary');
            if (action.href) {
              return (
                <Link key={idx} to={action.href}>
                  <Button variant={btnVariant}>{action.label}</Button>
                </Link>
              );
            }
            return (
              <Button key={idx} variant={btnVariant} onClick={action.onClick}>
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
