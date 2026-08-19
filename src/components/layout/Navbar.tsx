'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNms } from '@/lib/store';
import { authClient } from '@/lib/auth-client';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Radio,
  UserCheck,
  Shield,
  LogOut,
  Sparkles,
  ArrowDown,
  ArrowUp,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { M3Sheet } from '../m3/M3Sheet';
import { M3Button } from '../m3/M3Button';
import { getSeverityM3Badge } from '@/lib/m3-theme';
import { formatTimeAgo, formatMbps } from '@/lib/utils';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, onOpenSearch }) => {
  const {
    theme,
    toggleTheme,
    soundEnabled,
    setSoundEnabled,
    currentUser,
    switchUserRole,
    logout,
    liveStats,
    throughputHistory,
    alerts,
    acknowledgeAlert,
    addAuditLog,
  } = useNms();

  const router = useRouter();
  const [alertsSheetOpen, setAlertsSheetOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    logout();
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    }
    addAuditLog('LOGOUT', `Pengguna ${currentUser.name} keluar dari sistem`);
    router.replace('/login');
  };

  const activeAlerts = alerts.filter((a) => !a.resolved_at);
  const latestThroughput = throughputHistory[throughputHistory.length - 1] || {
    inbound: 45.2,
    outbound: 18.7,
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-m3-surface/85 backdrop-blur-xl border-b border-m3-outline-variant/30 px-3 sm:px-6 flex items-center justify-between gap-3 shadow-xs transition-colors">
        {/* Left Side: Mobile Hamburger + Global Search Bar */}
        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          {/* Mobile Menu Button */}
          <button
            onClick={onOpenMobileMenu}
            title="Buka Menu"
            className="md:hidden p-2 rounded-m3-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Command Palette Search Input */}
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-2.5 h-10 px-3.5 sm:px-4 rounded-m3-full bg-m3-surface-container-low hover:bg-m3-surface-container text-m3-on-surface-variant hover:text-m3-on-surface text-xs sm:text-sm transition-all border border-m3-outline-variant/40 hover:border-m3-primary/50 text-left select-none group shadow-2xs"
          >
            <Search className="w-4 h-4 text-m3-on-surface-variant group-hover:text-m3-primary transition-colors shrink-0" />
            <span className="truncate flex-1">
              Cari perangkat, IP, port, alert...
            </span>
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded-md bg-m3-surface-container-highest text-[10px] font-mono font-bold text-m3-on-surface-variant border border-m3-outline-variant/40 shadow-xs">
                Ctrl + K
              </kbd>
            </div>
          </button>
        </div>

        {/* Center: Live Throughput Ticker (Desktop Widescreen) */}
        <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-m3-full bg-m3-surface-container-low border border-m3-outline-variant/30 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>↓ {formatMbps(latestThroughput.inbound)}</span>
          </div>
          <span className="w-px h-3 bg-m3-outline-variant/40" />
          <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>↑ {formatMbps(latestThroughput.outbound)}</span>
          </div>
        </div>

        {/* Right Side: Status Ticker, Role Switcher, Sound, Theme, Alerts, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Live SNMP Poller Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-m3-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>SNMP Live (30s)</span>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="hidden sm:flex items-center bg-m3-surface-container-low p-0.5 rounded-m3-full border border-m3-outline-variant/30">
            <button
              onClick={() => switchUserRole('admin')}
              className={`px-3 py-1 text-xs font-bold rounded-m3-full transition-all duration-200 ${
                currentUser.role === 'admin'
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchUserRole('petugas')}
              className={`px-3 py-1 text-xs font-bold rounded-m3-full transition-all duration-200 ${
                currentUser.role === 'petugas'
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              Petugas
            </button>
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Suara Alert Aktif (Klik untuk Mematikan)' : 'Suara Alert Dibisukan (Klik untuk Mengaktifkan)'}
            className={`p-2 rounded-full transition-colors ${
              soundEnabled
                ? 'text-m3-primary hover:bg-m3-primary/10'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5 opacity-60" />
            )}
          </button>

          {/* Theme Toggle (Dark Mode vs Light Mode) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap (NOC Cyber)'}
            className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high transition-transform duration-300 active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 transition-all hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-m3-primary transition-all hover:-rotate-12" />
            )}
          </button>

          {/* Alerts Notification Bell with Ping Badge */}
          <button
            onClick={() => setAlertsSheetOpen(true)}
            title={`${activeAlerts.length} Gangguan Aktif`}
            className="relative p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high transition-colors"
          >
            <Bell className={`w-5 h-5 ${activeAlerts.length > 0 ? 'text-amber-500 animate-bounce-short' : ''}`} />
            {liveStats.activeAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
                {liveStats.activeAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar Popover */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              title="Profil Pengguna"
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-m3-primary/30 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-m3-primary to-sky-400 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-m3-3xl bg-m3-surface-container-high text-m3-on-surface shadow-m3-4 border border-m3-outline-variant/40 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                {/* User Header */}
                <div className="flex items-center gap-3 p-2.5 rounded-m3-2xl bg-m3-surface-container">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-m3-primary to-sky-400 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="font-bold text-sm text-m3-on-surface truncate">{currentUser.name}</div>
                    <div className="text-xs text-m3-on-surface-variant truncate">{currentUser.email}</div>
                    <span className="inline-block mt-1 text-[9px] px-2 py-0.2 rounded-full bg-m3-primary/15 text-m3-primary font-extrabold uppercase tracking-wider border border-m3-primary/30">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-1 pt-1">
                  <Link
                    href="/users"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-m3-xl hover:bg-m3-surface-container text-m3-on-surface transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-m3-primary" />
                    <span>Daftar Pengguna & Staf</span>
                  </Link>
                  <Link
                    href="/audit"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-m3-xl hover:bg-m3-surface-container text-m3-on-surface transition-colors"
                  >
                    <Shield className="w-4 h-4 text-sky-500" />
                    <span>Riwayat Audit Sistem</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-m3-xl hover:bg-m3-surface-container text-m3-on-surface transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <span>Pengaturan Polling SNMP</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="pt-2 border-t border-m3-outline-variant/30">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-m3-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-over Side Sheet: Active Alerts */}
      <M3Sheet
        isOpen={alertsSheetOpen}
        onClose={() => setAlertsSheetOpen(false)}
        title="Pusat Peringatan & Notifikasi"
        subtitle={`${activeAlerts.length} gangguan aktif yang memerlukan perhatian`}
      >
        <div className="space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-12 text-m3-on-surface-variant">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="font-bold text-sm text-m3-on-surface">Semua Node Beroperasi Normal</p>
              <p className="text-xs text-m3-on-surface-variant/80 mt-1 max-w-xs mx-auto">
                Tidak ada gangguan atau ambang batas kritis yang terdeteksi saat ini.
              </p>
            </div>
          ) : (
            activeAlerts.map((alert) => {
              const badge = getSeverityM3Badge(alert.severity);
              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/40 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="font-bold text-xs text-m3-on-surface truncate">
                        {alert.device_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-m3-on-surface-variant shrink-0 font-mono">
                      {formatTimeAgo(alert.triggered_at)}
                    </span>
                  </div>

                  <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-m3-outline-variant/20">
                    <span className="text-[10px] font-mono text-m3-on-surface-variant">
                      IP: {alert.ip_address}
                    </span>
                    {!alert.acknowledged ? (
                      <M3Button
                        size="sm"
                        variant="filled-tonal"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Tandai Diterima
                      </M3Button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ Telah Diterima
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div className="pt-4 border-t border-m3-outline-variant/20">
            <Link
              href="/alerts"
              onClick={() => setAlertsSheetOpen(false)}
              className="block"
            >
              <M3Button fullWidth variant="outlined" icon={<ExternalLink className="w-4 h-4" />}>
                Buka Manajemen Aturan & Riwayat Alert
              </M3Button>
            </Link>
          </div>
        </div>
      </M3Sheet>
    </>
  );
};
