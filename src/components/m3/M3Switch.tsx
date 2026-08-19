import React from 'react';
import { cn } from '@/lib/utils';

export interface M3SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const M3Switch: React.FC<M3SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}) => {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 select-none cursor-pointer',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-8 w-14 shrink-0 rounded-m3-full border-2 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary',
          checked
            ? 'bg-m3-primary border-m3-primary'
            : 'bg-m3-surface-container-highest border-m3-outline'
        )}
      >
        <span
          className={cn(
            'pointer-events-none flex items-center justify-center rounded-full transition-transform duration-200 ease-in-out shadow-sm',
            checked
              ? 'translate-x-6 h-6 w-6 my-auto ml-1 bg-m3-on-primary text-m3-primary'
              : 'translate-x-1 h-4 w-4 my-auto mt-1.5 bg-m3-outline text-transparent'
          )}
        >
          {checked && (
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      </div>
      {label && <span className="text-sm font-medium text-m3-on-surface">{label}</span>}
    </label>
  );
};
