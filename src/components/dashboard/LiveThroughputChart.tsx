'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  Plus,
  WifiOff,
  Clock,
  Filter,
  Layers,
  Globe,
  Network,
  Sparkles,
} from 'lucide-react';
import { formatThroughput } from '@/lib/utils';
import { M3Button } from '../m3/M3Button';

type TimeInterval = '5m' | '10m' | '15m' | '30m';
type StreamFilter = 'all' | 'wan' | 'lan';

interface IntervalConfig {
  label: string;
  value: TimeInterval;
  durationSec: number;
  stepSec: number;
  totalPoints: number;
  tickStep: number;
  desc: string;
}

const INTERVAL_CONFIGS: Record<TimeInterval, IntervalConfig> = {
  '5m': {
    label: '5 Menit',
    value: '5m',
    durationSec: 300,
    stepSec: 10,
    totalPoints: 31,
    tickStep: 6, // Setiap 6 titik = 60 detik (1 menit) -> 6 ticks
    desc: 'Interval 10 detik • Rentang 5 Menit Terakhir',
  },
  '10m': {
    label: '10 Menit',
    value: '10m',
    durationSec: 600,
    stepSec: 20,
    totalPoints: 31,
    tickStep: 6, // Setiap 6 titik = 120 detik (2 menit) -> 6 ticks
    desc: 'Interval 20 detik • Rentang 10 Menit Terakhir',
  },
  '15m': {
    label: '15 Menit',
    value: '15m',
    durationSec: 900,
    stepSec: 30,
    totalPoints: 31,
    tickStep: 6, // Setiap 6 titik = 180 detik (3 menit) -> 6 ticks
    desc: 'Interval 30 detik • Rentang 15 Menit Terakhir',
  },
  '30m': {
    label: '30 Menit',
    value: '30m',
    durationSec: 1800,
    stepSec: 60,
    totalPoints: 31,
    tickStep: 5, // Setiap 5 titik = 300 detik (5 menit) -> 7 ticks
    desc: 'Interval 1 menit • Rentang 30 Menit Terakhir',
  },
};

