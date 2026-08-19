import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { M3Button } from './M3Button';

export interface M3DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmLoading?: boolean;
  confirmVariant?: 'filled' | 'danger';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const M3Dialog: React.FC<M3DialogProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  confirmLabel,
  cancelLabel = 'Batal',
  onConfirm,
  confirmLoading = false,
  confirmVariant = 'filled',
  maxWidth = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* M3 Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* M3 Elevated Dialog Surface */}
      <div
        className={cn(
          'relative w-full bg-m3-surface-container-high text-m3-on-surface rounded-m3-3xl shadow-m3-3 p-6 z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]',
          maxWidthClasses
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-m3-outline-variant/40">
          {icon && (
            <div className="p-2 rounded-m3-md bg-m3-primary/10 text-m3-primary shrink-0">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-m3-on-surface flex-1">{title}</h3>
          <button
            onClick={onClose}
            className="text-m3-on-surface-variant hover:text-m3-on-surface p-1.5 rounded-full hover:bg-m3-on-surface/8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="py-4 overflow-y-auto pr-1 text-sm text-m3-on-surface-variant flex-1">
          {children}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-m3-outline-variant/40 mt-auto">
          {cancelLabel && (
            <M3Button variant="text" onClick={onClose}>
              {cancelLabel}
            </M3Button>
          )}
          {confirmLabel && onConfirm && (
            <M3Button
              variant={confirmVariant}
              onClick={onConfirm}
              loading={confirmLoading}
            >
              {confirmLabel}
            </M3Button>
          )}
        </div>
      </div>
    </div>
  );
};
