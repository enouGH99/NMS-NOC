import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface M3TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const M3Tabs: React.FC<M3TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'primary',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex border-b border-m3-outline-variant overflow-x-auto no-scrollbar',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'm3-state-layer relative flex items-center justify-center gap-2.5 px-5 h-12 text-sm font-medium transition-all duration-200 select-none whitespace-nowrap',
              isActive
                ? 'text-m3-primary font-semibold'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-on-surface/8'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold',
                  isActive
                    ? 'bg-m3-primary text-m3-on-primary'
                    : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                )}
              >
                {tab.badge}
              </span>
            )}
            {/* Active Indicator Underline / Pill */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-m3-primary rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
