'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Globe,
  User,
  Clock,
} from 'lucide-react';
import { formatBits } from '@/lib/utils';

export const VpnStatusWidget: React.FC = () => {
  const { vpnTunnels, syncVpnTunnels, isGlobalRefreshing } = useNms();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const connectedCount = vpnTunnels.filter((v) => v.status === 'connected').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncVpnTunnels(undefined, true);
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
      case 'ipsec':
        return { label: 'IPsec', bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' };
      default:
        return { label: type.toUpperCase(), bg: 'bg-m3-surface-container-highest text-m3-on-surface-variant border-m3-outline-variant/30' };
    }
  };

  // Format compact uptime: "96h 23j 0m"
  const formatCompactUptime = (uptimeStr?: string) => {
    if (!uptimeStr) return '0m';
    return uptimeStr
      .replace(/hari/g, 'h')
      .replace(/jam/g, 'j')
      .replace(/menit/g, 'm')
      .replace(/detik/g, 's')
      .trim();
  };

  return (
    <M3Card className="p-4 sm:p-5 flex flex-col h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-m3-xl bg-m3-primary/15 text-m3-primary shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-m3-on-surface truncate">
              Status Tunnel & VPN
            </h3>
            <p className="text-[11px] text-m3-on-surface-variant truncate">
              {connectedCount} dari {vpnTunnels.length} Sesi Terkoneksi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {vpnTunnels.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {connectedCount} Online
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isGlobalRefreshing}
            className="p-1.5 rounded-lg text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container-high transition-colors"
            title="Segarkan Sesi VPN"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || isGlobalRefreshing ? 'animate-spin text-m3-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tunnel List: Natural flex expansion without forced max-h or scrollbars when items fit */}
      <div className="pt-3 space-y-2.5 flex-1">
        {vpnTunnels.length === 0 ? (
          <div className="text-center py-12 text-m3-on-surface-variant">
            <ShieldCheck className="w-8 h-8 text-m3-primary/40 mx-auto mb-2" />
            <p className="text-xs font-semibold text-m3-on-surface">Tidak ada tunnel VPN aktif</p>
            <p className="text-[11px] text-m3-on-surface-variant/70 mt-1 max-w-xs mx-auto">
              Sinkronisasi SNMP perangkat untuk mendeteksi tunnel & sesi PPP MikroTik
            </p>
          </div>
        ) : (
          vpnTunnels.map((vpn) => {
            const isConnected = vpn.status === 'connected';
            const badge = getVpnTypeBadge(vpn.type);
            return (
              <div
                key={vpn.id}
                className={`p-3 rounded-m3-2xl border transition-all space-y-2 shadow-2xs ${
                  isConnected
                    ? 'bg-m3-surface-container border-m3-outline-variant/30 hover:border-emerald-500/40'
                    : 'bg-m3-surface-container/60 border-m3-outline-variant/20 hover:border-rose-500/30 opacity-75'
                }`}
              >
                {/* Row 1: Status Icon, Tunnel Name, Type Badge, and Connection State */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1.5 rounded-full shrink-0 relative ${
                        isConnected
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </>
                      ) : (
                        <ShieldAlert className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-m3-on-surface truncate" title={vpn.name}>
                      {vpn.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md border font-bold ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>

                {/* Row 2: User, IP, and Uptime */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-m3-on-surface-variant font-mono pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-m3-surface-container-high px-1.5 py-0.5 rounded text-[10px]">
                      <Globe className="w-3 h-3 text-m3-primary/70" />
                      {vpn.remote_ip || '0.0.0.0'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-sans font-medium text-m3-on-surface text-[11px]">
                      <User className="w-3 h-3 text-m3-on-surface-variant/70" />
                      {vpn.user || 'Unknown'}
                    </span>
                    {vpn.uptime && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-m3-on-surface-variant" title={vpn.uptime}>
                        <Clock className="w-2.5 h-2.5" />
                        {formatCompactUptime(vpn.uptime)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3: Live Throughput in standard bit/sec */}
                {isConnected && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-m3-outline-variant/20 text-[10px] font-mono">
                    <span className="text-[10px] text-m3-on-surface-variant font-sans font-semibold">
                      Trafik Data:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
                        title="Trafik Masuk (Rx)"
                      >
                        <ArrowDown className="w-3 h-3 mr-0.5" />
                        {formatBits(vpn.bytes_in)}
                      </span>
                      <span
                        className="inline-flex items-center text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20"
                        title="Trafik Keluar (Tx)"
                      >
                        <ArrowUp className="w-3 h-3 mr-0.5" />
                        {formatBits(vpn.bytes_out)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </M3Card>
  );
};
