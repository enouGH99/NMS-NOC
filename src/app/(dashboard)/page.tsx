'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useNms } from '@/lib/store';
import { StatCard } from '@/components/dashboard/StatCard';
import { LiveThroughputChart } from '@/components/dashboard/LiveThroughputChart';
import { WanHealthWidget } from '@/components/dashboard/WanHealthWidget';
import { QueueTrafficChart } from '@/components/dashboard/QueueTrafficChart';
import { VpnStatusWidget } from '@/components/dashboard/VpnStatusWidget';
import { RecentAlertsWidget } from '@/components/dashboard/RecentAlertsWidget';
import { PingGaugeWidget } from '@/components/dashboard/PingGaugeWidget';
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
  SlidersHorizontal,
  RefreshCw,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    liveStats,
    dashboardWidgets,
    toggleDashboardWidget,
    autoRefreshInterval,
    setAutoRefreshInterval,
    isGlobalRefreshing,
    lastRefreshedAt,
    refreshAllData,
  } = useNms();
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const refreshIntervalOptions = [
    { label: '5 Detik', value: '5s' as const },
    { label: '10 Detik', value: '10s' as const },
    { label: '15 Detik', value: '15s' as const },
    { label: '30 Detik', value: '30s' as const },
    { label: 'Mati', value: 'off' as const },
  ];

  const formatLastRefreshed = (date: Date | null) => {
    if (!date) return '-';
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Banner / Greeting & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-m3-surface-container-low p-5 sm:p-6 rounded-m3-3xl border border-m3-outline-variant/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black text-m3-on-surface tracking-tight">
              Pusat Operasi Jaringan (NOC Dashboard)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-primary/15 text-m3-primary font-extrabold uppercase tracking-wider">
              Live Monitor
            </span>
          </div>
          <p className="text-xs md:text-sm text-m3-on-surface-variant">
            Pemantauan performa real-time, uplink ISP, throughput bandwidth, dan kesehatan fisik router
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

      {/* Global Auto-Refresh & Live Sync Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 shadow-2xs">
        {/* Interval Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-m3-on-surface mr-1">
            <Clock className="w-3.5 h-3.5 text-m3-primary" />
            <span>Pembaruan Otomatis:</span>
          </div>

          <div className="inline-flex flex-wrap items-center p-0.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30">
            {refreshIntervalOptions.map((opt) => {
              const isActive = autoRefreshInterval === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAutoRefreshInterval(opt.value)}
                  className={`px-2.5 py-1 rounded-m3-lg text-[11px] font-bold font-mono transition-all ${
                    isActive
                      ? 'bg-m3-primary text-m3-on-primary shadow-2xs'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sync Status Indicator & Manual Refresh Button */}
        <div className="flex items-center gap-3 justify-between md:justify-end">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-m3-on-surface-variant">
            {autoRefreshInterval !== 'off' ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live ({autoRefreshInterval})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-m3-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-m3-outline" />
                Manual
              </span>
            )}
            <span className="text-m3-outline">•</span>
            <span>Update: {formatLastRefreshed(lastRefreshedAt)}</span>
          </div>

          <button
            type="button"
            onClick={() => refreshAllData(true)}
            disabled={isGlobalRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-m3-xl bg-m3-primary/15 hover:bg-m3-primary/25 text-m3-primary text-xs font-bold transition-all disabled:opacity-50"
            title="Segarkan semua data tabel & grafik sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGlobalRefreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan Semua</span>
          </button>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Row 1: Real-time Throughput Area Chart (2 cols) + ISP WAN Health (1 col) */}
        {dashboardWidgets.throughput_chart && (
          <div className={dashboardWidgets.wan_health ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <LiveThroughputChart />
          </div>
        )}

        {dashboardWidgets.wan_health && (
          <div className={dashboardWidgets.throughput_chart ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <WanHealthWidget />
          </div>
        )}

        {/* Row 2: Queue Tree Bandwidth (2 cols) + Router Hardware Physical Health (1 col) */}
        {dashboardWidgets.simple_queues && (
          <div className={dashboardWidgets.ping_gauge ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <QueueTrafficChart />
          </div>
        )}

        {dashboardWidgets.ping_gauge && (
          <div className={dashboardWidgets.simple_queues ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <PingGaugeWidget />
          </div>
        )}

        {/* Row 3: Recent Alerts Feed (2 cols) + VPN Status (1 col) */}
        {dashboardWidgets.recent_alerts && (
          <div className={dashboardWidgets.vpn_status ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <RecentAlertsWidget />
          </div>
        )}

        {dashboardWidgets.vpn_status && (
          <div className={dashboardWidgets.recent_alerts ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <VpnStatusWidget />
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
                title: 'Grafik Real-time Throughput (5m, 10m, 15m, 30m)',
                desc: 'Visualisasi grafik live trafik Inbound & Outbound Gateway dengan pilihan rentang waktu dan aliran stream',
              },
              {
                key: 'wan_health' as const,
                title: 'Kesehatan Koneksi ISP (WAN Health)',
                desc: 'Status uplink ISP, negosiasi link port WAN, throughput real-time, latensi RTT, dan packet loss',
              },
              {
                key: 'ping_gauge' as const,
                title: 'Kesehatan Fisik Router & Hardware',
                desc: 'Metrik beban CPU, memori RAM, flash storage, sensor suhu board/CPU °C, tegangan voltase DC, dan uptime',
              },
              {
                key: 'simple_queues' as const,
                title: 'Manajemen Bandwidth Queue Tree',
                desc: 'Pohon hierarki antrean bandwidth, Packet Mark Mangle, & alokasi CIR/MIR',
              },
              {
                key: 'vpn_status' as const,
                title: 'Status Tunnel VPN & Remote Users',
                desc: 'Monitoring koneksi WireGuard, L2TP, IPsec, EoIP',
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
