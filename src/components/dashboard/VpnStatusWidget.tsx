'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { ShieldCheck, ShieldAlert, ArrowDown, ArrowUp } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

export const VpnStatusWidget: React.FC = () => {
  const { vpnTunnels } = useNms();

  return (
    <M3Card className="p-5 flex flex-col h-full border border-m3-outline-variant/30">
      <div className="flex items-center justify-between pb-3 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-m3-md bg-m3-primary/15 text-m3-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-m3-on-surface">
              Status Tunnel & Sesi VPN
            </h3>
            <p className="text-xs text-m3-on-surface-variant">
              Koneksi Site-to-Site & Remote Petugas Lapangan
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-3 flex-1 overflow-y-auto">
        {vpnTunnels.map((vpn) => {
          const isConnected = vpn.status === 'connected';
          return (
            <div
              key={vpn.id}
              className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={`p-2 rounded-full shrink-0 ${
                    isConnected
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {isConnected ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-m3-on-surface truncate flex items-center gap-1.5">
                    <span>{vpn.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-m3-surface-container-highest text-m3-on-surface-variant">
                      {vpn.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-m3-on-surface-variant flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{vpn.remote_ip}</span>
                    <span>•</span>
                    <span>{vpn.user}</span>
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
                  <div className="text-[10px] font-mono text-m3-on-surface-variant flex items-center gap-1 mt-0.5 justify-end">
                    <span className="flex items-center">
                      <ArrowDown className="w-2.5 h-2.5 text-emerald-500 inline" />
                      {formatBytes(vpn.bytes_in)}
                    </span>
                    <span className="flex items-center ml-1">
                      <ArrowUp className="w-2.5 h-2.5 text-sky-500 inline" />
                      {formatBytes(vpn.bytes_out)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </M3Card>
  );
};
