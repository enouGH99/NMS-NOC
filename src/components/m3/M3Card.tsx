import React from 'react';
import { cn } from '@/lib/utils';

export interface M3CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
  hoverable?: boolean;
  interactive?: boolean;
}

export const M3Card: React.FC<M3CardProps> = ({
  children,
  variant = 'filled',
  hoverable = false,
  interactive = false,
  className,
  ...props
}) => {
  const variantClasses = {
    elevated:
      'bg-m3-surface-container-low text-m3-on-surface shadow-m3-1 hover:shadow-m3-2',
    filled:
      'bg-m3-surface-container text-m3-on-surface',
    outlined:
      'bg-m3-surface text-m3-on-surface border border-m3-outline-variant',
  }[variant];

  return (
    <div
      className={cn(
        'rounded-m3-3xl p-5 transition-all duration-200',
        variantClasses,
        hoverable && 'hover:bg-m3-surface-container-high hover:-translate-y-0.5',
        interactive && 'cursor-pointer active:scale-[0.99] select-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
