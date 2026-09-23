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
  Gauge,
} from 'lucide-react';
import { formatThroughput } from '@/lib/utils';
import { M3Button } from '../m3/M3Button';

type TimeRange = '5m' | '10m' | '15m' | '30m';
type TickIntervalMode = 'auto' | '1m' | '2m' | '5m' | '10m' | '15m';
type StreamFilter = 'all' | 'wan' | 'lan';

interface RangeConfig {
  label: string;
  value: TimeRange;
  durationSec: number;
  samplingStepSec: number;
  autoTickSec: number;
  allowedTicks: { label: string; value: TickIntervalMode; sec: number }[];
  desc: string;
}

const RANGE_CONFIGS: Record<TimeRange, RangeConfig> = {
  '5m': {
    label: '5 Menit',
    value: '5m',
    durationSec: 300,
    samplingStepSec: 5,
    autoTickSec: 60, // Default 1 menit
    allowedTicks: [
      { label: 'Auto (1m)', value: 'auto', sec: 60 },
      { label: '1 Menit', value: '1m', sec: 60 },
      { label: '5 Menit', value: '5m', sec: 300 },
    ],
    desc: 'Rentang 5 Menit Terakhir',
  },
  '10m': {
    label: '10 Menit',
    value: '10m',
    durationSec: 600,
    samplingStepSec: 10,
    autoTickSec: 120, // Default 2 menit
    allowedTicks: [
      { label: 'Auto (2m)', value: 'auto', sec: 120 },
      { label: '1 Menit', value: '1m', sec: 60 },
      { label: '2 Menit', value: '2m', sec: 120 },
      { label: '5 Menit', value: '5m', sec: 300 },
    ],
    desc: 'Rentang 10 Menit Terakhir',
  },
  '15m': {
    label: '15 Menit',
    value: '15m',
    durationSec: 900,
    samplingStepSec: 15,
    autoTickSec: 300, // Default 5 menit (16:25, 16:30, 16:35 seperti Grafana)
    allowedTicks: [
      { label: 'Auto (5m)', value: 'auto', sec: 300 },
      { label: '2 Menit', value: '2m', sec: 120 },
      { label: '5 Menit', value: '5m', sec: 300 },
      { label: '15 Menit', value: '15m', sec: 900 },
    ],
    desc: 'Rentang 15 Menit Terakhir',
  },
  '30m': {
    label: '30 Menit',
    value: '30m',
    durationSec: 1800,
    samplingStepSec: 30,
    autoTickSec: 300, // Default 5 menit
    allowedTicks: [
      { label: 'Auto (5m)', value: 'auto', sec: 300 },
      { label: '5 Menit', value: '5m', sec: 300 },
      { label: '10 Menit', value: '10m', sec: 600 },
      { label: '15 Menit', value: '15m', sec: 900 },
    ],
    desc: 'Rentang 30 Menit Terakhir',
  },
};

