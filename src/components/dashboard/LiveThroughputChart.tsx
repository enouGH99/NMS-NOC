'use client';

import React from 'react';
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
import { ArrowDownLeft, ArrowUpRight, Activity } from 'lucide-react';
import { formatMbps } from '@/lib/utils';

export const LiveThroughputChart: React.FC = () => {
  const { throughputHistory, liveStats } = useNms();

  return (
    <M3Card className="p-5 flex flex-col h-full border border-m3-outline-variant/30">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-m3-md bg-m3-primary/15 text-m3-primary">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-m3-on-surface">
              Trafik Ethernet & WAN Real-Time
            </h3>
            <p className="text-xs text-m3-on-surface-variant">
              Pemantauan throughput gabungan (MikroTik CCR2004 Gateway)
            </p>
          </div>
        </div>

        {/* Current In/Out Indicators */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>RX: {formatMbps(liveStats.currentInboundMbps)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>TX: {formatMbps(liveStats.currentOutboundMbps)}</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-64 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={throughputHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              stroke="#8c9199"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#8c9199"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(27, 32, 36, 0.95)',
                borderRadius: '16px',
                border: '1px solid rgba(140, 145, 153, 0.3)',
                fontSize: '12px',
                color: '#dfe3e8',
                boxShadow: '0px 4px 12px rgba(0,0,0,0.3)',
              }}
              formatter={(value: any, name: any) => [
                `${value} Mbps`,
                name === 'inbound' ? 'Download (Inbound)' : 'Upload (Outbound)',
              ]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              formatter={(val) => (val === 'inbound' ? 'Inbound (Download)' : 'Outbound (Upload)')}
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
      </div>
    </M3Card>
  );
};
