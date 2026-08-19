import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface M3SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const M3Sheet: React.FC<M3SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg',
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

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  }[width];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* M3 Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        {/* M3 Side Sheet Surface */}
        <div
          className={cn(
            'w-screen bg-m3-surface-container-high text-m3-on-surface shadow-m3-4 flex flex-col rounded-l-m3-3xl animate-in slide-in-from-right duration-300 border-l border-m3-outline-variant/40',
            widthClasses
          )}
        >
          {/* Top App Bar inside Sheet */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-m3-outline-variant/40">
            <div>
              <h2 className="text-xl font-bold text-m3-on-surface">{title}</h2>
              {subtitle && (
                <p className="text-xs text-m3-on-surface-variant mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-on-surface/8 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>

          {/* Optional Footer */}
          {footer && (
            <div className="p-4 px-6 border-t border-m3-outline-variant/40 bg-m3-surface-container mt-auto">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
