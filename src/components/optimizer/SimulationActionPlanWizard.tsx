'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import {
  ListChecks,
  CheckCircle2,
  TrendingDown,
  Activity,
  Cpu,
  Zap,
  HardDrive,
  ShieldCheck,
  Play,
  Check,
} from 'lucide-react';

export const SimulationActionPlanWizard: React.FC = () => {
  const { aiSimulation, addAuditLog } = useNms();

  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: 'Langkah 1: Pencadangan Konfigurasi (Backup RouterOS)',
      description: 'Lakukan ekspor file binary backup dan skrip .rsc pada MikroTik CCR2004 sebelum modifikasi.',
      command: '/system backup save name=backup-pre-ai-opt',
    },
    {
      id: 2,
      title: 'Langkah 2: Terapkan Penyesuaian Queue PCQ & FastTrack',
      description: 'Eksekusi skrip QoS adaptif untuk meratakan bandwidth staff dan aktifkan FastTrack bypass.',
      command: '/ip firewall filter add chain=forward action=fasttrack-connection connection-state=established,related',
    },
    {
      id: 3,
      title: 'Langkah 3: Segregasi & Isolasi VLAN CCTV (VLAN 40)',
      description: 'Pindahkan port NVR streaming ke SFP-Plus2 agar beban switch distribusi tidak terbebani video feed.',
      command: '/interface vlan add name=VLAN40-CCTV vlan-id=40 interface=bridge-lan',
    },
    {
      id: 4,
      title: 'Langkah 4: Validasi & Uji Benchmark Kinerja Jaringan',
      description: 'Jalankan pengujian ICMP ping 100 paket dan verifikasi packet loss bernilai 0%.',
      command: '/tool ping 192.168.1.1 count=100 interval=20ms',
    },
  ];

  const toggleStep = (stepId: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const handleRunSimulation = () => {
    setSimulationRunning(true);
    setTimeout(() => {
      setSimulationRunning(false);
      setSimulatedScore(aiSimulation.predicted_health_score);
      addAuditLog(
        'RUN_AI_SIMULATION',
        'Menjalankan simulasi prediksi performa optimasi jaringan dengan hasil skor 98/100'
      );
    }, 1200);
  };

  return (
    <M3Card className="p-5 sm:p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-m3-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-m3-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ListChecks className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-m3-on-surface tracking-tight">
              Simulasi Kinerja & Panduan Aksi Teknisi
            </h3>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-1">
            Panduan langkah eksekusi bertahap yang aman serta kalkulator simulasi dampak sebelum dan sesudah optimasi
          </p>
        </div>

        <M3Button
          variant="filled"
          loading={simulationRunning}
          onClick={handleRunSimulation}
          icon={<Play className="w-4 h-4" />}
        >
          Jalankan Simulasi Prediksi AI
        </M3Button>
      </div>

      {/* 1. Before vs After Performance Impact Simulator */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider">
          Simulasi Perbandingan Metrik (Sebelum vs Sesudah Optimasi AI)
        </h4>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Latency */}
          <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-m3-on-surface-variant flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Latensi Rata-Rata
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono text-m3-on-surface-variant line-through">
                {aiSimulation.current_avg_latency} ms
              </span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {aiSimulation.predicted_avg_latency} ms
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
              ↓ 66% Lebih Cepat
            </span>
          </div>

          {/* Packet Loss */}
          <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-m3-on-surface-variant flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-500" />
              Tingkat Packet Loss
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono text-m3-on-surface-variant line-through">
                {aiSimulation.current_packet_loss}%
              </span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {aiSimulation.predicted_packet_loss}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
              Zero Loss (Stabil)
            </span>
          </div>

          {/* Peak CPU */}
          <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-m3-on-surface-variant flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-m3-primary" />
              Beban Puncak CPU
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono text-m3-on-surface-variant line-through">
                {aiSimulation.current_cpu_peak}%
              </span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {aiSimulation.predicted_cpu_peak}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
              ↓ 44% Lebih Ringan
            </span>
          </div>

          {/* Health Index */}
          <div className="p-3.5 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-m3-on-surface-variant flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              Skor Kesehatan Jaringan
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono text-m3-on-surface-variant line-through">
                {aiSimulation.network_health_score}
              </span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {aiSimulation.predicted_health_score}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
              Target 98/100 (Prima)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Step-by-Step Execution Plan Checklist */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider">
          Panduan Langkah Eksekusi Teknisi ({completedSteps.length}/{steps.length} Selesai)
        </h4>

        <div className="space-y-3">
          {steps.map((step) => {
            const isChecked = completedSteps.includes(step.id);

            return (
              <div
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className={`p-4 rounded-m3-2xl border cursor-pointer select-none transition-all space-y-2 shadow-2xs ${
                  isChecked
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-m3-surface-container-high/60 border-m3-outline-variant/30 hover:border-m3-outline-variant/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                        isChecked
                          ? 'bg-emerald-500 text-white'
                          : 'bg-m3-surface-container-highest text-m3-on-surface-variant border border-m3-outline-variant/40'
                      }`}
                    >
                      {isChecked ? <Check className="w-3.5 h-3.5" /> : step.id}
                    </div>
                    <div>
                      <h5
                        className={`font-bold text-sm ${
                          isChecked
                            ? 'text-m3-on-surface line-through opacity-80'
                            : 'text-m3-on-surface'
                        }`}
                      >
                        {step.title}
                      </h5>
                      <p className="text-xs text-m3-on-surface-variant mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isChecked
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                    }`}
                  >
                    {isChecked ? 'Selesai' : 'Belum'}
                  </span>
                </div>

                <div className="pl-9">
                  <div className="p-2 rounded-m3-md bg-black/10 dark:bg-black/40 font-mono text-[10px] text-m3-on-surface border border-m3-outline-variant/20 overflow-x-auto">
                    <code>{step.command}</code>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </M3Card>
  );
};