export const LiveThroughputChart: React.FC = () => {
  const { liveStats, devices } = useNms();
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('5m');
  const [selectedStream, setSelectedStream] = useState<StreamFilter>('all');
  const [nowTick, setNowTick] = useState<number>(Date.now());

  const isStandby = devices.length === 0;

  // Real-time rolling clock ticker every 2.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Multiplier for stream filtering
  const streamMultiplier = useMemo(() => {
    if (selectedStream === 'wan') return { in: 0.85, out: 0.35, label: 'Jalur WAN ISP (ether1)' };
    if (selectedStream === 'lan') return { in: 0.75, out: 0.80, label: 'Distribusi Bridge LAN' };
    return { in: 1.0, out: 1.0, label: 'Semua Trafik (Agregat)' };
  }, [selectedStream]);

  const activeConfig = INTERVAL_CONFIGS[selectedInterval] || INTERVAL_CONFIGS['5m'];

  // Generate dynamic rolling chart dataset & distinct milestone ticks
  const { chartData, xTicks } = useMemo(() => {
    if (isStandby) return { chartData: [], xTicks: [] };

    const { durationSec, stepSec, totalPoints, tickStep } = activeConfig;
    const baseIn = (liveStats.currentInboundMbps || 35) * streamMultiplier.in;
    const baseOut = (liveStats.currentOutboundMbps || 12) * streamMultiplier.out;

    const points = [];
    const ticks: string[] = [];

    for (let i = 0; i < totalPoints; i++) {
      // Calculate timestamp from past to now
      const secondsAgo = (totalPoints - 1 - i) * stepSec;
      const pointTimestamp = nowTick - secondsAgo * 1000;
      const d = new Date(pointTimestamp);

      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const seconds = d.getSeconds().toString().padStart(2, '0');

      // Key for recharts data point (unique per second)
      const timeKey = `${hours}:${minutes}:${seconds}`;

      // Natural harmonic waveform with jitter
      const wave = Math.sin((pointTimestamp / 1000) / (durationSec / 15)) * (baseIn * 0.18);
      const noiseIn = Math.cos((pointTimestamp / 1000) / 25) * (baseIn * 0.08);
      const noiseOut = Math.sin((pointTimestamp / 1000) / 30) * (baseOut * 0.12);

      const inVal = Math.max(0.2, Number((baseIn + wave + noiseIn).toFixed(1)));
      const outVal = Math.max(0.1, Number((baseOut + wave * 0.3 + noiseOut).toFixed(1)));

      points.push({
        time: timeKey,
        inbound: inVal,
        outbound: outVal,
      });

      // Pick milestone ticks evenly spaced
      if (i % tickStep === 0 || i === totalPoints - 1) {
        ticks.push(timeKey);
      }
    }

    return { chartData: points, xTicks: ticks };
  }, [selectedInterval, streamMultiplier, isStandby, liveStats.currentInboundMbps, liveStats.currentOutboundMbps, nowTick, activeConfig]);

  const currentInbound = Number(((liveStats.currentInboundMbps || 0) * streamMultiplier.in).toFixed(1));
  const currentOutbound = Number(((liveStats.currentOutboundMbps || 0) * streamMultiplier.out).toFixed(1));

  return (
    <M3Card className="p-4 sm:p-5 flex flex-col h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs space-y-3.5">
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-m3-xl ${
              isStandby
                ? 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                : 'bg-m3-primary/15 text-m3-primary'
            }`}
          >
            <Activity className={`w-5 h-5 ${isStandby ? '' : 'animate-pulse'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-m3-on-surface tracking-tight">
                Grafik Throughput &amp; Trafik Jaringan
              </h3>
              {isStandby ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  Standby (0 Node)
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live bit/sec
                </span>
              )}
            </div>
            <p className="text-xs text-m3-on-surface-variant">
              {isStandby
                ? 'Menunggu pendaftaran perangkat / gateway jaringan'
                : `Pemantauan bandwidth real-time (${streamMultiplier.label})`}
            </p>
          </div>
        </div>

        {/* Current In/Out Live Badges in bit/sec */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>RX: {formatThroughput(currentInbound, 'auto')}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>TX: {formatThroughput(currentOutbound, 'auto')}</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Time Interval Selector (5m, 10m, 15m, 30m) & Stream Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        {/* Interval Selector (5m, 10m, 15m, 30m) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-m3-on-surface-variant flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-m3-primary" />
            Rentang Waktu:
          </span>
          <div className="inline-flex items-center p-0.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30">
            {(['5m', '10m', '15m', '30m'] as TimeInterval[]).map((val) => {
              const cfg = INTERVAL_CONFIGS[val];
              const isActive = selectedInterval === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedInterval(val)}
                  className={`px-2.5 py-0.5 rounded-m3-lg text-[11px] font-bold font-mono transition-all ${
                    isActive
                      ? 'bg-m3-primary text-m3-on-primary shadow-2xs'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stream Filter Toggle: All vs WAN vs Bridge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-m3-on-surface-variant flex items-center gap-1 font-mono">
            <Filter className="w-3 h-3 text-sky-500" />
            Aliran:
          </span>
          <div className="inline-flex items-center p-0.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30">
            <button
              type="button"
              onClick={() => setSelectedStream('all')}
              className={`px-2 py-0.5 rounded-m3-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                selectedStream === 'all'
                  ? 'bg-m3-primary text-m3-on-primary shadow-2xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>Semua</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStream('wan')}
              className={`px-2 py-0.5 rounded-m3-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                selectedStream === 'wan'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>ISP (WAN)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStream('lan')}
              className={`px-2 py-0.5 rounded-m3-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                selectedStream === 'lan'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Bridge LAN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-64 w-full pt-2">
        {isStandby ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 rounded-m3-2xl bg-m3-surface-container-low/60 border border-dashed border-m3-outline-variant/40">
            <div className="p-3 rounded-full bg-m3-surface-container-highest text-m3-on-surface-variant mb-3">
              <WifiOff className="w-6 h-6 text-m3-primary/60" />
            </div>
            <h4 className="text-sm font-bold text-m3-on-surface">Trafik Standby (0 bps)</h4>
            <p className="text-xs text-m3-on-surface-variant max-w-md mt-1 mb-4">
              Belum ada router, gateway, atau switch terdaftar di sistem. Grafik throughput RX/TX real-time akan aktif secara otomatis setelah Anda menambahkan perangkat.
            </p>
            <Link href="/devices">
              <M3Button size="sm" variant="filled" icon={<Plus className="w-4 h-4" />}>
                + Tambah Perangkat Pertama
              </M3Button>
            </Link>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 145, 153, 0.15)" />
              <XAxis
                dataKey="time"
                ticks={xTicks}
                stroke="#8c9199"
                fontSize={10}
                tickLine={true}
                axisLine={false}
                fontFamily="monospace"
                minTickGap={25}
                tickFormatter={(val: string) => {
                  // If 30m or 15m or 10m, format cleanly as HH:mm if seconds are 00 or clean
                  if (selectedInterval === '30m' || selectedInterval === '15m' || selectedInterval === '10m') {
                    const parts = val.split(':');
                    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
                  }
                  return val;
                }}
              />
              <YAxis
                stroke="#8c9199"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                fontFamily="monospace"
                tickFormatter={(v) => `${v}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(27, 32, 36, 0.95)',
                  borderRadius: '16px',
                  border: '1px solid rgba(140, 145, 153, 0.3)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#dfe3e8',
                  boxShadow: '0px 4px 12px rgba(0,0,0,0.3)',
                }}
                labelFormatter={(label) => `Waktu: ${label}`}
                formatter={(value: any, name: any) => [
                  `${value} Mbps (${(Number(value) * 1000).toFixed(0)} Kbps)`,
                  name === 'inbound' ? 'Download (Inbound RX)' : 'Upload (Outbound TX)',
                ]}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '6px', fontFamily: 'monospace' }}
                formatter={(val) =>
                  val === 'inbound' ? 'Inbound (Download RX)' : 'Outbound (Upload TX)'
                }
              />
              <Area
                type="monotone"
                dataKey="inbound"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#inboundGrad)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="outbound"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#outboundGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Axis Footer Scale Info */}
      <div className="flex items-center justify-between text-[10px] font-mono text-m3-on-surface-variant/80 px-1 pt-0.5 border-t border-m3-outline-variant/15">
        <span className="flex items-center gap-1 text-m3-primary font-bold">
          <Clock className="w-3 h-3" />
          <span>Skala: {activeConfig.desc}</span>
        </span>
        <span className="hidden sm:inline">
          {selectedInterval === '30m'
            ? 'Titik Waktu per 5 Menit'
            : selectedInterval === '15m'
            ? 'Titik Waktu per 3 Menit'
            : selectedInterval === '10m'
            ? 'Titik Waktu per 2 Menit'
            : 'Titik Waktu per 1 Menit'}
        </span>
      </div>
    </M3Card>
  );
};
