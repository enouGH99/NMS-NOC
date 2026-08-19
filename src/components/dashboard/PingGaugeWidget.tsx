'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { Cpu, HardDrive, Thermometer, Zap, Clock, ShieldCheck, Activity } from 'lucide-react';

export const PingGaugeWidget: React.FC = () => {
  const { devices } = useNms();
  const coreRouter = devices.find((d) => d.id === 'dev-1') || devices[0];

  return (
    <M3Card className="p-5 flex flex-col h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs">
      {/* Header with Responsive Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-m3-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-m3-on-surface tracking-tight">
              Kesehatan Core Gateway
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <p className="text-xs text-m3-on-surface-variant font-mono mt-0.5">
            {coreRouter.name} • <span className="text-m3-on-surface font-semibold">{coreRouter.ip_address}</span>
          </p>
        </div>

        {/* Clean Uptime Pill with Clock Icon */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold self-start sm:self-auto shrink-0">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Uptime: <strong>{coreRouter.uptime}</strong></span>
        </div>
      </div>

      {/* 4 Clean Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 pt-3.5 flex-1">
        {/* 1. CPU Load */}
        <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-m3-primary" />
              CPU Load
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              coreRouter.cpu_usage > 80
                ? 'bg-rose-500/15 text-rose-600'
                : coreRouter.cpu_usage > 50
                ? 'bg-amber-500/15 text-amber-600'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}>
              {coreRouter.cpu_usage > 80 ? 'Tinggi' : coreRouter.cpu_usage > 50 ? 'Sedang' : 'Rendah'}
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black text-m3-on-surface tracking-tight">
              {coreRouter.cpu_usage}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-m3-surface-container-highest h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  coreRouter.cpu_usage > 80
                    ? 'bg-rose-500'
                    : coreRouter.cpu_usage > 50
                    ? 'bg-amber-500'
                    : 'bg-m3-primary'
                }`}
                style={{ width: `${coreRouter.cpu_usage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. RAM Usage */}
        <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-sky-500" />
              RAM Usage
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400">
              Optimal
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black text-m3-on-surface tracking-tight">
              {coreRouter.ram_usage}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-m3-surface-container-highest h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${coreRouter.ram_usage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Temperature */}
        <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-500" />
              Suhu Board
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Normal
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black text-m3-on-surface tracking-tight">
              {coreRouter.temperature}°C
            </div>
          </div>

          <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Termal Stabil (&lt; 70°C)</span>
          </div>
        </div>

        {/* 4. Gateway Latency & Ping */}
        <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 flex flex-col justify-between hover:border-m3-outline-variant/40 transition-colors shadow-2xs">
          <div className="flex items-center justify-between text-xs text-m3-on-surface-variant">
            <span className="font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-500" />
              Latensi Ping
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Sangat Cepat
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black text-m3-on-surface tracking-tight">
              {coreRouter.latency} <span className="text-sm font-bold text-m3-on-surface-variant">ms</span>
            </div>
          </div>

          <div className="text-[10px] font-medium text-m3-on-surface-variant flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Packet Loss: <strong>{coreRouter.packet_loss}%</strong></span>
          </div>
        </div>
      </div>
    </M3Card>
  );
};
