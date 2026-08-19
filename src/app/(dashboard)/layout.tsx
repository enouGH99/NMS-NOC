'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNms } from '@/lib/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { QuickSearchModal } from '@/components/layout/QuickSearchModal';
import { Activity, ShieldCheck } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useNms();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // If verifying authentication, show modern M3 NOC splash loader
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-m3-surface-container-lowest flex flex-col items-center justify-center p-6 text-center space-y-4 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-m3-2xl bg-gradient-to-tr from-m3-primary to-sky-400 text-white flex items-center justify-center shadow-m3-3 animate-pulse">
            <Activity className="w-9 h-9" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-m3-surface-container-lowest animate-ping" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-black tracking-tight text-m3-on-surface">
            NMS NOC Portal
          </h2>
          <p className="text-xs text-m3-on-surface-variant font-mono animate-pulse">
            Memverifikasi otentikasi sesi NOC...
          </p>
        </div>
      </div>
    );
  }

  // If confirmed unauthenticated, don't render dashboard while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-m3-surface text-m3-on-surface flex flex-col">
      {/* M3 Sidebar Navigation Drawer */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Top App Bar Navbar */}
        <Navbar
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Quick Search Modal (Ctrl+K) */}
      <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
