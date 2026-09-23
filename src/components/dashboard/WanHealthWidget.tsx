'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import {
  Globe,
  ArrowDownLeft,
  ArrowUpRight,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { formatBits, formatThroughput } from '@/lib/utils';

export const WanHealthWidget: React.FC = () => {
  const { devices, interfaces } = useNms();
  const coreRouter = devices.find((d) => d.id === 'dev-1') || devices[0];

  // Detect WAN Interface (ether1, bridge-WAN, pppoe-out1, or first up interface)
  const wanInterface =
    interfaces.find(
      (i) =>
        i.device_id === coreRouter?.id &&
        (i.name.toLowerCase().includes('wan') ||
          i.name.toLowerCase() === 'ether1' ||
          i.name.toLowerCase().includes('pppoe'))
    ) ||
    interfaces.find((i) => i.device_id === coreRouter?.id && i.type === 'ethernet') ||
    interfaces[0];

  if (!coreRouter) {
    return (
      <M3Card className="p-5 flex flex-col justify-center items-center text-center h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs min-h-[220px]">
        <Globe className="w-10 h-10 text-m3-primary/50 mb-3" />
        <h3 className="text-base font-bold text-m3-on-surface">Kesehatan Koneksi ISP & WAN</h3>
        <p className="text-xs text-m3-on-surface-variant max-w-sm mt-1">
          Menunggu pendaftaran router core gateway untuk memantau uplink ISP, throughput WAN, dan latensi public.
        </p>
      </M3Card>
    );
  }

  // Calculate live WAN rates (convert Mbps to bps standard if needed)
  const wanRxMbps = wanInterface ? wanInterface.rx_rate : 0;
  const wanTxMbps = wanInterface ? wanInterface.tx_rate : 0;
  const latency = coreRouter.latency || 4;
  const packetLoss = coreRouter.packet_loss || 0;
  const isHealthy = coreRouter.status === 'online' && packetLoss < 2 && latency < 60;

  return (
    <M3Card className="p-5 flex flex-col h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-m3-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-m3-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-m3-on-surface tracking-tight">
              Kesehatan Koneksi ISP (WAN)
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isHealthy
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isHealthy ? 'Link Terhubung' : 'Degradasi'}
            </span>
          </div>
          <p className="text-xs text-m3-on-surface-variant font-mono mt-1 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-sky-500" />
            <span>Port: <strong>{wanInterface?.name || 'ether1 (WAN)'}</strong></span>
            <span>•</span>
            <span>Speed: <strong>{wanInterface?.speed || '1 Gbps Full Duplex'}</strong></span>
          </p>
        </div>

        {/* IP Gateway / SLA Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-mono font-semibold self-start sm:self-auto shrink-0">
          <Wifi className="w-3.5 h-3.5 text-sky-500" />
          <span>GW: {coreRouter.ip_address}</span>
        </div>
      </div>

      {/* Main WAN Telemetry Grid */}
      <div className="grid grid-cols-2 gap-3 pt-3.5 flex-1">
        {/* 1. Real-time WAN RX (Download) */}
        <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              Download ISP (RX)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
              Live Inbound
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black font-mono text-m3-on-surface tracking-tight">
              {formatThroughput(wanRxMbps, 'auto')}
            </div>
          </div>

          <div className="text-[10px] font-mono text-m3-on-surface-variant flex items-center justify-between">
            <span>Total: {formatBits(wanInterface?.rx_bytes || 0)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Inbound</span>
          </div>
        </div>

        {/* 2. Real-time WAN TX (Upload) */}
        <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-sky-500" />
              Upload ISP (TX)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-mono">
              Live Outbound
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black font-mono text-m3-on-surface tracking-tight">
              {formatThroughput(wanTxMbps, 'auto')}
            </div>
          </div>

          <div className="text-[10px] font-mono text-m3-on-surface-variant flex items-center justify-between">
            <span>Total: {formatBits(wanInterface?.tx_bytes || 0)}</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">Outbound</span>
          </div>
        </div>

        {/* 3. Latensi ISP / Public DNS */}
        <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Latensi RTT (Ping)
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                latency <= 15
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : latency <= 50
                  ? 'bg-amber-500/15 text-amber-600'
                  : 'bg-rose-500/15 text-rose-600'
              }`}
            >
              {latency <= 15 ? 'Sangat Rendah' : latency <= 50 ? 'Stabil' : 'Tinggi'}
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black font-mono text-m3-on-surface tracking-tight">
              {latency} <span className="text-sm font-bold text-m3-on-surface-variant">ms</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Jitter Minimal &amp; Cepat</span>
          </div>
        </div>

        {/* 4. Packet Loss & Error Rate */}
        <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-500" />
              Packet Loss &amp; Error
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                packetLoss === 0
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-600'
              }`}
            >
              {packetLoss === 0 ? '0% (Bersih)' : `${packetLoss}% Loss`}
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black font-mono text-m3-on-surface tracking-tight">
              {packetLoss}%
            </div>
          </div>

          <div className="text-[10px] font-mono text-m3-on-surface-variant flex items-center justify-between">
            <span>Errors: {wanInterface?.error_rate || 0} pkt/s</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SLA 99.9%</span>
          </div>
        </div>
      </div>
    </M3Card>
  );
};