export const LiveThroughputChart: React.FC = () => {
  const { liveStats, devices } = useNms();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('5m');
  const [selectedTickMode, setSelectedTickMode] = useState<TickIntervalMode>('auto');
  const [selectedStream, setSelectedStream] = useState<StreamFilter>('all');
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  const isStandby = devices.length === 0;

  // Realtime clock ticker every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const activeRange = RANGE_CONFIGS[selectedRange] || RANGE_CONFIGS['5m'];

  // Calculate actual effective tick interval in seconds
  const effectiveTickSec = useMemo(() => {
    if (selectedTickMode === 'auto') return activeRange.autoTickSec;
    const match = activeRange.allowedTicks.find((t) => t.value === selectedTickMode);
    return match ? match.sec : activeRange.autoTickSec;
  }, [selectedTickMode, activeRange]);

  // Stream Multiplier
  const streamMultiplier = useMemo(() => {
    if (selectedStream === 'wan') return { in: 0.85, out: 0.35, label: 'Jalur WAN ISP (ether1)' };
    if (selectedStream === 'lan') return { in: 0.75, out: 0.80, label: 'Distribusi Bridge LAN' };
    return { in: 1.0, out: 1.0, label: 'Semua Trafik (Agregat)' };
  }, [selectedStream]);

  // Reset tickMode to 'auto' when user switches range if previous mode is not allowed in new range
  useEffect(() => {
    const isAllowed = activeRange.allowedTicks.some((t) => t.value === selectedTickMode);
    if (!isAllowed) {
      setSelectedTickMode('auto');
    }
  }, [selectedRange, activeRange, selectedTickMode]);

  // Generate Grafana-style time series & round ticks
  const { chartData, xTicks, xDomain } = useMemo(() => {
    if (isStandby) return { chartData: [], xTicks: [], xDomain: [0, 1] };

    const { durationSec, samplingStepSec } = activeRange;
    const endMs = nowTimestamp;
    const startMs = endMs - durationSec * 1000;

    const baseIn = (liveStats.currentInboundMbps || 35) * streamMultiplier.in;
    const baseOut = (liveStats.currentOutboundMbps || 12) * streamMultiplier.out;

    const points = [];
    const totalSteps = Math.floor(durationSec / samplingStepSec);

    // 1. Generate smooth continuous curve points
    for (let i = 0; i <= totalSteps; i++) {
      const ts = startMs + i * samplingStepSec * 1000;

      const wave = Math.sin(ts / 15000) * (baseIn * 0.18);
      const noiseIn = Math.cos(ts / 8000) * (baseIn * 0.08);
      const noiseOut = Math.sin(ts / 9000) * (baseOut * 0.12);

      const inVal = Math.max(0.2, Number((baseIn + wave + noiseIn).toFixed(1)));
      const outVal = Math.max(0.1, Number((baseOut + wave * 0.3 + noiseOut).toFixed(1)));

      points.push({
        timestamp: ts,
        inbound: inVal,
        outbound: outVal,
      });
    }

    // 2. Generate clean round milestone ticks matching the chosen tick interval (Grafana standard)
    const tickMs = effectiveTickSec * 1000;
    const firstRoundTick = Math.ceil(startMs / tickMs) * tickMs;
    const ticks: number[] = [];

    for (let t = firstRoundTick; t <= endMs; t += tickMs) {
      ticks.push(t);
    }

    // If ticks list is empty or single, guarantee boundary ticks
    if (ticks.length === 0) {
      ticks.push(startMs, endMs);
    }

    return {
      chartData: points,
      xTicks: ticks,
      xDomain: [startMs, endMs],
    };
  }, [selectedRange, effectiveTickSec, streamMultiplier, isStandby, liveStats.currentInboundMbps, liveStats.currentOutboundMbps, nowTimestamp, activeRange]);

  // Format tick labels on X-axis (Grafana format)
  const formatXAxisTick = (unixMs: number) => {
    const d = new Date(unixMs);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');

    // If tick step is in seconds or 5m range with seconds precision
    if (effectiveTickSec < 60) {
      return `${h}:${m}:${s}`;
    }
    // Standard Grafana minute precision: 16:25, 16:30, 16:35
    return `${h}:${m}`;
  };

  const formatTooltipLabel = (unixMs: number) => {
    const d = new Date(unixMs);
    return `Waktu: ${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

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

      {/* Toolbar: Time Range, Tick Interval Adjuster, & Stream Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-0.5">
        {/* Left: Rentang Waktu Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-m3-on-surface-variant flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-m3-primary" />
            Rentang Waktu:
          </span>
          <div className="inline-flex items-center p-0.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30">
            {(['5m', '10m', '15m', '30m'] as TimeRange[]).map((val) => {
              const cfg = RANGE_CONFIGS[val];
              const isActive = selectedRange === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedRange(val)}
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

        {/* Middle: Tick Interval Selector (Sesuai Pilihan Rentang Waktu) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-m3-on-surface-variant flex items-center gap-1 font-mono">
            <Gauge className="w-3.5 h-3.5 text-emerald-500" />
            Interval Tick:
          </span>
          <div className="inline-flex items-center p-0.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30">
            {activeRange.allowedTicks.map((opt) => {
              const isActive = selectedTickMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedTickMode(opt.value)}
                  className={`px-2 py-0.5 rounded-m3-lg text-[10px] font-bold font-mono transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Stream Filter Toggle: All vs WAN vs Bridge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-m3-on-surface-variant flex items-center gap-1 font-mono">
            <Filter className="w-3.5 h-3.5 text-sky-500" />
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
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
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
                dataKey="timestamp"
                type="number"
                domain={xDomain as [number, number]}
                ticks={xTicks}
                tickFormatter={formatXAxisTick}
                stroke="#8c9199"
                fontSize={10}
                tickLine={true}
                axisLine={false}
                fontFamily="monospace"
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
                labelFormatter={formatTooltipLabel}
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
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#inboundGrad)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="outbound"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#outboundGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Axis Footer Scale Info (Grafana Style) */}
      <div className="flex items-center justify-between text-[10px] font-mono text-m3-on-surface-variant/80 px-1 pt-0.5 border-t border-m3-outline-variant/15">
        <span className="flex items-center gap-1 text-m3-primary font-bold">
          <Clock className="w-3 h-3" />
          <span>Skala: {activeRange.desc} (Tick: per {effectiveTickSec >= 60 ? `${effectiveTickSec / 60} Menit` : `${effectiveTickSec} Detik`})</span>
        </span>
        <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-semibold">
          {selectedRange === '15m'
            ? 'Format Grafana: Kelipatan 5 Menit (16:25, 16:30, 16:35)'
            : selectedRange === '5m'
            ? 'Format Grafana: Kelipatan 1 Menit (16:32, 16:33, 16:34)'
            : 'Format Grafana: Kelipatan Waktu Real-Time'}
        </span>
      </div>
    </M3Card>
  );
};
