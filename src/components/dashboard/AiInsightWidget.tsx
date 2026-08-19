'use client';

import React from 'react';
import Link from 'next/link';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const AiInsightWidget: React.FC = () => {
  const { aiSimulation, aiAnomalies, lanRoutes, deviceOptimizationPlans } = useNms();

  const criticalAnom = aiAnomalies.find((a) => a.severity === 'high') || aiAnomalies[0];
  const pendingRoutes = lanRoutes.filter((r) => r.status === 'pending');

  return (
    <M3Card className="p-5 flex flex-col justify-between h-full border border-m3-primary/30 bg-gradient-to-br from-m3-surface-container via-m3-surface-container-high to-m3-surface-container shadow-xs">
      <div className="space-y-3.5">
        {/* Header with AI Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-m3-outline-variant/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-m3-xl bg-gradient-to-tr from-m3-primary to-sky-400 text-white shadow-2xs">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-m3-on-surface tracking-tight">
                AI Optimization Insights
              </h3>
              <p className="text-[10px] text-m3-on-surface-variant font-medium">
                Analisis Log MikroTik & Metrik Cerdas
              </p>
            </div>
          </div>

          <span className="text-[11px] font-black font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            Skor: {aiSimulation.network_health_score}/100
          </span>
        </div>

        {/* Top Critical Finding / Clean Status */}
        {criticalAnom ? (
          <div className="p-3 rounded-m3-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Temuan Kritis Teratas</span>
            </div>
            <p className="text-xs text-m3-on-surface font-semibold line-clamp-1">
              {criticalAnom.title}
            </p>
            <p className="text-[11px] text-m3-on-surface-variant line-clamp-1">
              {criticalAnom.impact}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-m3-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Jaringan Berjalan Normal</span>
            </div>
            <p className="text-xs text-m3-on-surface font-medium">
              Tidak ada anomali atau bottleneck kritis terdeteksi oleh AI Engine.
            </p>
          </div>
        )}

        {/* Actionable Recommendations Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-m3-xl bg-m3-surface-container-lowest/80 border border-m3-outline-variant/20">
            <span className="text-[10px] text-m3-on-surface-variant block font-sans">
              Rekomendasi Rute
            </span>
            <span className="font-bold text-sky-600 dark:text-sky-400">
              {pendingRoutes.length} Rute Pending
            </span>
          </div>

          <div className="p-2.5 rounded-m3-xl bg-m3-surface-container-lowest/80 border border-m3-outline-variant/20">
            <span className="text-[10px] text-m3-on-surface-variant block font-sans">
              Skrip RouterOS
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {deviceOptimizationPlans.length} Skrip Siap
            </span>
          </div>
        </div>
      </div>

      {/* Button to Open Full AI Optimizer */}
      <div className="pt-3 border-t border-m3-outline-variant/20 mt-3">
        <Link href="/optimizer" className="block">
          <M3Button
            fullWidth
            variant="filled-tonal"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Buka AI Network Optimizer
          </M3Button>
        </Link>
      </div>
    </M3Card>
  );
};
