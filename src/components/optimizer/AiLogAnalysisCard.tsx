'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import {
  Sparkles,
  AlertCircle,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Search,
  Zap,
  Activity,
  Terminal,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const AiLogAnalysisCard: React.FC = () => {
  const {
    aiAnomalies,
    aiSimulation,
    isAiAnalyzing,
    aiScanProgress,
    runAiOptimizationScan,
  } = useNms();

  return (
    <M3Card className="p-5 sm:p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-6 shadow-xs">
      {/* Header with AI Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-m3-outline-variant/30">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-m3-2xl bg-gradient-to-tr from-m3-primary to-sky-400 text-white shadow-m3-1 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-m3-on-surface tracking-tight">
                Analisis Log MikroTik & Metrik Anomali AI
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-primary/15 text-m3-primary font-bold border border-m3-primary/30">
                AI Engine Live
              </span>
            </div>
            <p className="text-xs text-m3-on-surface-variant mt-0.5">
              Mengevaluasi log sistem, error packet, lonjakan CPU, dan anomali trafik secara cerdas
            </p>
          </div>
        </div>

        <M3Button
          variant="filled"
          loading={isAiAnalyzing}
          onClick={runAiOptimizationScan}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          {isAiAnalyzing ? `Menganalisis (${aiScanProgress}%)` : 'Pindai Log & Anomali Baru'}
        </M3Button>
      </div>

      {/* Progress Bar when Scanning */}
      {isAiAnalyzing && (
        <div className="space-y-2 p-3 rounded-m3-2xl bg-m3-surface-container-high border border-m3-primary/30 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-m3-on-surface">
            <span className="flex items-center gap-2 text-m3-primary">
              <Activity className="w-4 h-4 animate-spin" />
              Memeriksa 12.500+ entri log MikroTik & data SNMP time-series...
            </span>
            <span className="font-mono">{aiScanProgress}%</span>
          </div>
          <div className="h-2 w-full bg-m3-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-m3-primary to-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${aiScanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Health Score & Anomaly Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Card */}
        <div className="p-4 rounded-m3-2xl bg-m3-surface-container-low border border-m3-outline-variant/30 flex flex-col justify-between space-y-3">
          <span className="text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider">
            Indeks Efisiensi Jaringan AI
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-m3-on-surface">
              {aiSimulation.network_health_score}
            </span>
            <span className="text-sm font-semibold text-m3-on-surface-variant">/ 100</span>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-m3-surface-container-highest h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  aiSimulation.network_health_score > 85
                    ? 'bg-emerald-500'
                    : aiSimulation.network_health_score > 70
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${aiSimulation.network_health_score}%` }}
              />
            </div>
            <p className="text-[10px] text-m3-on-surface-variant">
              {aiSimulation.network_health_score > 85
                ? 'Kondisi Jaringan Prima'
                : 'Ditemukan bottleneck & anomali yang perlu dioptimalkan'}
            </p>
          </div>
        </div>

        {/* Bottleneck Summary */}
        <div className="p-4 rounded-m3-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between space-y-3">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Bottleneck Terdeteksi
          </span>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {aiAnomalies.length} Masalah
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-tight">
            1 Queue Congestion, 1 Interface Flap, dan 1 Anomali Port Scan
          </p>
        </div>

        {/* AI Action Status */}
        <div className="p-4 rounded-m3-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between space-y-3">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Potensi Peningkatan Performa
          </span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            +300%
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-tight">
            Throughput LAN dapat meningkat hingga 3x lipat jika rekomendasi diterapkan
          </p>
        </div>
      </div>

      {/* Identified Anomalies List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Daftar Anomali & Temuan Log ({aiAnomalies.length})
          </h4>
          <span className="text-[11px] text-m3-on-surface-variant font-mono">
            Diperbarui: {formatDate(new Date().toISOString())}
          </span>
        </div>

        <div className="space-y-3">
          {aiAnomalies.map((anom) => (
            <div
              key={anom.id}
              className="p-4 rounded-m3-2xl bg-m3-surface-container-high/80 border border-m3-outline-variant/30 space-y-3 shadow-2xs hover:border-m3-outline-variant/60 transition-colors"
            >
              {/* Anomaly Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      anom.severity === 'high'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        : anom.severity === 'medium'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {anom.severity === 'high' ? 'Kritis' : anom.severity === 'medium' ? 'Peringatan' : 'Info'}
                  </span>
                  <h5 className="font-bold text-sm text-m3-on-surface">{anom.title}</h5>
                </div>
                <span className="text-[11px] font-mono text-m3-on-surface-variant shrink-0">
                  Sumber: {anom.source_device}
                </span>
              </div>

              {/* Anomaly Details */}
              <p className="text-xs text-m3-on-surface leading-relaxed">
                {anom.description}
              </p>

              {/* Log Snippet Box */}
              <div className="p-2.5 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/20 font-mono text-[11px] text-m3-on-surface-variant flex items-start gap-2">
                <Terminal className="w-3.5 h-3.5 text-m3-primary shrink-0 mt-0.5" />
                <span className="break-all">{anom.log_sample}</span>
              </div>

              {/* Root Cause & Impact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-m3-outline-variant/20">
                <div className="p-2 rounded-m3-md bg-m3-surface-container-low">
                  <span className="text-[10px] font-bold text-m3-on-surface-variant block">Akar Masalah (AI Analysis)</span>
                  <span className="text-m3-on-surface font-medium text-[11px]">{anom.root_cause}</span>
                </div>
                <div className="p-2 rounded-m3-md bg-m3-surface-container-low">
                  <span className="text-[10px] font-bold text-m3-on-surface-variant block">Dampak Terhadap Jaringan</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">{anom.impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </M3Card>
  );
};
