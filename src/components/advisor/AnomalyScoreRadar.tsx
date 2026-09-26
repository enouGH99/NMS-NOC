'use client';

import React from 'react';
import { AnomalyReport, NetworkAnomaly } from '@/lib/anomaly-detector';
import { ShieldCheck, AlertTriangle, ShieldAlert, Activity, ArrowRight, Zap } from 'lucide-react';
import { M3Card } from '@/components/m3/M3Card';

interface AnomalyScoreRadarProps {
  report: AnomalyReport | null;
  onSelectAction?: (prompt: string) => void;
}

export const AnomalyScoreRadar: React.FC<AnomalyScoreRadarProps> = ({ report, onSelectAction }) => {
  if (!report) {
    return (
      <M3Card className="p-4 bg-m3-surface-container-low border border-m3-outline-variant/30 animate-pulse">
        <div className="h-4 bg-m3-surface-container-high rounded w-1/3 mb-2" />
        <div className="h-20 bg-m3-surface-container-high rounded w-full" />
      </M3Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/30',
          badge: 'Sistem Prima (Healthy)',
          icon: ShieldCheck,
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/15',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500/30',
          badge: 'Waspada (Warning)',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-rose-500/15',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500/30',
          badge: 'Anomali Kritis (Critical)',
          icon: ShieldAlert,
        };
    }
  };

  const statusStyle = getStatusColor(report.status);
  const StatusIcon = statusStyle.icon;

  return (
    <div className="space-y-3">
      {/* Radar Health Card */}
      <M3Card className="p-4 bg-gradient-to-br from-m3-surface-container-low to-m3-surface-container border border-m3-outline-variant/30 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-m3-xl ${statusStyle.bg} ${statusStyle.text}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-m3-on-surface">Indikator Kesehatan AIOps</div>
              <div className="text-[10px] text-m3-on-surface-variant font-mono">
                Telemetri & Log Analyzer
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
            {statusStyle.badge}
          </span>
        </div>

        {/* Dual Gauge Bar */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-m3-xl bg-m3-surface-container-high/60 border border-m3-outline-variant/20">
            <div className="text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
              Health Score
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {report.overallHealthScore}%
            </div>
            <div className="w-full bg-m3-surface-container-highest h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${report.overallHealthScore}%` }}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-m3-xl bg-m3-surface-container-high/60 border border-m3-outline-variant/20">
            <div className="text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
              Anomaly Index
            </div>
            <div className={`text-2xl font-black font-mono ${report.overallAnomalyScore > 30 ? 'text-amber-500' : 'text-m3-on-surface'}`}>
              {report.overallAnomalyScore}/100
            </div>
            <div className="w-full bg-m3-surface-container-highest h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  report.overallAnomalyScore > 60 ? 'bg-rose-500' : report.overallAnomalyScore > 30 ? 'bg-amber-500' : 'bg-m3-primary'
                }`}
                style={{ width: `${report.overallAnomalyScore}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-m3-on-surface-variant leading-relaxed">
          {report.summary}
        </p>
      </M3Card>

      {/* Detected Anomalies List */}
      {report.anomalies.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-m3-on-surface-variant px-1 flex items-center justify-between">
            <span>Daftar Anomali Aktif ({report.anomalies.length})</span>
            <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Rekomendasi RCA
            </span>
          </div>

          {report.anomalies.map((anom) => (
            <div
              key={anom.id}
              className="p-3 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/30 space-y-2 hover:border-m3-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-xs text-m3-on-surface flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  {anom.title}
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 font-bold shrink-0">
                  {anom.anomalyScore}%
                </span>
              </div>

              <div className="text-[11px] text-m3-on-surface-variant">
                <strong className="text-m3-on-surface">Target:</strong> <code className="font-mono text-[10px] bg-m3-surface-container px-1 rounded">{anom.affectedTarget}</code>
              </div>

              <div className="p-2 rounded-m3-lg bg-m3-surface-container text-[11px] space-y-1 text-m3-on-surface-variant">
                <div>
                  <strong className="text-m3-on-surface">Akar Masalah (RCA):</strong> {anom.rootCause}
                </div>
                <div className="text-emerald-700 dark:text-emerald-300 font-medium">
                  <strong>Solusi:</strong> {anom.suggestedAction}
                </div>
              </div>

              {onSelectAction && (
                <button
                  onClick={() => onSelectAction(`Bagaimana cara mitigasi anomali: ${anom.title} pada ${anom.affectedTarget}?`)}
                  className="w-full mt-1 py-1.5 px-2 rounded-m3-lg bg-m3-primary/10 hover:bg-m3-primary/20 text-m3-primary font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Minta AI Analisis & Buat Script Mitigasi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
