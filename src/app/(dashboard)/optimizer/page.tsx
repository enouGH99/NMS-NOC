'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { M3Tabs } from '@/components/m3/M3Tabs';
import { AiLogAnalysisCard } from '@/components/optimizer/AiLogAnalysisCard';
import { LanRouteRecommender } from '@/components/optimizer/LanRouteRecommender';
import { DeviceOptimizationPlanCard } from '@/components/optimizer/DeviceOptimizationPlanCard';
import { SimulationActionPlanWizard } from '@/components/optimizer/SimulationActionPlanWizard';
import { AiSetupConfigCard } from '@/components/optimizer/AiSetupConfigCard';
import {
  Sparkles,
  Layers,
  FileCode,
  ListChecks,
  Network,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Key,
  Settings,
} from 'lucide-react';

export default function AiOptimizerPage() {
  const { aiSimulation, aiAnomalies, lanRoutes, deviceOptimizationPlans, aiConfig } = useNms();

  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'Ringkasan Terpadu', icon: <Sparkles className="w-4 h-4" /> },
    {
      id: 'logs',
      label: `Analisis Log & Metrik (${aiAnomalies.length})`,
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'routes',
      label: `Rute LAN (${lanRoutes.length})`,
      icon: <Network className="w-4 h-4" />,
    },
    {
      id: 'devices',
      label: `Skrip MikroTik (${deviceOptimizationPlans.length})`,
      icon: <FileCode className="w-4 h-4" />,
    },
    {
      id: 'simulation',
      label: 'Simulasi & Panduan Aksi',
      icon: <ListChecks className="w-4 h-4" />,
    },
    {
      id: 'setup',
      label: 'Setup & API Key AI',
      icon: <Key className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero AI Banner */}
      <div className="relative p-6 sm:p-8 rounded-m3-3xl bg-gradient-to-br from-m3-surface-container via-m3-surface-container-high to-m3-surface-container border border-m3-primary/30 overflow-hidden shadow-m3-2">
        {/* Glow backdrop decoration */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-m3-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-m3-primary/20 to-sky-400/20 text-m3-primary text-xs font-bold border border-m3-primary/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NMS AI Network Optimizer Engine</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('setup')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-m3-surface-container-lowest text-m3-on-surface-variant hover:text-m3-on-surface text-xs font-mono font-semibold border border-m3-outline-variant/30 transition-colors"
              >
                <Key className="w-3 h-3 text-m3-primary" />
                <span>Model: {aiConfig.model}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-m3-on-surface tracking-tight">
              Pengoptimalan Jaringan Berbasis Kecerdasan Buatan (AI)
            </h1>
            <p className="text-xs sm:text-sm text-m3-on-surface-variant leading-relaxed">
              Menganalisis puluhan ribu entri log MikroTik, metrik SNMP time-series, serta pola trafik LAN secara otomatis untuk menghasilkan rencana optimasi jalur dan skrip konfigurasi perangkat siap pakai.
            </p>
          </div>

          {/* Quick Stat Pill Widget */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container-lowest/80 border border-m3-outline-variant/30 text-center">
              <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block">
                Skor Efisiensi
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {aiSimulation.network_health_score}/100
              </span>
            </div>

            <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container-lowest/80 border border-m3-outline-variant/30 text-center">
              <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block">
                Rencana Rute
              </span>
              <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                {lanRoutes.length} Rekomendasi
              </span>
            </div>

            <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container-lowest/80 border border-m3-outline-variant/30 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block">
                Skrip RouterOS
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {deviceOptimizationPlans.length} Siap Pasang
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="overflow-x-auto pb-1">
        <M3Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content Display */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          <AiLogAnalysisCard />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <LanRouteRecommender />
            <DeviceOptimizationPlanCard />
          </div>
          <SimulationActionPlanWizard />
          <AiSetupConfigCard />
        </div>
      )}

      {activeTab === 'logs' && <AiLogAnalysisCard />}
      {activeTab === 'routes' && <LanRouteRecommender />}
      {activeTab === 'devices' && <DeviceOptimizationPlanCard />}
      {activeTab === 'simulation' && <SimulationActionPlanWizard />}
      {activeTab === 'setup' && <AiSetupConfigCard />}
    </div>
  );
}
