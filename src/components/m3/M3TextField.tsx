import React from 'react';
import { cn } from '@/lib/utils';

export interface M3TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const M3TextField = React.forwardRef<HTMLInputElement, M3TextFieldProps>(
  ({ label, helperText, errorText, leadingIcon, trailingIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasError = Boolean(errorText);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-m3-on-surface-variant px-1">
            {label}
          </label>
        )}
        <div
          className={cn(
            'relative flex items-center h-12 w-full rounded-m3-md border px-3.5 transition-all duration-200 bg-m3-surface-container-lowest focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-transparent',
            hasError
              ? 'border-m3-error text-m3-error focus-within:ring-m3-error'
              : 'border-m3-outline-variant hover:border-m3-outline text-m3-on-surface',
            className
          )}
        >
          {leadingIcon && <span className="text-m3-on-surface-variant mr-2.5 shrink-0">{leadingIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className="w-full bg-transparent text-sm text-m3-on-surface outline-none placeholder:text-m3-on-surface-variant/50"
            {...props}
          />
          {trailingIcon && <span className="text-m3-on-surface-variant ml-2.5 shrink-0">{trailingIcon}</span>}
        </div>
        {(errorText || helperText) && (
          <p
            className={cn(
              'text-xs px-1',
              hasError ? 'text-m3-error font-medium' : 'text-m3-on-surface-variant'
            )}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    );
  }
);

M3TextField.displayName = 'M3TextField';
