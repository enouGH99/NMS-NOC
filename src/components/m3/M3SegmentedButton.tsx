import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface M3SegmentedButtonProps {
  options: SegmentItem[];
  selected: string;
  onChange: (id: string) => void;
  className?: string;
}

export const M3SegmentedButton: React.FC<M3SegmentedButtonProps> = ({
  options,
  selected,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-m3-full border border-m3-outline-variant bg-m3-surface-container-low select-none',
        className
      )}
    >
      {options.map((opt, idx) => {
        const isSelected = opt.id === selected;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'm3-state-layer flex items-center justify-center gap-2 px-4 py-1.5 rounded-m3-full text-xs font-semibold transition-all duration-200',
              isSelected
                ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-sm'
                : 'bg-transparent text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-on-surface/8'
            )}
          >
            {isSelected && (
              <svg className="w-3.5 h-3.5 text-current" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {!isSelected && opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
