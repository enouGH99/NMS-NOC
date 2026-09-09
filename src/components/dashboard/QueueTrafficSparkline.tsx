'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatThroughput } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface QueueTrafficSparklineProps {
  queueId: string;
  downloadRate: number; // Mbps
  uploadRate: number; // Mbps
  maxLimitStr: string; // e.g. "120M/120M"
  height?: number;
  unitMode?: 'auto' | 'mbps' | 'kbps' | 'bps';
  showLegend?: boolean;
  showBadges?: boolean;
  compact?: boolean;
}

export const QueueTrafficSparkline: React.FC<QueueTrafficSparklineProps> = ({
  queueId,
  downloadRate,
  uploadRate,
  maxLimitStr,
  height = 48,
  unitMode = 'auto',
  showLegend = true,
  showBadges = false,
  compact = false,
}) => {
  // Parse Max Limit (e.g. 100 from "100M/100M")
  const maxLimitNum = parseInt(maxLimitStr.split('/')[1] || maxLimitStr.replace(/[^0-9]/g, '') || '100', 10) || 100;

  // History buffer (keeps last 16 data points for smooth waveform)
  const [history, setHistory] = useState<{ dl: number; ul: number }[]>(() => {
    const initial: { dl: number; ul: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const variance = Math.sin(i * 0.5) * 0.15 + 1;
      initial.push({
        dl: Math.max(0, Number((downloadRate * variance).toFixed(2))),
        ul: Math.max(0, Number((uploadRate * variance).toFixed(2))),
      });
    }
    return initial;
  });

  const latestDlRef = useRef(downloadRate);
  const latestUlRef = useRef(uploadRate);
  latestDlRef.current = downloadRate;
  latestUlRef.current = uploadRate;

  // Real-time ticking effect to shift the waveform smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((prev) => {
        const baseDl = latestDlRef.current;
        const baseUl = latestUlRef.current;
        const dlJitter = baseDl > 0 ? (Math.random() * 0.12 - 0.06) * baseDl : 0;
        const ulJitter = baseUl > 0 ? (Math.random() * 0.12 - 0.06) * baseUl : 0;

        const nextDl = Math.max(0, Number((baseDl + dlJitter).toFixed(2)));
        const nextUl = Math.max(0, Number((baseUl + ulJitter).toFixed(2)));

        return [...prev.slice(1), { dl: nextDl, ul: nextUl }];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const svgWidth = 260;
  const svgHeight = compact ? 32 : height;
  const padding = compact ? 2 : 4;

  const peakVal = Math.max(...history.map((p) => Math.max(p.dl, p.ul)), maxLimitNum * 0.2, 1);
  const scaleY = (val: number) => {
    const norm = Math.min(val / peakVal, 1);
    return Math.round(svgHeight - padding - norm * (svgHeight - padding * 2));
  };

  const stepX = svgWidth / (history.length - 1);

  // Download (Rx)
  const dlPoints = history.map((p, i) => `${i * stepX},${scaleY(p.dl)}`);
  const dlPath = `M ${dlPoints.join(' L ')}`;
  const dlAreaPath = `${dlPath} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

  // Upload (Tx)
  const ulPoints = history.map((p, i) => `${i * stepX},${scaleY(p.ul)}`);
  const ulPath = `M ${ulPoints.join(' L ')}`;

  const safeQueueId = queueId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const gradDlId = `grad-dl-${safeQueueId}`;
  const gradUlId = `grad-ul-${safeQueueId}`;

  return (
    <div className="w-full space-y-1">
      {/* Mini SVG Chart */}
      <div
        className={`w-full rounded-m3-lg bg-m3-surface-container-lowest/90 border border-m3-outline-variant/20 p-1 relative overflow-hidden group shadow-inner ${
          compact ? 'h-8' : 'h-12'
        }`}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradDlId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={gradUlId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Guideline */}
          <line
            x1="0"
            y1={scaleY(peakVal * 0.5)}
            x2={svgWidth}
            y2={scaleY(peakVal * 0.5)}
            stroke="rgba(140, 145, 153, 0.15)"
            strokeDasharray="2 2"
          />

          {/* Paths */}
          <path d={dlAreaPath} fill={`url(#${gradDlId})`} />
          <path d={dlPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={ulPath} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Live Dots */}
          <circle
            cx={svgWidth}
            cy={scaleY(history[history.length - 1]?.dl || 0)}
            r="3"
            fill="#10b981"
            className="animate-pulse"
          />
          <circle
            cx={svgWidth}
            cy={scaleY(history[history.length - 1]?.ul || 0)}
            r="2"
            fill="#38bdf8"
          />
        </svg>

        {showBadges && (
          <div className="absolute top-0.5 left-1.5 flex flex-wrap items-center gap-1 text-[9px] font-mono pointer-events-none">
            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-1 rounded">
              ↓ {formatThroughput(downloadRate, unitMode)}
            </span>
            <span className="text-sky-400 font-bold bg-sky-500/10 px-1 rounded">
              ↑ {formatThroughput(uploadRate, unitMode)}
            </span>
          </div>
        )}
      </div>

      {/* Optional Bottom Mini Legend */}
      {showLegend && !compact && (
        <div className="flex items-center justify-between text-[10px] text-m3-on-surface-variant font-mono px-0.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Rx (DL)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
              <span>Tx (UL)</span>
            </span>
          </div>
          <span className="text-[10px] opacity-75 truncate">Maks: {maxLimitStr}</span>
        </div>
      )}
    </div>
  );
};
