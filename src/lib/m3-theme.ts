import { DeviceStatus, AlertSeverity, DeviceType } from './types';

/**
 * Material Design 3 Helper utility for mapping status to M3 Tonal & Container classes
 */
export const getStatusM3Badge = (status: DeviceStatus) => {
  switch (status) {
    case 'online':
      return {
        bg: 'bg-emerald-500/15 dark:bg-emerald-400/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/30 dark:border-emerald-400/40',
        dot: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]',
        label: 'Online',
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/15 dark:bg-amber-400/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/30 dark:border-amber-400/40',
        dot: 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse',
        label: 'Peringatan',
      };
    case 'offline':
      return {
        bg: 'bg-rose-500/15 dark:bg-rose-400/20',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/30 dark:border-rose-400/40',
        dot: 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)]',
        label: 'Offline',
      };
    case 'unreachable':
      return {
        bg: 'bg-slate-500/15 dark:bg-slate-400/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-500/30 dark:border-slate-400/40',
        dot: 'bg-slate-400 dark:bg-slate-500',
        label: 'Unreachable',
      };
  }
};

export const getSeverityM3Badge = (severity: AlertSeverity) => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-rose-500/15 dark:bg-rose-400/20',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/30',
        iconColor: 'text-rose-600 dark:text-rose-400',
        label: 'Critical',
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/15 dark:bg-amber-400/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        label: 'Warning',
      };
    case 'info':
      return {
        bg: 'bg-sky-500/15 dark:bg-sky-400/20',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-500/30',
        iconColor: 'text-sky-600 dark:text-sky-400',
        label: 'Info',
      };
  }
};

export const getDeviceTypeIconName = (type: DeviceType): string => {
  switch (type) {
    case 'router':
      return 'router';
    case 'switch':
      return 'hub';
    case 'access_point':
      return 'wifi';
    case 'server':
      return 'dns';
    case 'firewall':
      return 'security';
  }
};
