import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { children, variant = 'default', size = 'md', dot = false, pulse = false, className, ...props },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center font-medium transition-colors';

    const variantClasses = {
      default:
        'bg-bg-tertiary text-text-secondary border border-border',
      primary:
        'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      success:
        'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
      warning:
        'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
      danger:
        'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs rounded-full gap-1',
      md: 'px-2.5 py-0.5 text-sm rounded-full gap-1.5',
    };

    const dotColors = {
      default: 'bg-text-secondary',
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      info: 'bg-blue-500',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              dotColors[variant],
              pulse && 'animate-pulse'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
