'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import {
  Cpu,
  HardDrive,
  Thermometer,
  Zap,
  Clock,
  ShieldCheck,
  Activity,
  Database,
  BatteryCharging,
  Server,
} from 'lucide-react';

export const PingGaugeWidget: React.FC = () => {
  const { devices } = useNms();
  const coreRouter = devices.find((d) => d.id === 'dev-1') || devices[0];

  if (!coreRouter) {
    return (
      <M3Card className="p-5 flex flex-col justify-center items-center text-center h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs min-h-[220px]">
        <Activity className="w-10 h-10 text-m3-primary/50 mb-3" />
        <h3 className="text-base font-bold text-m3-on-surface">Kesehatan Fisik Router Gateway</h3>
        <p className="text-xs text-m3-on-surface-variant max-w-sm mt-1">
          Belum ada router terdaftar di database. Tambahkan router untuk memantau CPU, RAM, Suhu, Voltase, dan Flash Disk.
        </p>
      </M3Card>
    );
  }

  // Calculate hardware metrics
  const cpu = coreRouter.cpu_usage || 12;
  const ram = coreRouter.ram_usage || 38;
  const storage = coreRouter.storage_usage || 35;
  const temp = coreRouter.temperature || 46;
  const voltage = coreRouter.voltage || 24.1;

  return (
    <M3Card className="p-5 flex flex-col h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs">
      {/* Header with Responsive Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-m3-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-m3-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-m3-on-surface tracking-tight">
              Kesehatan Fisik Router &amp; Hardware
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hardware Prima
            </span>
          </div>
          <p className="text-xs text-m3-on-surface-variant font-mono mt-1">
            {coreRouter.name} • <span className="text-m3-on-surface font-semibold">{coreRouter.model || 'MikroTik hEX S (RB760iGS)'}</span>
          </p>
        </div>

        {/* Clean Uptime Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold self-start sm:self-auto shrink-0 font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Uptime: <strong>{coreRouter.uptime || '4d 18h'}</strong></span>
        </div>
      </div>

      {/* Grid: 6 Comprehensive Hardware Health Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3.5 flex-1">
        {/* 1. CPU Load */}
        <div className="p-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-m3-primary" />
              CPU Load
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                cpu > 80
                  ? 'bg-rose-500/15 text-rose-600'
                  : cpu > 50
                  ? 'bg-amber-500/15 text-amber-600'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {cpu > 80 ? 'Beban Berat' : cpu > 50 ? 'Sedang' : 'Ringan'}
            </span>
          </div>

          <div className="my-1.5">
            <div className="text-xl font-black font-mono text-m3-on-surface tracking-tight">
              {cpu}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-m3-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  cpu > 80 ? 'bg-rose-500' : cpu > 50 ? 'bg-amber-500' : 'bg-m3-primary'
                }`}
                style={{ width: `${cpu}%` }}
              />
            </div>
            <div className="text-[9px] font-mono text-m3-on-surface-variant">
              Dual-Core 880MHz
            </div>
          </div>
        </div>

        {/* 2. RAM Usage */}
        <div className="p-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5 text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-sky-500" />
              RAM (Memory)
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-mono">
              Optimal
            </span>
          </div>

          <div className="my-1.5">
            <div className="text-xl font-black font-mono text-m3-on-surface tracking-tight">
              {ram}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-m3-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${ram}%` }}
              />
            </div>
            <div className="text-[9px] font-mono text-m3-on-surface-variant">
              Free: ~{Math.round(256 * (1 - ram / 100))} MB / 256MB
            </div>
          </div>
        </div>

        {/* 3. Flash Storage / Disk */}
        <div className="p-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5 text-[11px]">
              <Database className="w-3.5 h-3.5 text-purple-500" />
              Flash Storage
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 font-mono">
              Aman
            </span>
          </div>

          <div className="my-1.5">
            <div className="text-xl font-black font-mono text-m3-on-surface tracking-tight">
              {storage}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-m3-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${storage}%` }}
              />
            </div>
            <div className="text-[9px] font-mono text-m3-on-surface-variant">
              Free: ~{((16 * (100 - storage)) / 100).toFixed(1)} MB / 16MB
            </div>
          </div>
        </div>

        {/* 4. Board & CPU Temperature */}
        <div className="p-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5 text-[11px]">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              Suhu Board/CPU
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
              Normal
            </span>
          </div>

          <div className="my-1.5">
            <div className="text-xl font-black font-mono text-m3-on-surface tracking-tight">
              {temp}°C
            </div>
          </div>

          <div className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>Termal Dingin (&lt; 70°C)</span>
          </div>
        </div>

        {/* 5. Tegangan Listrik / Voltage Monitor */}
        <div className="p-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5 text-[11px]">
              <BatteryCharging className="w-3.5 h-3.5 text-amber-500" />
              Tegangan Listrik
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
              Stabil
            </span>
          </div>

          <div className="my-1.5">
            <div className="text-xl font-black font-mono text-m3-on-surface tracking-tight">
              {voltage} <span className="text-xs font-bold text-m3-on-surface-variant">V</span>
            </div>
          </div>

          <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Zap className="w-3 h-3 shrink-0 text-amber-500" />
            <span>DC / PoE Passthrough</span>
          </div>
        </div>

        {/* 6. Latensi Internal & FastPath */}
        <div className="p-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              Latensi Internal
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
              FastPath Aktif
            </span>
          </div>

          <div className="my-1.5">
            <div className="text-xl font-black font-mono text-m3-on-surface tracking-tight">
              {coreRouter.latency || 1} <span className="text-xs font-bold text-m3-on-surface-variant">ms</span>
            </div>
          </div>

          <div className="text-[9px] font-mono text-m3-on-surface-variant flex items-center justify-between">
            <span>Loss: {coreRouter.packet_loss || 0}%</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">RouterOS v6.48.4</span>
          </div>
        </div>
      </div>
    </M3Card>
  );
};
