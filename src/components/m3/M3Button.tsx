import React from 'react';
import { cn } from '@/lib/utils';

export interface M3ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'filled-tonal' | 'outlined' | 'text' | 'elevated' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
}

export const M3Button: React.FC<M3ButtonProps> = ({
  children,
  variant = 'filled',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-9 px-4 text-xs font-medium gap-1.5 rounded-m3-full',
    md: 'h-10 px-5 text-sm font-medium gap-2 rounded-m3-full',
    lg: 'h-12 px-6 text-base font-medium gap-2.5 rounded-m3-full',
  }[size];

  const variantClasses = {
    filled:
      'bg-m3-primary text-m3-on-primary shadow-sm hover:shadow-md hover:brightness-105 active:brightness-95 disabled:bg-m3-on-surface/12 disabled:text-m3-on-surface/38 disabled:shadow-none',
    'filled-tonal':
      'bg-m3-secondary-container text-m3-on-secondary-container hover:bg-m3-secondary-container/80 active:bg-m3-secondary-container/90 disabled:bg-m3-on-surface/12 disabled:text-m3-on-surface/38',
    elevated:
      'bg-m3-surface-container-low text-m3-primary shadow-m3-1 hover:shadow-m3-2 active:shadow-m3-1 disabled:bg-m3-on-surface/12 disabled:text-m3-on-surface/38 disabled:shadow-none',
    outlined:
      'border border-m3-outline text-m3-primary hover:bg-m3-primary/8 active:bg-m3-primary/12 disabled:border-m3-on-surface/12 disabled:text-m3-on-surface/38',
    text:
      'text-m3-primary hover:bg-m3-primary/8 active:bg-m3-primary/12 disabled:text-m3-on-surface/38',
    danger:
      'bg-m3-error text-m3-on-error hover:brightness-105 active:brightness-95 disabled:bg-m3-on-surface/12 disabled:text-m3-on-surface/38',
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'm3-state-layer inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary focus-visible:ring-offset-2 select-none',
        sizeClasses,
        variantClasses,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
