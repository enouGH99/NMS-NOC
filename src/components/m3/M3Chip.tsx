import React from 'react';
import { cn } from '@/lib/utils';

export interface M3ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
  onDelete?: () => void;
  variant?: 'filter' | 'assist' | 'suggestion';
}

export const M3Chip: React.FC<M3ChipProps> = ({
  children,
  selected = false,
  icon,
  onDelete,
  variant = 'filter',
  className,
  ...props
}) => {
  return (
    <button
      type="button"
      className={cn(
        'm3-state-layer inline-flex items-center gap-2 h-8 px-3.5 rounded-m3-sm text-xs font-medium transition-all duration-200 select-none border',
        selected
          ? 'bg-m3-secondary-container text-m3-on-secondary-container border-m3-secondary-container shadow-sm font-semibold'
          : 'bg-transparent text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-on-surface/8',
        className
      )}
      {...props}
    >
      {selected && (
        <svg className="w-4 h-4 text-current" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {!selected && icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {onDelete && (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="hover:bg-m3-on-surface/12 rounded-full p-0.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </button>
  );
};
