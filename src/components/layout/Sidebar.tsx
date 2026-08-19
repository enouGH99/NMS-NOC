'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNms } from '@/lib/store';
import {
  LayoutDashboard,
  Map,
  Server,
  AlertTriangle,
  Wrench,
  FileBarChart,
  Network,
  Users,
  History,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Zap,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavSection {
  title?: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: 'error' | 'warning' | 'info';
    adminOnly?: boolean;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const pathname = usePathname();
  const { liveStats, currentUser } = useNms();

  const navSections: NavSection[] = [
    {
      title: 'Monitoring Utama',
      items: [
        { label: 'Dashboard NOC', href: '/', icon: LayoutDashboard },
        { label: 'Peta Topologi', href: '/map', icon: Map },
        {
          label: 'Pemantauan Node',
          href: '/devices',
          icon: Server,
          badge: liveStats.offlineCount > 0 ? `${liveStats.offlineCount} Down` : undefined,
          badgeVariant: 'error',
        },
        {
          label: 'Pusat Alert',
          href: '/alerts',
          icon: AlertTriangle,
          badge: liveStats.activeAlertsCount > 0 ? `${liveStats.activeAlertsCount}` : undefined,
          badgeVariant: 'warning',
        },
      ],
    },
    {
      title: 'Operasional & Analitik',
      items: [
        {
          label: 'AI Optimizer (Fase 6)',
          href: '/optimizer',
          icon: Sparkles,
          badge: 'AI Active',
          badgeVariant: 'info',
        },
        { label: 'Log Perbaikan', href: '/repairs', icon: Wrench },
        { label: 'Laporan SLA', href: '/reports', icon: FileBarChart },
        { label: 'Auto-Discovery & AI', href: '/topology', icon: Network },
      ],
    },
    {
      title: 'Administrasi Sistem',
      items: [
        {
          label: 'Kelola Staf',
          href: '/users',
          icon: Users,
          adminOnly: true,
        },
        {
          label: 'Audit Log',
          href: '/audit',
          icon: History,
          adminOnly: true,
        },
        { label: 'Pengaturan SNMP', href: '/settings', icon: Settings },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-m3-surface-container-low border-r border-m3-outline-variant/30 text-m3-on-surface select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-m3-outline-variant/30 bg-m3-surface-container/30">
        <Link href="/" className="flex items-center gap-3 overflow-hidden group">
          {/* Logo with Glow */}
          <div className="relative flex items-center justify-center shrink-0">
            <div className="h-10 w-10 rounded-m3-xl bg-gradient-to-tr from-m3-primary to-sky-400 flex items-center justify-center text-white shadow-m3-2 group-hover:scale-105 transition-transform duration-300">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-m3-surface-container-low" />
          </div>

          {!collapsed && (
            <div className="flex flex-col overflow-hidden animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-m3-on-surface font-sans">
                  NMS<span className="text-m3-primary font-bold">NOC</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-m3-primary/15 text-m3-primary font-extrabold uppercase tracking-wider border border-m3-primary/20">
                  M3 v2.0
                </span>
              </div>
              <span className="text-[10px] text-m3-on-surface-variant font-medium tracking-wide truncate">
                Network Operations Center
              </span>
            </div>
          )}
        </Link>

        {/* Collapse Toggle Button (Desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          className="hidden md:flex p-1.5 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || currentUser.role === 'admin'
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              {!collapsed && section.title && (
                <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-m3-on-surface-variant/80">
                  {section.title}
                </div>
              )}

              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-m3-2xl text-xs font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs font-bold'
                        : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high'
                    )}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-m3-primary rounded-r-full" />
                    )}

                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                        isActive
                          ? 'text-m3-on-secondary-container'
                          : 'text-m3-on-surface-variant group-hover:text-m3-primary'
                      )}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded-full ml-auto shrink-0',
                          item.badgeVariant === 'error'
                            ? 'bg-rose-500 text-white animate-pulse shadow-2xs'
                            : item.badgeVariant === 'info'
                            ? 'bg-gradient-to-r from-m3-primary to-sky-500 text-white shadow-2xs'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Mini Network Status Card (When Expanded) */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="p-3 rounded-m3-2xl bg-gradient-to-br from-m3-surface-container to-m3-surface-container-high border border-m3-outline-variant/30 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Radio className="w-3 h-3 animate-pulse" />
                Network Healthy
              </span>
              <span className="font-mono text-m3-on-surface">99.85% SLA</span>
            </div>
            <div className="w-full bg-m3-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99.85%' }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-m3-on-surface-variant font-mono">
              <span>{liveStats.onlineCount} Online</span>
              <span className={liveStats.offlineCount > 0 ? 'text-rose-500 font-bold' : ''}>
                {liveStats.offlineCount} Down
              </span>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Card at Bottom */}
      <div className="p-3 border-t border-m3-outline-variant/30 bg-m3-surface-container/60">
        <div
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/20',
            collapsed ? 'justify-center' : 'justify-start'
          )}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-m3-primary to-sky-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-m3-surface-container-high" />
          </div>

          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-bold text-m3-on-surface truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-m3-on-surface-variant flex items-center gap-1 font-semibold">
                {currentUser.role === 'admin' ? (
                  <span className="text-m3-primary flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 inline" /> Admin NOC
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-0.5">
                    <ShieldAlert className="w-3 h-3 inline" /> Petugas
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-m3-4 animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
