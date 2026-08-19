'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { SlidersHorizontal, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { formatMbps } from '@/lib/utils';

export const QueueTrafficChart: React.FC = () => {
  const { queues } = useNms();

  return (
    <M3Card className="p-5 flex flex-col h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-m3-xl bg-m3-secondary-container text-m3-on-secondary-container shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-m3-on-surface tracking-tight">
              Manajemen Bandwidth Simple Queue
            </h3>
            <p className="text-xs text-m3-on-surface-variant">
              Utilisasi & batasan trafik per divisi / subnet MikroTik
            </p>
          </div>
        </div>

        <span className="text-[11px] px-3 py-1 rounded-m3-full bg-m3-surface-container-highest text-m3-on-surface font-bold self-start sm:self-auto shrink-0 border border-m3-outline-variant/30">
          {queues.length} Queues Aktif
        </span>
      </div>

      {/* Queue Cards List */}
      <div className="pt-3.5 space-y-3 flex-1 overflow-y-auto pr-1">
        {queues.map((q, idx) => {
          // Parse max download limit (e.g. 100M from "100M/100M")
          const maxNum = parseInt(q.max_limit.split('/')[1] || '100', 10);
          const currentDl = q.current_rate.download;
          const currentUl = q.current_rate.upload;
          const usagePercent = Math.min(100, Math.round((currentDl / maxNum) * 100));

          let barColor = 'bg-emerald-500';
          let badgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
          if (usagePercent > 80) {
            barColor = 'bg-rose-500';
            badgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20';
          } else if (usagePercent > 60) {
            barColor = 'bg-amber-500';
            badgeColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20';
          }

          return (
            <div
              key={q.id}
              className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-outline-variant/50 transition-colors space-y-2.5 shadow-2xs"
            >
              {/* Row 1: Name & Subnet Target */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="font-bold text-xs sm:text-sm text-m3-on-surface flex items-center gap-1.5">
                  <span className="text-m3-on-surface-variant font-mono text-[11px] font-semibold">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span>{q.name}</span>
                </div>

                <span className="font-mono text-[10px] text-m3-on-surface-variant bg-m3-surface-container-highest px-2 py-0.5 rounded-full border border-m3-outline-variant/30">
                  {q.target}
                </span>
              </div>

              {/* Row 2: Bandwidth Speed & Percentage Badge */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>{formatMbps(currentDl)}</span>
                  </div>
                  <span className="text-m3-on-surface-variant text-[11px]">
                    / maks {q.max_limit}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                >
                  {usagePercent}% Utilisasi
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="h-2 w-full rounded-full bg-m3-surface-container-highest overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              {/* Row 3: Upload Rate & Congestion status */}
              <div className="flex items-center justify-between text-[10px] font-mono text-m3-on-surface-variant pt-0.5">
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-sky-500" />
                  <span>Upload: {formatMbps(currentUl)}</span>
                </div>

                {q.dropped > 0 ? (
                  <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold font-sans">
                    <AlertCircle className="w-3 h-3" />
                    <span>{q.dropped} packet drops</span>
                  </div>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                    Antrean Lancar (0 drop)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </M3Card>
  );
};
