'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { initialCapacityData } from '@/lib/mock-data';
import { M3Card } from '../m3/M3Card';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export const CapacityPlanningChart: React.FC = () => {
  return (
    <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-m3-outline-variant/30">
        <div>
          <h3 className="text-base font-bold text-m3-on-surface flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-m3-primary" />
            Prediksi Kapasitas (Capacity Planning AI)
          </h3>
          <p className="text-xs text-m3-on-surface-variant">
            Analisis tren historis & estimasi titik saturasi bandwidth (Threshold 500 Mbps)
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-m3-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Prediksi Penuh: Oktober 2026 (Perlu Upgrade Bandwidth)</span>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={initialCapacityData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 145, 153, 0.15)" />
            <XAxis dataKey="date" stroke="#8c9199" fontSize={11} />
            <YAxis stroke="#8c9199" fontSize={11} tickFormatter={(v) => `${v}M`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(27, 32, 36, 0.95)',
                borderRadius: '16px',
                border: '1px solid rgba(140, 145, 153, 0.3)',
                fontSize: '12px',
                color: '#dfe3e8',
              }}
              formatter={(value: any, name: any) => [
                `${value} Mbps`,
                name === 'bandwidth_used_mbps' ? 'Penggunaan Bandwidth' : 'Kapasitas Kontrak',
              ]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="bandwidth_used_mbps"
              name="Penggunaan Bandwidth"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="bandwidth_capacity_mbps"
              name="Kapasitas Kontrak (500M)"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </M3Card>
  );
};
