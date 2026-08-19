'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useNms } from '@/lib/store';
import { StatCard } from '@/components/dashboard/StatCard';
import { LiveThroughputChart } from '@/components/dashboard/LiveThroughputChart';
import { QueueTrafficChart } from '@/components/dashboard/QueueTrafficChart';
import { VpnStatusWidget } from '@/components/dashboard/VpnStatusWidget';
import { RecentAlertsWidget } from '@/components/dashboard/RecentAlertsWidget';
import { PingGaugeWidget } from '@/components/dashboard/PingGaugeWidget';
import { AiInsightWidget } from '@/components/dashboard/AiInsightWidget';
import { M3Button } from '@/components/m3/M3Button';
import { M3Dialog } from '@/components/m3/M3Dialog';
import { M3Switch } from '@/components/m3/M3Switch';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Map,
  Plus,
  Wrench,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
} from 'lucide-react';

export default function DashboardPage() {
  const { liveStats, dashboardWidgets, toggleDashboardWidget } = useNms();
  const [customizeOpen, setCustomizeOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Greeting & Quick Navigation Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-m3-surface-container-low p-6 rounded-m3-3xl border border-m3-outline-variant/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-m3-on-surface tracking-tight">
              Pusat Operasi Jaringan (NOC Dashboard)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-primary/15 text-m3-primary font-extrabold uppercase tracking-wider">
              Live Monitor
            </span>
          </div>
          <p className="text-xs md:text-sm text-m3-on-surface-variant">
            Pemantauan performa real-time, throughput bandwidth, dan kesehatan perangkat kantor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Widget Customizer Trigger */}
          <M3Button
            variant="outlined"
            size="sm"
            onClick={() => setCustomizeOpen(true)}
            icon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Atur Widget
          </M3Button>

          <Link href="/optimizer">
            <M3Button
              variant="filled-tonal"
              size="sm"
              icon={<Sparkles className="w-4 h-4 text-m3-primary" />}
            >
              AI Optimizer
            </M3Button>
          </Link>

          <Link href="/map">
            <M3Button
              variant="filled"
              size="sm"
              icon={<Map className="w-4 h-4" />}
            >
              Peta Topologi
            </M3Button>
          </Link>
        </div>
      </div>

      {/* Global Status Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Perangkat"
          value={liveStats.totalDevices}
          subtitle="Router, Switch, AP, Server"
          icon={<Server className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Node Online"
          value={liveStats.onlineCount}
          subtitle="Beroperasi Normal"
          icon={<CheckCircle2 className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="Peringatan"
          value={liveStats.warningCount}
          subtitle="Latensi / Degradasi"
          icon={<AlertTriangle className="w-6 h-6" />}
          variant="warning"
        />
        <StatCard
          title="Node Offline"
          value={liveStats.offlineCount}
          subtitle="Putus / Power Loss"
          icon={<XCircle className="w-6 h-6" />}
          variant="error"
        />
        <StatCard
          title="SLA Ketersediaan"
          value={`${liveStats.slaPercent}%`}
          subtitle="Target Bulanan > 99.5%"
          icon={<Activity className="w-6 h-6" />}
          variant="info"
          trend={{ value: '+0.2%', isPositive: true }}
        />
      </div>

      {/* Main Grid: Dynamically rendered based on widget preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Throughput Area Chart (2 cols) */}
        {dashboardWidgets.throughput_chart && (
          <div className="lg:col-span-2">
            <LiveThroughputChart />
          </div>
        )}

        {/* AI Insights Widget (1 col) */}
        {dashboardWidgets.ai_insights && (
          <div className={dashboardWidgets.throughput_chart ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <AiInsightWidget />
          </div>
        )}

        {/* Core Gateway Hardware & Latency (1 col) */}
        {dashboardWidgets.ping_gauge && (
          <div className="lg:col-span-1">
            <PingGaugeWidget />
          </div>
        )}

        {/* Simple Queue Bandwidth (1 col) */}
        {dashboardWidgets.simple_queues && (
          <div className="lg:col-span-1">
            <QueueTrafficChart />
          </div>
        )}

        {/* VPN Status Widget (1 col) */}
        {dashboardWidgets.vpn_status && (
          <div className="lg:col-span-1">
            <VpnStatusWidget />
          </div>
        )}

        {/* Recent Incidents Feed (1 col) */}
        {dashboardWidgets.recent_alerts && (
          <div className="lg:col-span-1">
            <RecentAlertsWidget />
          </div>
        )}
      </div>

      {/* Widget Layout Customizer Modal Dialog */}
      <M3Dialog
        isOpen={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        title="Kustomisasi Tata Letak Widget Dashboard"
      >
        <div className="space-y-4">
          <p className="text-xs text-m3-on-surface-variant leading-relaxed">
            Aktifkan atau nonaktifkan modul widget sesuai peran dan kebutuhan pemantauan Anda di layar NOC.
          </p>

          <div className="space-y-3 pt-2">
            {[
              {
                key: 'throughput_chart' as const,
                title: 'Grafik Real-time Throughput',
                desc: 'Visualisasi grafik live trafik Inbound & Outbound Gateway',
              },
              {
                key: 'ai_insights' as const,
                title: 'AI Optimization Insights (Fase 6)',
                desc: 'Temuan anomali log MikroTik dan skor efisiensi AI',
              },
              {
                key: 'ping_gauge' as const,
                title: 'Kesehatan Core Gateway & Uptime',
                desc: 'Metrik CPU, RAM, Suhu Board, dan latensi ping gateway',
              },
              {
                key: 'simple_queues' as const,
                title: 'Manajemen Bandwidth Simple Queue',
                desc: 'Utilisasi bandwidth dan pembagian kuota per divisi/subnet',
              },
              {
                key: 'vpn_status' as const,
                title: 'Status Tunnel VPN & Remote Users',
                desc: 'Monitoring koneksi WireGuard, L2TP, IPsec',
              },
              {
                key: 'recent_alerts' as const,
                title: 'Feed Peringatan Gangguan Terkini',
                desc: 'Daftar insiden dan status acknowledge teknisi',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30"
              >
                <div className="pr-4">
                  <h5 className="font-bold text-xs text-m3-on-surface">{item.title}</h5>
                  <p className="text-[11px] text-m3-on-surface-variant mt-0.5">{item.desc}</p>
                </div>
                <M3Switch
                  checked={dashboardWidgets[item.key]}
                  onChange={() => toggleDashboardWidget(item.key)}
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-m3-outline-variant/30 flex justify-end">
            <M3Button variant="filled" onClick={() => setCustomizeOpen(false)}>
              Simpan Tata Letak
            </M3Button>
          </div>
        </div>
      </M3Dialog>
    </div>
  );
}
