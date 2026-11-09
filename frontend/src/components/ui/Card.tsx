import type { HTMLAttributes, ReactElement } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-6 sm:p-7',
  lg: 'p-8 sm:p-10',
};

export function Card({
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps): ReactElement {
  return (
    <div
      className={`shadow-card rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
