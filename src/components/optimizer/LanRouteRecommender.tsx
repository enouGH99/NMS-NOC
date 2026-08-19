'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import {
  Network,
  ArrowRight,
  CheckCircle2,
  GitFork,
  Zap,
  TrendingUp,
  Layers,
  Shield,
  Clock,
} from 'lucide-react';

export const LanRouteRecommender: React.FC = () => {
  const { lanRoutes, applyLanRouteRecommendation } = useNms();

  return (
    <M3Card className="p-5 sm:p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-6 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-m3-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-m3-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-m3-on-surface tracking-tight">
              Rekomendasi Jalur & Distribusi Beban LAN
            </h3>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-1">
            Penataan ulang rute transmisi, segregasi VLAN, dan offloading jalur LAN yang sering mengalami kemacetan
          </p>
        </div>

        <span className="text-[11px] px-3 py-1 rounded-m3-full bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold border border-sky-500/30 self-start sm:self-auto">
          {lanRoutes.filter(r => r.status === 'applied').length} / {lanRoutes.length} Rute Dioptimalkan
        </span>
      </div>

      {/* Routes Recommendation List */}
      <div className="space-y-4">
        {lanRoutes.map((route, idx) => {
          const isApplied = route.status === 'applied';

          return (
            <div
              key={route.id}
              className={`p-4 sm:p-5 rounded-m3-2xl border transition-all space-y-4 shadow-2xs ${
                isApplied
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-m3-surface-container-high/70 border-m3-outline-variant/30 hover:border-m3-outline-variant/60'
              }`}
            >
              {/* Title & Priority Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-m3-surface-container text-m3-primary border border-m3-outline-variant/30">
                    RUTE #{idx + 1}
                  </span>
                  <h4 className="font-bold text-sm text-m3-on-surface">{route.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      route.priority === 'critical'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {route.priority === 'critical' ? 'Prioritas Kritis' : 'Direkomendasikan'}
                  </span>

                  {isApplied ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Telah Diterapkan
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Subnet Target */}
              <div className="text-xs text-m3-on-surface-variant flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5 text-m3-primary" />
                <span>Target: <strong>{route.target_subnet}</strong></span>
                {route.vlan_id && (
                  <span className="bg-m3-primary/10 text-m3-primary px-2 py-0.2 rounded font-sans font-bold text-[10px]">
                    VLAN ID: {route.vlan_id}
                  </span>
                )}
              </div>

              {/* Visual Comparison: Current Route vs Recommended Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Current Bottleneck Route */}
                <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-rose-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Jalur Eksisting (Bottleneck)
                  </div>
                  <p className="text-xs text-m3-on-surface font-medium leading-relaxed">
                    {route.current_route}
                  </p>
                  <p className="text-[11px] text-m3-on-surface-variant italic">
                    Kendala: {route.current_bottleneck}
                  </p>
                </div>

                {/* AI Recommended Route */}
                <div className="p-3 rounded-m3-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Rekomendasi Jalur AI (Optimized)
                  </div>
                  <p className="text-xs text-m3-on-surface font-medium leading-relaxed">
                    {route.recommended_route}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>{route.expected_improvement}</span>
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-m3-outline-variant/20">
                <span className="text-[11px] text-m3-on-surface-variant font-mono">
                  Diverifikasi via AI Routing Analyzer
                </span>

                {!isApplied ? (
                  <M3Button
                    size="sm"
                    variant="filled"
                    onClick={() => applyLanRouteRecommendation(route.id)}
                    icon={<Zap className="w-3.5 h-3.5" />}
                  >
                    Terapkan Rekomendasi Jalur Ini
                  </M3Button>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Konfigurasi Jalur Aktif
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
