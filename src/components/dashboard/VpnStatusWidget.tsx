'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { ShieldCheck, ShieldAlert, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

export const VpnStatusWidget: React.FC = () => {
  const { vpnTunnels, syncVpnTunnels } = useNms();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const connectedCount = vpnTunnels.filter((v) => v.status === 'connected').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncVpnTunnels();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const getVpnTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'openvpn':
        return { label: 'OpenVPN', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
      case 'pptp':
        return { label: 'PPTP', bg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' };
      case 'l2tp':
        return { label: 'L2TP', bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30' };
      case 'wireguard':
        return { label: 'WireGuard', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' };
      case 'sstp':
        return { label: 'SSTP', bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' };
      default:
        return { label: type.toUpperCase(), bg: 'bg-m3-surface-container-highest text-m3-on-surface-variant border-m3-outline-variant/30' };
    }
  };

  return (
    <M3Card className="p-5 flex flex-col h-full border border-m3-outline-variant/30">
      <div className="flex items-center justify-between pb-3 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-m3-md bg-m3-primary/15 text-m3-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-m3-on-surface">
                Status Tunnel & Sesi VPN
              </h3>
              {vpnTunnels.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {connectedCount} Terkoneksi
                </span>
              )}
            </div>
            <p className="text-xs text-m3-on-surface-variant">
              Koneksi Site-to-Site & Remote Petugas Lapangan
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container transition-colors"
          title="Segarkan Sesi VPN"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-m3-primary' : ''}`} />
        </button>
      </div>

      <div className="pt-4 space-y-3 flex-1 overflow-y-auto max-h-[340px]">
        {vpnTunnels.length === 0 ? (
          <div className="text-center py-8 text-m3-on-surface-variant">
            <ShieldCheck className="w-8 h-8 text-m3-primary/40 mx-auto mb-2" />
            <p className="text-xs font-semibold">Tidak ada tunnel VPN aktif</p>
            <p className="text-[11px] text-m3-on-surface-variant/70 mt-1">
              Sinkronisasi SNMP perangkat untuk mendeteksi tunnel & sesi PPP
            </p>
          </div>
        ) : (
          vpnTunnels.map((vpn) => {
            const isConnected = vpn.status === 'connected';
            const badge = getVpnTypeBadge(vpn.type);
            return (
              <div
                key={vpn.id}
                className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 flex items-center justify-between gap-3 hover:border-m3-primary/30 transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <div
                    className={`p-2 rounded-full shrink-0 relative ${
                      isConnected
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      </>
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>
                  <div className="truncate min-w-0">
                    <div className="text-xs font-bold text-m3-on-surface truncate flex items-center gap-1.5">
                      <span className="truncate">{vpn.name}</span>
                      <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-m3-on-surface-variant flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="font-mono text-[10px]">{vpn.remote_ip}</span>
                      <span>•</span>
                      <span className="font-medium truncate">User: {vpn.user}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-[11px] font-bold ${
                      isConnected
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </div>
                  {isConnected && (
                    <div className="text-[10px] font-mono text-m3-on-surface-variant flex items-center gap-1.5 mt-0.5 justify-end">
                      <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold" title="Data Masuk">
                        <ArrowDown className="w-2.5 h-2.5 mr-0.5" />
                        {formatBytes(vpn.bytes_in)}
                      </span>
                      <span className="flex items-center text-sky-600 dark:text-sky-400 font-semibold" title="Data Keluar">
                        <ArrowUp className="w-2.5 h-2.5 mr-0.5" />
                        {formatBytes(vpn.bytes_out)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </M3Card>
  );
};

