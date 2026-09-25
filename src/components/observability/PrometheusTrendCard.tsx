'use client';

import React, { useState, useEffect } from 'react';
import { PrometheusMetricSeries } from '@/lib/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Activity, Cpu, HardDrive, Wifi, RefreshCw, Calendar, TrendingUp } from 'lucide-react';

export const PrometheusTrendCard: React.FC = () => {
  const [metricType, setMetricType] = useState<'cpu' | 'ram' | 'bandwidth'>('cpu');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [series, setSeries] = useState<PrometheusMetricSeries[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPrometheusMetrics = async () => {
    try {
      setLoading(true);
      const nowSec = Math.floor(Date.now() / 1000);
      const rangeSec = timeRange === '30d' ? 30 * 24 * 3600 : timeRange === '7d' ? 7 * 24 * 3600 : 24 * 3600;
      const step = timeRange === '30d' ? '6h' : timeRange === '7d' ? '2h' : '30m';

      let query = 'sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) * 100';
      let metricName = 'CPU Load (%)';

      if (metricType === 'ram') {
        query = '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100';
        metricName = 'Memory Usage (%)';
      } else if (metricType === 'bandwidth') {
        query = 'sum(rate(ifHCInOctets[5m]) + rate(ifHCOutOctets[5m])) * 8 / 1000000';
        metricName = 'Bandwidth Throughput (Mbps)';
      }

      const params = new URLSearchParams({
        query,
        start: String(nowSec - rangeSec),
        end: String(nowSec),
        step,
        metricName,
      });

      const res = await fetch(`/api/observability/prometheus?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.series)) {
        setSeries(data.series);
      }
    } catch (err) {
      console.warn('Gagal fetch data Prometheus:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrometheusMetrics();
  }, [metricType, timeRange]);

  const chartData = series[0]?.dataPoints || [];
  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const avgValue =
    chartData.length > 0
      ? (chartData.reduce((acc, curr) => acc + curr.value, 0) / chartData.length).toFixed(1)
      : '0';
  const maxValue =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.value)).toFixed(1)
      : '0';

  const unit = metricType === 'bandwidth' ? 'Mbps' : '%';
  const strokeColor = metricType === 'cpu' ? '#38bdf8' : metricType === 'ram' ? '#a855f7' : '#10b981';
  const gradientId = `prom-grad-${metricType}`;

  return (
    <div className="p-5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 flex flex-col gap-4 shadow-sm">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-m3-lg bg-m3-primary/10 text-m3-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-m3-on-surface flex items-center gap-2">
              <span>Analitik Kapasitas Historis (Prometheus API)</span>
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-m3-primary" />}
            </h3>
            <p className="text-xs text-m3-on-surface-variant">
              Tren beban kerja multi-hari langsung dari Prometheus Server (<code className="text-m3-primary font-mono text-[11px]">192.168.100.226:9090</code>)
            </p>
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-m3-surface-container-high p-1 rounded-m3-xl border border-m3-outline-variant/20">
          <button
            onClick={() => setMetricType('cpu')}
            className={`px-3 py-1 text-xs font-bold rounded-m3-lg transition-all flex items-center gap-1.5 ${
              metricType === 'cpu'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>CPU</span>
          </button>
          <button
            onClick={() => setMetricType('ram')}
            className={`px-3 py-1 text-xs font-bold rounded-m3-lg transition-all flex items-center gap-1.5 ${
              metricType === 'ram'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>RAM</span>
          </button>
          <button
            onClick={() => setMetricType('bandwidth')}
            className={`px-3 py-1 text-xs font-bold rounded-m3-lg transition-all flex items-center gap-1.5 ${
              metricType === 'bandwidth'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Trafik</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Pill Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/20">
          <div className="text-[11px] text-m3-on-surface-variant font-medium">Beban Terkini</div>
          <div className="text-base font-extrabold text-m3-on-surface mt-0.5">
            {latestValue} <span className="text-xs font-normal text-m3-on-surface-variant">{unit}</span>
          </div>
        </div>
        <div className="p-3 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/20">
          <div className="text-[11px] text-m3-on-surface-variant font-medium">Rata-Rata Periode</div>
          <div className="text-base font-extrabold text-m3-on-surface mt-0.5">
            {avgValue} <span className="text-xs font-normal text-m3-on-surface-variant">{unit}</span>
          </div>
        </div>
        <div className="p-3 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/20">
          <div className="text-[11px] text-m3-on-surface-variant font-medium">Puncak Tertinggi (Peak)</div>
          <div className="text-base font-extrabold text-amber-500 mt-0.5">
            {maxValue} <span className="text-xs font-normal text-m3-on-surface-variant">{unit}</span>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-end gap-1 text-xs font-bold">
        <span className="text-m3-on-surface-variant mr-2 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Rentang Waktu:</span>
        </span>
        {(['24h', '7d', '30d'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`px-2.5 py-1 rounded-m3-md transition-colors ${
              timeRange === r
                ? 'bg-m3-primary text-m3-on-primary'
                : 'bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface'
            }`}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v) => `${v}${unit === '%' ? '%' : ''}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
              formatter={(val: any) => [`${val} ${unit}`, 'Kapasitas']}
              labelFormatter={(label) => `Waktu: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
