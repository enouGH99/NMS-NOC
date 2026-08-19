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
} from 'lucide-react';
import { formatBytes, formatMbps, formatDate } from '@/lib/utils';

import {
  generateDefaultInterfaces,
  initialQueues,
  initialVpnTunnels,
} from '@/lib/mock-data';

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { devices, interfaces, queues, vpnTunnels, repairRecords, syncInterfaces } = useNms();

  const deviceId = params.id as string;
  const device = devices.find((d) => d.id === deviceId);

  const [activeTab, setActiveTab] = useState('overview');
  const [pingModalOpen, setPingModalOpen] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [snmpModalOpen, setSnmpModalOpen] = useState(false);
  const [isScanningInterfaces, setIsScanningInterfaces] = useState(false);

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
        <M3Card className="p-4 sm:p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-m3-outline-variant/20">
            <div>
              <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider">
                Daftar Port Ethernet & SFP Interface
              </h3>
              <p className="text-xs text-m3-on-surface-variant mt-0.5">
                Monitoring live status link, bandwidth throughput (RX/TX), dan error rate per port
              </p>
            </div>
            <M3Button
              size="sm"
              variant="outlined"
              loading={isScanningInterfaces}
              onClick={handleScanInterfaces}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              {isScanningInterfaces ? 'Memindai SNMP...' : 'Pindai Port Interface (SNMP)'}
            </M3Button>
          </div>

          {/* Mobile Cards for Interfaces */}
          <div className="space-y-3 block md:hidden">
            {deviceInterfaces.map((iface) => (
              <div
                key={iface.id}
                className="p-3.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-m3-on-surface">{iface.name}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      iface.status === 'up'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {iface.status.toUpperCase()} ({iface.speed})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-m3-outline-variant/20 font-mono">
                  <div className="p-2 rounded-m3-md bg-m3-surface-container-lowest">
                    <span className="text-[10px] text-m3-on-surface-variant font-sans block">Download (RX)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMbps(iface.rx_rate)}
                    </span>
                  </div>
                  <div className="p-2 rounded-m3-md bg-m3-surface-container-lowest">
                    <span className="text-[10px] text-m3-on-surface-variant font-sans block">Upload (TX)</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {formatMbps(iface.tx_rate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-m3-on-surface-variant font-mono pt-1">
                  <span>Total: ↓ {formatBytes(iface.rx_bytes)} / ↑ {formatBytes(iface.tx_bytes)}</span>
                  <span>Error: {iface.error_rate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table for Interfaces */}
          <div className="rounded-m3-2xl border border-m3-outline-variant/30 overflow-hidden bg-m3-surface-container-lowest hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-m3-surface-container-high text-m3-on-surface-variant uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Nama Interface</th>
                    <th className="py-3 px-4">Status & Kecepatan</th>
                    <th className="py-3 px-4">Trafik Download (RX)</th>
                    <th className="py-3 px-4">Trafik Upload (TX)</th>
                    <th className="py-3 px-4">Total Data Masuk / Keluar</th>
                    <th className="py-3 px-4 text-right">Error Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-m3-outline-variant/20">
                  {deviceInterfaces.map((iface) => (
                    <tr key={iface.id} className="hover:bg-m3-surface-container-high/40">
                      <td className="py-3 px-4 font-bold font-mono text-m3-on-surface">
                        {iface.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            iface.status === 'up'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {iface.status.toUpperCase()} ({iface.speed})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMbps(iface.rx_rate)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {formatMbps(iface.tx_rate)}
                      </td>
                      <td className="py-3 px-4 font-mono text-m3-on-surface-variant text-[11px]">
                        ↓ {formatBytes(iface.rx_bytes)} / ↑ {formatBytes(iface.tx_bytes)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {iface.error_rate > 0 ? (
                          <span className="text-rose-500 font-bold">{iface.error_rate} pkts/s</span>
                        ) : (
                          <span className="text-emerald-500">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </M3Card>
      )}

      {/* Tab 3: Queues */}
      {activeTab === 'queues' && (
        <M3Card className="p-4 sm:p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider">
            Pengaturan & Utilisasi Simple Queue MikroTik
          </h3>
          <div className="space-y-3">
            {deviceQueues.map((q) => {
              const maxNum = parseInt(q.max_limit.split('/')[1] || '100', 10);
              const currentDl = q.current_rate.download;
              const usagePercent = Math.min(100, Math.round((currentDl / maxNum) * 100));

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="font-bold text-sm text-m3-on-surface flex items-center gap-2">
                      <span>{q.name}</span>
                      <span className="font-mono text-[10px] text-m3-on-surface-variant bg-m3-surface-container-highest px-2 py-0.5 rounded-full">
                        {q.target}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        usagePercent > 80
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                          : usagePercent > 60
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {usagePercent}% Utilisasi
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ↓ {formatMbps(currentDl)} <span className="text-m3-on-surface-variant font-normal">/ maks {q.max_limit}</span>
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">
                      ↑ {formatMbps(q.current_rate.upload)}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-m3-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usagePercent > 80 ? 'bg-rose-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </M3Card>
      )}

      {/* Tab 4: VPNs */}
      {activeTab === 'vpns' && (
        <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider">
            Daftar Tunnel & User Sesi VPN
          </h3>
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
