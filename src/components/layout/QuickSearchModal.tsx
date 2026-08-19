'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNms } from '@/lib/store';
import { Search, Server, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import { getStatusM3Badge } from '@/lib/m3-theme';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { devices, alerts } = useNms();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // toggle if already open or handled by caller
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredDevices = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.ip_address.includes(query) ||
      d.model.toLowerCase().includes(query.toLowerCase()) ||
      d.location_name?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAlerts = alerts.filter(
    (a) =>
      a.message.toLowerCase().includes(query.toLowerCase()) ||
      a.device_name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (url: string) => {
    router.push(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Dialog Surface */}
      <div className="relative w-full max-w-2xl bg-m3-surface-container-high text-m3-on-surface rounded-m3-3xl shadow-m3-4 border border-m3-outline-variant/40 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-m3-outline-variant/30">
          <Search className="w-5 h-5 text-m3-primary shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama perangkat, IP (contoh: 192.168.1.1), model, atau alert..."
            className="w-full bg-transparent text-sm md:text-base text-m3-on-surface outline-none placeholder:text-m3-on-surface-variant/50"
          />
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/40"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {/* Quick Pages */}
          <div>
            <div className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider px-2 mb-2">
              Navigasi Cepat
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: '📊 Dashboard NOC', url: '/' },
                { label: '🗺️ Peta Jaringan', url: '/map' },
                { label: '🖥️ Daftar Perangkat', url: '/devices' },
                { label: '🚨 Peringatan', url: '/alerts' },
                { label: '🔧 Riwayat Perbaikan', url: '/repairs' },
                { label: '📈 Laporan Berkala', url: '/reports' },
              ].map((nav) => (
                <button
                  key={nav.url}
                  onClick={() => handleSelect(nav.url)}
                  className="flex items-center justify-between p-2.5 rounded-m3-md bg-m3-surface-container hover:bg-m3-primary/10 hover:text-m3-primary text-xs font-medium text-left transition-colors"
                >
                  <span>{nav.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                </button>
              ))}
            </div>
          </div>

          {/* Devices Found */}
          <div>
            <div className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider px-2 mb-2">
              Perangkat Jaringan ({filteredDevices.length})
            </div>
            {filteredDevices.length === 0 ? (
              <p className="text-xs text-m3-on-surface-variant/70 px-2 py-1">
                Tidak ada perangkat yang cocok dengan pencarian.
              </p>
            ) : (
              <div className="space-y-1.5">
                {filteredDevices.slice(0, 6).map((device) => {
                  const statusBadge = getStatusM3Badge(device.status);
                  return (
                    <button
                      key={device.id}
                      onClick={() => handleSelect(`/devices/${device.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-m3-xl bg-m3-surface-container hover:bg-m3-surface-container-highest transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 rounded-m3-md bg-m3-surface-container-high text-m3-primary shrink-0">
                          <Server className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-m3-on-surface group-hover:text-m3-primary truncate">
                            {device.name}
                          </div>
                          <div className="text-[11px] text-m3-on-surface-variant flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{device.ip_address}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {device.location_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        {statusBadge.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alerts Found */}
          {filteredAlerts.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider px-2 mb-2">
                Peringatan Terkait
              </div>
              <div className="space-y-1.5">
                {filteredAlerts.slice(0, 3).map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => handleSelect('/alerts')}
                    className="w-full flex items-start gap-2.5 p-3 rounded-m3-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 text-left transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-m3-on-surface">
                        {alert.device_name}
                      </div>
                      <div className="text-[11px] text-m3-on-surface-variant mt-0.5">
                        {alert.message}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
