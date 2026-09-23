'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNms } from '@/lib/store';
import { getStatusM3Badge } from '@/lib/m3-theme';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3Tabs } from '@/components/m3/M3Tabs';
import { M3Dialog } from '@/components/m3/M3Dialog';
import { M3TextField } from '@/components/m3/M3TextField';
import { PingTestModal } from '@/components/devices/PingTestModal';
import { AddRepairModal } from '@/components/repairs/AddRepairModal';
import { AddEditDeviceModal } from '@/components/devices/AddEditDeviceModal';
import { SnmpSyncModal } from '@/components/devices/SnmpSyncModal';
import { InterfaceTable } from '@/components/devices/InterfaceTable';
import { RawSnmpMetricsTab } from '@/components/devices/RawSnmpMetricsTab';
import { QueueTrafficSparkline } from '@/components/dashboard/QueueTrafficSparkline';
import { QueueTraffic } from '@/lib/types';
import {
  Server,
  ArrowLeft,
  Zap,
  Wrench,
  Edit2,
  Edit3,
  Trash2,
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
  FolderTree,
  Tag,
  CornerDownRight,
  Database,
} from 'lucide-react';
import { formatBytes, formatMbps, formatThroughput, formatDate, buildQueueHierarchy } from '@/lib/utils';

