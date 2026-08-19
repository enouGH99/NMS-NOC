import React from 'react';
import { cn } from '@/lib/utils';

export interface M3BadgeProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'info' | 'outline';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export const M3Badge: React.FC<M3BadgeProps> = ({
  children,
  variant = 'primary',
  dot = false,
  pulse = false,
  className,
}) => {
  const variantClasses = {
    primary: 'bg-m3-primary-container text-m3-on-primary-container',
    secondary: 'bg-m3-secondary-container text-m3-on-secondary-container',
    error: 'bg-m3-error-container text-m3-on-error-container',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20',
    info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20',
    outline: 'bg-transparent border border-m3-outline text-m3-on-surface',
  }[variant];

  if (dot) {
    return (
      <span
        className={cn(
          'inline-block w-2.5 h-2.5 rounded-full',
          variant === 'success' && 'bg-emerald-500',
          variant === 'warning' && 'bg-amber-500',
          variant === 'error' && 'bg-rose-500',
          variant === 'info' && 'bg-sky-500',
          pulse && 'animate-pulse',
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-m3-full text-xs font-semibold select-none',
        variantClasses,
        className
      )}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping opacity-75" />
      )}
      {children}
    </span>
  );
};
