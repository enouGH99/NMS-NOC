'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNms } from '@/lib/store';
import { getStatusM3Badge } from '@/lib/m3-theme';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3Tabs } from '@/components/m3/M3Tabs';
import { PingTestModal } from '@/components/devices/PingTestModal';
import { AddRepairModal } from '@/components/repairs/AddRepairModal';
import { AddEditDeviceModal } from '@/components/devices/AddEditDeviceModal';
import { SnmpSyncModal } from '@/components/devices/SnmpSyncModal';
import { InterfaceTable } from '@/components/devices/InterfaceTable';
import { QueueTrafficSparkline } from '@/components/dashboard/QueueTrafficSparkline';
import {
  Server,
  ArrowLeft,
  Zap,
  Wrench,
  Edit2,
  Cpu,
  HardDrive,
  Thermometer,
  Activity,
  Layers,
  SlidersHorizontal,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Radio,
  Gauge,
  Search,
  AlertCircle,
} from 'lucide-react';
import { formatBytes, formatMbps, formatThroughput, formatDate } from '@/lib/utils';

import {
  generateDefaultInterfaces,
  initialQueues,
  initialVpnTunnels,
} from '@/lib/mock-data';

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { devices, interfaces, queues, vpnTunnels, repairRecords, syncInterfaces, syncVpnTunnels, syncQueues } = useNms();

  const deviceId = params.id as string;
  const device = devices.find((d) => d.id === deviceId);

  const [activeTab, setActiveTab] = useState('overview');
  const [pingModalOpen, setPingModalOpen] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [snmpModalOpen, setSnmpModalOpen] = useState(false);
  const [isScanningInterfaces, setIsScanningInterfaces] = useState(false);
  const [isSyncingVpns, setIsSyncingVpns] = useState(false);
  const [isSyncingQueues, setIsSyncingQueues] = useState(false);
  const [queueUnitMode, setQueueUnitMode] = useState<'auto' | 'mbps' | 'kbps' | 'bps'>('auto');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');

  if (!device) {
    return (
      <div className="text-center py-20 space-y-4">
        <Server className="w-12 h-12 text-m3-outline mx-auto opacity-50" />
        <h2 className="text-lg font-bold">Perangkat Tidak Ditemukan</h2>
        <Link href="/devices">
          <M3Button variant="filled">Kembali ke Daftar Perangkat</M3Button>
        </Link>
      </div>
    );
  }

  const statusBadge = getStatusM3Badge(device.status);

  // Resolve device interfaces (with auto-generator fallback)
  let deviceInterfaces = interfaces.filter((i) => i.device_id === device.id);
  if (deviceInterfaces.length === 0) {
    deviceInterfaces = generateDefaultInterfaces(device.id, device.type, device.mac_address, device.name);
  }

  // Resolve device queues
  let deviceQueues = queues.filter((q) => q.device_id === device.id);
  if (deviceQueues.length === 0 && device.type === 'router') {
    deviceQueues = initialQueues.map((q) => ({ ...q, id: `q-${device.id}-${q.id}`, device_id: device.id }));
  }

  // Resolve device VPNs
  let deviceVpns = vpnTunnels.filter((v) => v.device_id === device.id);
  if (deviceVpns.length === 0 && device.type === 'router') {
    deviceVpns = initialVpnTunnels.map((v) => ({ ...v, id: `vpn-${device.id}-${v.id}`, device_id: device.id }));
  }

  const deviceRepairs = repairRecords.filter((r) => r.device_id === device.id);

  const handleScanInterfaces = async () => {
    setSnmpModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-m3-surface-container-low p-6 rounded-m3-3xl border border-m3-outline-variant/30 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/devices">
              <button className="p-2 rounded-full hover:bg-m3-surface-container-highest text-m3-on-surface-variant transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-m3-on-surface">
                  {device.name}
                </h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text}`}
                >
                  {statusBadge.label}
                </span>
                {device.is_priority && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    ⭐ Prioritas Kritis
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  SNMP {device.snmp_version.toUpperCase()}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-m3-on-surface-variant mt-1 font-mono">
                {device.ip_address} • MAC: {device.mac_address} • Model: {device.model} • Lokasi: {device.location_name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <M3Button
              size="sm"
              variant="filled"
              onClick={() => setSnmpModalOpen(true)}
              icon={<Radio className="w-4 h-4" />}
            >
              Tarik Data Realtime (SNMP)
            </M3Button>
            <M3Button
              size="sm"
              variant="filled-tonal"
              onClick={() => setPingModalOpen(true)}
              icon={<Zap className="w-4 h-4" />}
            >
              Uji Ping
            </M3Button>
            <M3Button
              size="sm"
              variant="outlined"
              onClick={() => setRepairModalOpen(true)}
              icon={<Wrench className="w-4 h-4" />}
            >
              Catat Perbaikan
            </M3Button>
            <M3Button
              size="sm"
              variant="outlined"
              onClick={() => setEditModalOpen(true)}
              icon={<Edit2 className="w-4 h-4" />}
            >
              Edit
            </M3Button>
          </div>
        </div>

        {/* Tabs Bar */}
        <M3Tabs
          tabs={[
            { id: 'overview', label: 'Ringkasan & Hardware', icon: <Server className="w-4 h-4" /> },
            { id: 'interfaces', label: `Interface Port (${deviceInterfaces.length})`, icon: <Layers className="w-4 h-4" /> },
            { id: 'queues', label: `Bandwidth Queues (${deviceQueues.length})`, icon: <SlidersHorizontal className="w-4 h-4" /> },
            { id: 'vpns', label: `VPN Tunnels (${deviceVpns.length})`, icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'repairs', label: `Riwayat Perbaikan (${deviceRepairs.length})`, icon: <Wrench className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Tab 1: Overview & Hardware */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Gauges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <M3Card className="p-4 bg-m3-surface-container border border-m3-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-m3-on-surface-variant font-bold">
                <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-m3-primary" /> CPU Load</span>
                <span>{device.cpu_usage}%</span>
              </div>
              <div className="text-2xl font-black text-m3-on-surface">{device.cpu_usage}%</div>
              <div className="w-full bg-m3-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="h-full bg-m3-primary rounded-full" style={{ width: `${device.cpu_usage}%` }} />
              </div>
            </M3Card>

            <M3Card className="p-4 bg-m3-surface-container border border-m3-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-m3-on-surface-variant font-bold">
                <span className="flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-sky-500" /> RAM Usage</span>
                <span>{device.ram_usage}%</span>
              </div>
              <div className="text-2xl font-black text-m3-on-surface">{device.ram_usage}%</div>
              <div className="w-full bg-m3-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${device.ram_usage}%` }} />
              </div>
            </M3Card>

            <M3Card className="p-4 bg-m3-surface-container border border-m3-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-m3-on-surface-variant font-bold">
                <span className="flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-amber-500" /> Suhu Board</span>
                <span>{device.temperature}°C</span>
              </div>
              <div className="text-2xl font-black text-m3-on-surface">{device.temperature}°C</div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Termal Normal</p>
            </M3Card>

            <M3Card className="p-4 bg-m3-surface-container border border-m3-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-m3-on-surface-variant font-bold">
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-500" /> Latensi Ping</span>
                <span>{device.latency} ms</span>
              </div>
              <div className="text-2xl font-black text-m3-on-surface">{device.latency} ms</div>
              <p className="text-[10px] text-m3-on-surface-variant font-medium">Packet Loss: {device.packet_loss}%</p>
            </M3Card>
          </div>

          {/* 30-day Availability Timeline */}
          <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider">
                  Riwayat Ketersediaan 30 Hari (Uptime SLA)
                </h3>
                <p className="text-xs text-m3-on-surface-variant">
                  Tingkat ketersediaan operasional perangkat per hari
                </p>
              </div>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                99.92% Ketersediaan
              </span>
            </div>

            {/* 30 block bars */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 30 }).map((_, idx) => {
                const isDownDay = device.status === 'offline' && idx >= 28;
                const isWarningDay = device.status === 'warning' && (idx === 25 || idx === 29);
                return (
                  <div
                    key={idx}
                    title={`Hari ke-${idx + 1}: ${isDownDay ? 'Downtime 45m' : isWarningDay ? 'Latensi tinggi' : '100% Uptime'}`}
                    className={`flex-1 h-8 rounded-xs transition-all hover:scale-110 cursor-pointer ${
                      isDownDay ? 'bg-rose-500' : isWarningDay ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-m3-on-surface-variant font-mono">
              <span>30 hari lalu</span>
              <span>15 hari lalu</span>
              <span>Hari ini (Live)</span>
            </div>
          </M3Card>
        </div>
      )}

      {/* Tab 2: Interfaces */}
      {activeTab === 'interfaces' && (
        <div className="animate-in fade-in">
          <InterfaceTable
            deviceId={device.id}
            interfaces={deviceInterfaces}
            onScanSnmp={handleScanInterfaces}
            isScanning={isScanningInterfaces}
          />
        </div>
      )}

      {/* Tab 3: Queues */}
      {activeTab === 'queues' && (
        <M3Card className="p-4 sm:p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-5 animate-in fade-in">
          {/* Header & Main Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-m3-outline-variant/20">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-m3-on-surface flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-m3-primary" />
                  Daftar Bandwidth Simple Queue MikroTik
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-m3-surface-container-highest text-m3-primary border border-m3-outline-variant/30">
                  {deviceQueues.length} Total Antrean
                </span>
              </div>
              <p className="text-xs text-m3-on-surface-variant mt-1">
                Monitoring limit kuota, utilisasi beban, packet drop, dan grafik spektrum trafik live Rx/Tx
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <M3Button
                size="sm"
                variant="filled"
                loading={isSyncingQueues}
                onClick={async () => {
                  setIsSyncingQueues(true);
                  try {
                    await syncQueues(device.id, true);
                  } finally {
                    setIsSyncingQueues(false);
                  }
                }}
                icon={<Radio className="w-4 h-4" />}
              >
                {isSyncingQueues ? 'Menyinkronkan Queue...' : 'Segarkan Simple Queue (SNMP)'}
              </M3Button>
            </div>
          </div>

          {/* Controls: Unit Selector & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30">
            {/* Unit Selector */}
            <div className="flex items-center gap-1 p-1 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/20">
              <span className="text-[10px] font-bold text-m3-on-surface-variant px-1.5 flex items-center gap-1 font-mono">
                <Gauge className="w-3.5 h-3.5 text-m3-primary" />
                Format Satuan:
              </span>
              {(['auto', 'mbps', 'kbps', 'bps'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setQueueUnitMode(mode)}
                  className={`px-2.5 py-1 rounded-m3-md text-xs font-bold font-mono transition-all ${
                    queueUnitMode === mode
                      ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
                  }`}
                >
                  {mode === 'auto' ? 'Auto (Winbox)' : mode.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" />
              <input
                type="text"
                placeholder="Cari antrean atau subnet target..."
                value={queueSearchQuery}
                onChange={(e) => setQueueSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/30 text-xs text-m3-on-surface focus:outline-hidden focus:border-m3-primary font-mono placeholder:font-sans"
              />
            </div>
          </div>

          {/* Filtered Queues */}
          {(() => {
            const filtered = deviceQueues.filter((q) => {
              if (!queueSearchQuery.trim()) return true;
              const term = queueSearchQuery.toLowerCase();
              return (
                q.name.toLowerCase().includes(term) ||
                q.target.toLowerCase().includes(term) ||
                q.max_limit.toLowerCase().includes(term)
              );
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-10 text-xs text-m3-on-surface-variant">
                  Tidak ada Simple Queue yang cocok dengan kata kunci.
                </div>
              );
            }

            return (
              <>
                {/* Desktop Full Table (>= md) */}
                <div className="rounded-m3-2xl border border-m3-outline-variant/30 overflow-hidden bg-m3-surface-container-lowest hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[850px]">
                      <thead className="bg-m3-surface-container-high text-m3-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="py-3 px-3 w-12 text-center">#</th>
                          <th className="py-3 px-4">Nama Simple Queue</th>
                          <th className="py-3 px-3">Target Subnet / IP</th>
                          <th className="py-3 px-3">Limit Kuota (Max)</th>
                          <th className="py-3 px-4">Trafik Tx (Upload)</th>
                          <th className="py-3 px-4">Trafik Rx (Download)</th>
                          <th className="py-3 px-4 w-52">Grafik Trafik Realtime</th>
                          <th className="py-3 px-4">Utilisasi</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-m3-outline-variant/20">
                        {filtered.map((q, idx) => {
                          const maxNum = parseInt(q.max_limit.split('/')[1] || q.max_limit.replace(/[^0-9]/g, '') || '100', 10) || 100;
                          const currentDl = q.current_rate.download;
                          const currentUl = q.current_rate.upload;
                          const usagePercent = Math.min(100, Math.round((currentDl / maxNum) * 100));

                          let barColor = 'bg-emerald-500';
                          if (usagePercent > 80) barColor = 'bg-rose-500';
                          else if (usagePercent > 60) barColor = 'bg-amber-500';

                          return (
                            <tr key={q.id} className="hover:bg-m3-surface-container-high/40 transition-colors">
                              {/* Index */}
                              <td className="py-3 px-3 text-center font-mono font-bold text-m3-on-surface-variant">
                                <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500 font-mono text-[10px]">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                              </td>

                              {/* Name */}
                              <td className="py-3 px-4 font-bold font-mono text-m3-on-surface">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  <span>{q.name}</span>
                                </div>
                              </td>

                              {/* Target Subnet */}
                              <td className="py-3 px-3 font-mono text-[11px] text-m3-on-surface-variant">
                                <span className="bg-m3-surface-container-highest px-2 py-0.5 rounded-full border border-m3-outline-variant/30">
                                  {q.target}
                                </span>
                              </td>

                              {/* Limit */}
                              <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-300">
                                <span className="bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                  {q.max_limit}
                                </span>
                              </td>

                              {/* Tx */}
                              <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                                <div className="flex items-center gap-1">
                                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                  <span>{formatThroughput(currentUl, queueUnitMode)}</span>
                                </div>
                              </td>

                              {/* Rx */}
                              <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                <div className="flex items-center gap-1">
                                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>{formatThroughput(currentDl, queueUnitMode)}</span>
                                </div>
                              </td>

                              {/* Waveform Sparkline */}
                              <td className="py-3 px-4 w-52">
                                <div className="w-48">
                                  <QueueTrafficSparkline
                                    queueId={q.id}
                                    downloadRate={currentDl}
                                    uploadRate={currentUl}
                                    maxLimitStr={q.max_limit}
                                    height={32}
                                    unitMode={queueUnitMode}
                                    compact={true}
                                    showBadges={false}
                                  />
                                </div>
                              </td>

                              {/* Usage */}
                              <td className="py-3 px-4 min-w-[120px]">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                    <span className={usagePercent > 80 ? 'text-rose-500' : 'text-m3-on-surface'}>
                                      {usagePercent}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-m3-surface-container-highest overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                      style={{ width: `${usagePercent}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3 text-right">
                                {q.dropped > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3" />
                                    {q.dropped} drop
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Lancar
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards (< md) */}
                <div className="space-y-3 block md:hidden">
                  {filtered.map((q, idx) => {
                    const maxNum = parseInt(q.max_limit.split('/')[1] || q.max_limit.replace(/[^0-9]/g, '') || '100', 10) || 100;
                    const currentDl = q.current_rate.download;
                    const currentUl = q.current_rate.upload;
                    const usagePercent = Math.min(100, Math.round((currentDl / maxNum) * 100));

                    let barColor = 'bg-emerald-500';
                    let badgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
                    if (usagePercent > 80) {
                      barColor = 'bg-rose-500';
                      badgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20';
                    } else if (usagePercent > 60) {
                      barColor = 'bg-amber-500';
                      badgeColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20';
                    }

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="font-bold text-sm text-m3-on-surface flex items-center gap-2">
                            <span>{q.name}</span>
                            <span className="font-mono text-[10px] text-m3-on-surface-variant bg-m3-surface-container-highest px-2 py-0.5 rounded-full">
                              {q.target}
                            </span>
                          </div>

                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                            {usagePercent}% Utilisasi
                          </span>
                        </div>

                        {/* Sparkline */}
                        <div className="pt-0.5">
                          <QueueTrafficSparkline
                            queueId={q.id}
                            downloadRate={currentDl}
                            uploadRate={currentUl}
                            maxLimitStr={q.max_limit}
                            height={48}
                            unitMode={queueUnitMode}
                            showLegend={true}
                            showBadges={true}
                          />
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-m3-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-m3-on-surface-variant font-mono">
                          <span>Limit: {q.max_limit}</span>
                          {q.dropped > 0 ? (
                            <span className="text-rose-500 font-bold">{q.dropped} packet drops</span>
                          ) : (
                            <span className="text-emerald-500">Antrean Normal (0 drop)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </M3Card>
      )}

      {/* Tab 4: VPNs */}
      {activeTab === 'vpns' && (
        <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider">
                Daftar Tunnel & User Sesi VPN
              </h3>
              <p className="text-xs text-m3-on-surface-variant mt-0.5">
                Sesi koneksi remote user & tunnel site-to-site aktif di MikroTik
              </p>
            </div>
            <M3Button
              size="sm"
              variant="outlined"
              loading={isSyncingVpns}
              onClick={async () => {
                setIsSyncingVpns(true);
                try {
                  await syncVpnTunnels(device.id, true);
                } finally {
                  setIsSyncingVpns(false);
                }
              }}
              icon={<Radio className="w-3.5 h-3.5" />}
            >
              Segarkan Sesi VPN
            </M3Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deviceVpns.map((vpn) => (
              <div key={vpn.id} className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-m3-on-surface">{vpn.name}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${vpn.status === 'connected' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'}`}>
                    {vpn.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-m3-on-surface-variant font-mono">
                  User: {vpn.user} • Remote: {vpn.remote_ip} • Uptime: {vpn.uptime}
                </div>
              </div>
            ))}
          </div>
        </M3Card>
      )}

      {/* Tab 5: Repairs */}
      {activeTab === 'repairs' && (
        <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider">
              Log Riwayat Perbaikan Khusus Perangkat Ini
            </h3>
            <M3Button size="sm" variant="filled" onClick={() => setRepairModalOpen(true)}>
              Tambah Catatan
            </M3Button>
          </div>
          {deviceRepairs.length === 0 ? (
            <p className="text-xs text-m3-on-surface-variant italic py-6 text-center">
              Belum ada riwayat perbaikan yang tercatat untuk perangkat ini.
            </p>
          ) : (
            <div className="space-y-3">
              {deviceRepairs.map((rep) => (
                <div key={rep.id} className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-m3-primary font-mono">{rep.ticket_code}</span>
                    <span className="text-[10px] text-m3-on-surface-variant">{formatDate(rep.created_at)}</span>
                  </div>
                  <p className="text-m3-on-surface"><strong>Masalah:</strong> {rep.problem}</p>
                  <p className="text-m3-on-surface"><strong>Tindakan:</strong> {rep.action}</p>
                  <p className="text-m3-on-surface"><strong>Hasil:</strong> {rep.result} ({rep.user_name})</p>
                </div>
              ))}
            </div>
          )}
        </M3Card>
      )}

      {/* Modals */}
      <SnmpSyncModal
        isOpen={snmpModalOpen}
        onClose={() => setSnmpModalOpen(false)}
        device={device}
      />
      <PingTestModal
        isOpen={pingModalOpen}
        onClose={() => setPingModalOpen(false)}
        device={device}
      />
      <AddRepairModal
        isOpen={repairModalOpen}
        onClose={() => setRepairModalOpen(false)}
        initialDevice={device}
      />
      <AddEditDeviceModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        deviceToEdit={device}
      />
    </div>
  );
}