import {
  generateDefaultInterfaces,
  initialQueues,
  initialVpnTunnels,
} from '@/lib/mock-data';

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { devices, interfaces, queues, vpnTunnels, repairRecords, syncInterfaces, syncVpnTunnels, syncQueues, updateQueue, deleteQueue } = useNms();

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

  // Edit Queue State (Queue Tree)
  const [editingQueue, setEditingQueue] = useState<QueueTraffic | null>(null);
  const [editQueueName, setEditQueueName] = useState('');
  const [editQueueParent, setEditQueueParent] = useState('none');
  const [editQueuePacketMark, setEditQueuePacketMark] = useState('');
  const [editQueueMaxLimit, setEditQueueMaxLimit] = useState('');
  const [editQueueLimitAt, setEditQueueLimitAt] = useState('');
  const [editQueuePriority, setEditQueuePriority] = useState<number>(8);
  const [editQueueType, setEditQueueType] = useState('default');

  const limitPresets = ['100M', '50M', '40M', '30M', '20M', '10M', '5M'];

  const handleOpenEditQueue = (q: QueueTraffic) => {
    setEditingQueue(q);
    setEditQueueName(q.name);
    setEditQueueParent(q.parent || 'none');
    setEditQueuePacketMark(q.packet_mark || '');
    setEditQueueMaxLimit(q.max_limit || '40M');
    setEditQueueLimitAt(q.limit_at || '0');
    setEditQueuePriority(q.priority ?? 8);
    const isUpload = q.name.toLowerCase().includes('upload') || (q.parent && q.parent.toLowerCase().includes('upload'));
    setEditQueueType(q.queue_type || (isUpload ? 'pcq-upload-default' : 'pcq-download-default'));
  };

  const handleSaveEditQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQueue) return;
    updateQueue(editingQueue.id, {
      name: editQueueName.trim() || editingQueue.name,
      parent: editQueueParent.trim() || 'none',
      packet_mark: editQueuePacketMark.trim() || undefined,
      max_limit: editQueueMaxLimit.trim() || editingQueue.max_limit,
      limit_at: editQueueLimitAt.trim() || undefined,
      priority: Number(editQueuePriority) || 8,
      queue_type: editQueueType.trim() || undefined,
      target: editQueuePacketMark.trim() ? `mark:${editQueuePacketMark.trim()}` : editingQueue.target,
    });
    setEditingQueue(null);
  };

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
            { id: 'queues', label: `Bandwidth Queue Tree (${deviceQueues.length})`, icon: <SlidersHorizontal className="w-4 h-4" /> },
            { id: 'vpns', label: `VPN Tunnels (${deviceVpns.length})`, icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'raw_metrics', label: 'Raw SNMP (v6.48.4)', icon: <Database className="w-4 h-4" /> },
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
                  Daftar Bandwidth Queue Tree MikroTik
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-m3-surface-container-highest text-m3-primary border border-m3-outline-variant/30">
                  {deviceQueues.length} Total Antrean Tree
                </span>
              </div>
              <p className="text-xs text-m3-on-surface-variant mt-1">
                Hierarki antrean parent-child, packet mark mangle, alokasi CIR (limit-at), MIR (max-limit), dan grafik live
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
                {isSyncingQueues ? 'Menyinkronkan Queue Tree...' : 'Segarkan Queue Tree (SNMP)'}
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
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" />
              <input
                type="text"
                placeholder="Cari antrean, parent, packet mark..."
                value={queueSearchQuery}
                onChange={(e) => setQueueSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/30 text-xs text-m3-on-surface focus:outline-hidden focus:border-m3-primary font-mono placeholder:font-sans"
              />
            </div>
          </div>

          {/* Filtered Queues */}
          {(() => {
            const hierarchical = buildQueueHierarchy(deviceQueues);
            const filtered = hierarchical.filter((q) => {
              if (!queueSearchQuery.trim()) return true;
              const term = queueSearchQuery.toLowerCase();
              return (
                q.name.toLowerCase().includes(term) ||
                (q.parent && q.parent.toLowerCase().includes(term)) ||
                (q.packet_mark && q.packet_mark.toLowerCase().includes(term)) ||
                q.max_limit.toLowerCase().includes(term) ||
                q.target.toLowerCase().includes(term)
              );
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-10 text-xs text-m3-on-surface-variant">
                  Tidak ada antrean Queue Tree yang cocok dengan kata kunci pencarian.
                </div>
              );
            }

            return (
              <>
                {/* Desktop Full Table (>= md) */}
                <div className="rounded-m3-2xl border border-m3-outline-variant/30 overflow-hidden bg-m3-surface-container-lowest hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[900px]">
                      <thead className="bg-m3-surface-container-high text-m3-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="py-3 px-3 w-10 text-center">#</th>
                          <th className="py-3 px-4">Nama Antrean (Queue Tree)</th>
                          <th className="py-3 px-3">Induk (Parent)</th>
                          <th className="py-3 px-3">Packet Mark (Mangle)</th>
                          <th className="py-3 px-3">Limit (Max / CIR)</th>
                          <th className="py-3 px-4">Trafik Tx / Rx</th>
                          <th className="py-3 px-4 w-48">Grafik Realtime</th>
                          <th className="py-3 px-4">Utilisasi</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-m3-outline-variant/20">
                        {filtered.map((q, idx) => {
                          const maxNum = parseInt(String(q.max_limit).replace(/[^0-9]/g, ''), 10) || 40;
                          const currentDl = q.current_rate.download;
                          const currentUl = q.current_rate.upload;
                          const activeRate = currentDl > 0 ? currentDl : currentUl;
                          const usagePercent = Math.min(100, Math.round((activeRate / maxNum) * 100));
                          const isChild = q.depth > 0 || (q.parent && q.parent !== 'global' && q.parent !== 'none');

                          let barColor = 'bg-emerald-500';
                          if (usagePercent > 80) barColor = 'bg-rose-500';
                          else if (usagePercent > 60) barColor = 'bg-amber-500';

                          return (
                            <tr
                              key={q.id}
                              className={`hover:bg-m3-surface-container-high/40 transition-colors ${
                                q.depth === 0 ? 'bg-m3-surface-container-high/30 font-semibold' : ''
                              }`}
                            >
                              {/* Index */}
                              <td className="py-3 px-3 text-center font-mono font-bold text-m3-on-surface-variant">
                                <span
                                  className={`px-1.5 py-0.5 rounded-sm font-mono text-[10px] ${
                                    q.depth === 0
                                      ? 'bg-m3-primary/15 text-m3-primary font-bold'
                                      : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                                  }`}
                                >
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                              </td>

                              {/* Name with Tree branch indent */}
                              <td className="py-3 px-4 font-bold font-mono text-m3-on-surface">
                                <div className="flex items-center gap-1.5" style={{ paddingLeft: `${q.depth * 16}px` }}>
                                  {q.depth === 0 ? (
                                    <Layers className="w-4 h-4 text-m3-primary shrink-0" />
                                  ) : q.depth === 1 ? (
                                    <CornerDownRight className="w-3.5 h-3.5 text-m3-primary/70 shrink-0" />
                                  ) : (
                                    <CornerDownRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                  )}
                                  <span className="truncate max-w-[190px]">{q.name}</span>
                                  {q.priority && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-m3-surface-container-highest text-m3-on-surface-variant border border-m3-outline-variant/30 font-mono">
                                      P:{q.priority}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Parent */}
                              <td className="py-3 px-3 font-mono text-[11px]">
                                <span
                                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                    q.parent === 'global' || q.parent === 'none' || !q.parent
                                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20'
                                      : 'bg-m3-surface-container-highest text-m3-on-surface-variant border-m3-outline-variant/30'
                                  }`}
                                >
                                  {q.parent || 'global'}
                                </span>
                              </td>

                              {/* Packet Mark */}
                              <td className="py-3 px-3 font-mono text-[11px]">
                                {q.packet_mark && q.packet_mark !== 'no-mark' ? (
                                  <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/20 text-[10px] font-bold">
                                    <Tag className="w-2.5 h-2.5" />
                                    {q.packet_mark}
                                  </span>
                                ) : (
                                  <span className="text-m3-on-surface-variant/50 text-[10px] italic">no-mark</span>
                                )}
                              </td>

                              {/* Limit Max / CIR */}
                              <td className="py-3 px-3 font-mono text-[11px]">
                                <div className="flex flex-col">
                                  <span className="font-bold text-amber-600 dark:text-amber-300">
                                    Max: {q.max_limit}
                                  </span>
                                  {q.limit_at && (
                                    <span className="text-[9px] text-m3-on-surface-variant">
                                      CIR: {q.limit_at}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Tx / Rx */}
                              <td className="py-3 px-4 font-mono font-bold">
                                <div className="space-y-0.5 text-xs">
                                  {currentUl > 0 && (
                                    <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                                      <ArrowUpRight className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                      <span>{formatThroughput(currentUl, queueUnitMode)}</span>
                                    </div>
                                  )}
                                  {currentDl > 0 && (
                                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>{formatThroughput(currentDl, queueUnitMode)}</span>
                                    </div>
                                  )}
                                  {currentDl === 0 && currentUl === 0 && (
                                    <span className="text-m3-on-surface-variant/60 text-xs">0 bps</span>
                                  )}
                                </div>
                              </td>

                              {/* Waveform Sparkline */}
                              <td className="py-3 px-4 w-48">
                                <div className="w-44">
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
                              <td className="py-3 px-4 min-w-[110px]">
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
                              <td className="py-3 px-3 text-center">
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

                              {/* Actions */}
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditQueue(q)}
                                  className="p-1.5 rounded-lg text-m3-on-surface-variant hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                  title="Edit Queue Tree"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
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
                  {filtered.map((q) => {
                    const maxNum = parseInt(String(q.max_limit).replace(/[^0-9]/g, ''), 10) || 40;
                    const currentDl = q.current_rate.download;
                    const currentUl = q.current_rate.upload;
                    const activeRate = currentDl > 0 ? currentDl : currentUl;
                    const usagePercent = Math.min(100, Math.round((activeRate / maxNum) * 100));

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
                          <div className="font-bold text-sm text-m3-on-surface flex items-center gap-1.5">
                            {q.parent && q.parent !== 'global' ? (
                              <CornerDownRight className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                            ) : null}
                            <span>{q.name}</span>
                            {q.packet_mark && (
                              <span className="font-mono text-[10px] text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                                {q.packet_mark}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                              {usagePercent}%
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditQueue(q)}
                              className="p-1 rounded-md text-m3-on-surface-variant hover:text-amber-500 hover:bg-m3-surface-container-highest transition-colors"
                              title="Edit Queue Tree"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

                        <div className="flex flex-wrap items-center justify-between text-xs text-m3-on-surface-variant font-mono gap-1">
                          <span>Parent: {q.parent || 'global'} | Max: {q.max_limit}</span>
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

          {/* Edit Queue Dialog Modal (Queue Tree) */}
          {editingQueue && (
            <M3Dialog
              isOpen={!!editingQueue}
              onClose={() => setEditingQueue(null)}
              title={`Edit Queue Tree: ${editingQueue.name}`}
            >
              <form onSubmit={handleSaveEditQueue} className="space-y-4 pt-2">
                <M3TextField
                  label="Nama Antrean (Queue Tree)"
                  value={editQueueName}
                  onChange={(e) => setEditQueueName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-m3-on-surface-variant mb-1 font-mono">
                      Induk (Parent Queue)
                    </label>
                    <input
                      type="text"
                      value={editQueueParent}
                      onChange={(e) => setEditQueueParent(e.target.value)}
                      placeholder="e.g. Total-Download, global"
                      className="w-full px-3 py-2 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['global', 'Total-Download', 'Total-Upload'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditQueueParent(p)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border ${
                            editQueueParent === p
                              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/40 font-bold'
                              : 'bg-m3-surface-container text-m3-on-surface-variant border-m3-outline-variant/30'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-m3-on-surface-variant mb-1 font-mono">
                      Packet Mark (Mangle)
                    </label>
                    <input
                      type="text"
                      value={editQueuePacketMark}
                      onChange={(e) => setEditQueuePacketMark(e.target.value)}
                      placeholder="e.g. dev-in_pkt, kantor-in_pkt"
                      className="w-full px-3 py-2 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
                    />
                  </div>
                </div>

                {/* Max Limit (MIR) */}
                <div className="space-y-1.5">
                  <M3TextField
                    label="Max Limit / MIR (Maksimal Bandwidth)"
                    value={editQueueMaxLimit}
                    onChange={(e) => setEditQueueMaxLimit(e.target.value)}
                    required
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-m3-on-surface-variant font-mono mr-1">Preset Max:</span>
                    {limitPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditQueueMaxLimit(preset)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors ${
                          editQueueMaxLimit === preset
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Limit-At (CIR) */}
                <div className="space-y-1.5">
                  <M3TextField
                    label="Limit At / CIR (Garansi Bandwidth Minimum)"
                    value={editQueueLimitAt}
                    onChange={(e) => setEditQueueLimitAt(e.target.value)}
                    placeholder="e.g. 10M, 5M, 0"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-m3-on-surface-variant font-mono mr-1">Preset CIR:</span>
                    {['30M', '20M', '10M', '5M', '2M', '0'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditQueueLimitAt(preset)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors ${
                          editQueueLimitAt === preset
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority & Queue Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-m3-on-surface-variant mb-1 font-mono">
                      Prioritas (1 = Tertinggi, 8 = Normal)
                    </label>
                    <select
                      value={editQueuePriority}
                      onChange={(e) => setEditQueuePriority(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                        <option key={p} value={p}>
                          Prioritas {p} {p === 1 ? '(Tertinggi / VIP)' : p === 8 ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-m3-on-surface-variant mb-1 font-mono">
                      Queue Type
                    </label>
                    <select
                      value={editQueueType}
                      onChange={(e) => setEditQueueType(e.target.value)}
                      className="w-full px-3 py-2 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
                    >
                      <option value="pcq-download-default">pcq-download-default</option>
                      <option value="pcq-upload-default">pcq-upload-default</option>
                      <option value="default">default</option>
                      <option value="default-small">default-small</option>
                      <option value="fq_codel">fq_codel</option>
                      <option value="ethernet-default">ethernet-default</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-m3-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus antrean Queue Tree ${editingQueue.name}?`)) {
                        deleteQueue(editingQueue.id);
                        setEditingQueue(null);
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 rounded-md hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <M3Button
                      type="button"
                      variant="outlined"
                      onClick={() => setEditingQueue(null)}
                    >
                      Batal
                    </M3Button>
                    <M3Button
                      type="submit"
                      variant="filled"
                    >
                      Simpan Perubahan
                    </M3Button>
                  </div>
                </div>
              </form>
            </M3Dialog>
          )}
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

      {/* Tab: Raw SNMP Metrics (RouterOS v6.48.4) */}
      {activeTab === 'raw_metrics' && (
        <RawSnmpMetricsTab deviceId={device.id} deviceName={device.name} />
      )}

      {/* Tab: Repairs */}
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
