'use client';

import React, { useState, useEffect } from 'react';
import { ObservabilityHealth } from '@/lib/types';
import { Radio, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

interface ObservabilityStatusBannerProps {
  onRefresh?: () => void;
}

export const ObservabilityStatusBanner: React.FC<ObservabilityStatusBannerProps> = ({ onRefresh }) => {
  const [health, setHealth] = useState<ObservabilityHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/observability/health');
      const data = await res.json();
      if (data.success && data.data) {
        setHealth(data.data);
      }
    } catch {
      // Fallback state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    fetchHealth();
    if (onRefresh) onRefresh();
  };

  const grafanaUrl = health?.grafana.url || 'http://192.168.100.8:3000';

  return (
    <div className="p-4 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-m3-lg bg-m3-primary/10 text-m3-primary">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-m3-on-surface flex items-center gap-2">
            <span>Stack Observability Kantor</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Live Connected
            </span>
          </h3>
          <p className="text-xs text-m3-on-surface-variant">
            Sinkronisasi stream log LogQL (Loki) dan metrik PromQL (Prometheus) terpusat
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Loki Service Pill */}
        <div className="px-3 py-1.5 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/20 flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${health?.loki.available ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-amber-500'}`} />
          <span className="font-semibold text-m3-on-surface">Grafana Loki</span>
          <span className="text-[10px] text-m3-on-surface-variant font-mono">
            {health?.loki.available ? `${health.loki.latencyMs}ms` : 'Mock Engine'}
          </span>
        </div>

        {/* Prometheus Service Pill */}
        <div className="px-3 py-1.5 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/20 flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${health?.prometheus.available ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-amber-500'}`} />
          <span className="font-semibold text-m3-on-surface">Prometheus</span>
          <span className="text-[10px] text-m3-on-surface-variant font-mono">
            {health?.prometheus.available ? `${health.prometheus.latencyMs}ms` : 'Mock Engine'}
          </span>
        </div>

        {/* Grafana Dashboard Link Button */}
        <a
          href={grafanaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-m3-lg bg-m3-primary text-m3-on-primary font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-all shadow-sm"
        >
          <span>Buka Grafana</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Refresh button */}
        <button
          onClick={handleManualRefresh}
          disabled={loading}
          className="p-1.5 rounded-m3-lg bg-m3-surface-container-high hover:bg-m3-on-surface/8 text-m3-on-surface-variant transition-colors"
          title="Segarkan status service"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};
