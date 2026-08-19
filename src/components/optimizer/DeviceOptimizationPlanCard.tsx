'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import {
  FileCode,
  Check,
  Copy,
  Sliders,
  Shield,
  Zap,
  CheckCircle2,
  Terminal,
  Cpu,
} from 'lucide-react';

export const DeviceOptimizationPlanCard: React.FC = () => {
  const { deviceOptimizationPlans, applyOptimizationPlan } = useNms();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <M3Card className="p-5 sm:p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-6 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-m3-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-m3-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-m3-on-surface tracking-tight">
              Rencana Optimasi Perangkat & Skrip MikroTik
            </h3>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-1">
            Saran penyesuaian Queue QoS, firewall rules, dan alokasi resource CPU siap salin dan eksekusi
          </p>
        </div>

        <span className="text-[11px] px-3 py-1 rounded-m3-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 self-start sm:self-auto">
          {deviceOptimizationPlans.filter(p => p.applied).length} / {deviceOptimizationPlans.length} Rencana Terpasang
        </span>
      </div>

      {/* Optimization Plans Grid */}
      <div className="space-y-4">
        {deviceOptimizationPlans.map((plan) => (
          <div
            key={plan.id}
            className={`p-4 sm:p-5 rounded-m3-2xl border transition-all space-y-3.5 shadow-2xs ${
              plan.applied
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : 'bg-m3-surface-container-high/70 border-m3-outline-variant/30 hover:border-m3-outline-variant/60'
            }`}
          >
            {/* Plan Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-m3-primary/15 text-m3-primary border border-m3-primary/30">
                    {plan.category.replace('_', ' ')}
                  </span>
                  <h4 className="font-bold text-sm text-m3-on-surface">{plan.title}</h4>
                </div>
                <div className="text-[11px] text-m3-on-surface-variant font-mono mt-0.5">
                  Target: {plan.device_name} ({plan.device_ip})
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  +{plan.impact_score}% Efisiensi
                </span>
                {plan.applied && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Diterapkan
                  </span>
                )}
              </div>
            </div>

            {/* Plan Description */}
            <p className="text-xs text-m3-on-surface leading-relaxed">
              {plan.description}
            </p>

            {/* Terminal Script Window */}
            <div className="rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/30 overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between px-3 py-1.5 bg-m3-surface-container-high border-b border-m3-outline-variant/20 text-xs">
                <span className="font-mono text-[10px] text-m3-on-surface-variant flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-m3-primary" />
                  RouterOS CLI Script Generator
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(plan.id, plan.cli_script)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-m3-primary hover:underline"
                >
                  {copiedId === plan.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Skrip Terminal</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono text-m3-on-surface overflow-x-auto whitespace-pre leading-relaxed bg-black/10 dark:bg-black/30">
                <code>{plan.cli_script}</code>
              </pre>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-1 border-t border-m3-outline-variant/20">
              <span className="text-[10px] text-m3-on-surface-variant font-mono">
                Keamanan Skrip: Terverifikasi oleh NMS AI Engine
              </span>

              {!plan.applied ? (
                <M3Button
                  size="sm"
                  variant="filled-tonal"
                  onClick={() => applyOptimizationPlan(plan.id)}
                  icon={<Zap className="w-3.5 h-3.5" />}
                >
                  Terapkan Konfigurasi Otomatis
                </M3Button>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Berjalan di Router
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </M3Card>
  );
};
