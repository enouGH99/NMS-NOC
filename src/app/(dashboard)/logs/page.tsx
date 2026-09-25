'use client';

import React, { useState } from 'react';
import { ObservabilityStatusBanner } from '@/components/observability/ObservabilityStatusBanner';
import { LokiLogStreamViewer } from '@/components/observability/LokiLogStreamViewer';
import { PrometheusTrendCard } from '@/components/observability/PrometheusTrendCard';
import { MikrotikLogConfigCard } from '@/components/observability/MikrotikLogConfigCard';
import { Terminal, TrendingUp, Settings, Layers, ShieldCheck, Activity } from 'lucide-react';

export default function LogsObservabilityPage() {
  const [activeTab, setActiveTab] = useState<'loki' | 'prometheus' | 'config'>('loki');

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-m3-primary uppercase tracking-wider">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Observability Stack & Log Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight mt-1">
            Pusat Log & Analitik Terpadu
          </h1>
          <p className="text-xs md:text-sm text-m3-on-surface-variant mt-1">
            Streaming log MikroTik & server farm (Grafana Loki) dan analitik time-series jangka panjang (Prometheus API)
          </p>
        </div>
      </div>

      {/* Live Service Health Banner */}
      <ObservabilityStatusBanner />

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-m3-outline-variant/30 pb-1">
        <button
          onClick={() => setActiveTab('loki')}
          className={`px-4 py-2.5 rounded-t-m3-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'loki'
              ? 'border-m3-primary text-m3-primary bg-m3-primary/10'
              : 'border-transparent text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-on-surface/5'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Live Syslog Stream (Loki)</span>
        </button>

        <button
          onClick={() => setActiveTab('prometheus')}
          className={`px-4 py-2.5 rounded-t-m3-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'prometheus'
              ? 'border-m3-primary text-m3-primary bg-m3-primary/10'
              : 'border-transparent text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-on-surface/5'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analitik Kapasitas (Prometheus)</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 rounded-t-m3-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'config'
              ? 'border-m3-primary text-m3-primary bg-m3-primary/10'
              : 'border-transparent text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-on-surface/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Panduan Setup Syslog</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'loki' && <LokiLogStreamViewer />}
      {activeTab === 'prometheus' && <PrometheusTrendCard />}
      {activeTab === 'config' && <MikrotikLogConfigCard />}
    </div>
  );
}
