import React from 'react';
import { cn } from '@/lib/utils';
import { M3Card } from '../m3/M3Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'primary',
  trend,
  onClick,
}) => {
  const variantStyles = {
    primary: {
      bg: 'bg-m3-surface-container hover:bg-m3-surface-container-high',
      iconBg: 'bg-m3-primary/15 text-m3-primary',
      accent: 'border-m3-outline-variant/30',
    },
    success: {
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
      iconBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      accent: 'border-emerald-500/30',
    },
    warning: {
      bg: 'bg-amber-500/10 hover:bg-amber-500/15',
      iconBg: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      accent: 'border-amber-500/30',
    },
    error: {
      bg: 'bg-rose-500/10 hover:bg-rose-500/15',
      iconBg: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
      accent: 'border-rose-500/30',
    },
    info: {
      bg: 'bg-sky-500/10 hover:bg-sky-500/15',
      iconBg: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
      accent: 'border-sky-500/30',
    },
  }[variant];

  return (
    <M3Card
      className={cn(
        'p-5 border transition-all duration-200 cursor-pointer',
        variantStyles.bg,
        variantStyles.accent
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface tracking-tight">
              {value}
            </h3>
            {trend && (
              <span
                className={cn(
                  'text-xs font-bold px-1.5 py-0.5 rounded-full',
                  trend.isPositive
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-m3-on-surface-variant/80 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className={cn('p-3 rounded-m3-2xl shrink-0', variantStyles.iconBg)}>
          {icon}
        </div>
      </div>
    </M3Card>
  );
};
