'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import { M3TextField } from '../m3/M3TextField';
import { M3Chip } from '../m3/M3Chip';
import {
  Radio,
  Plus,
  Check,
  ShieldCheck,
  Search,
  Network,
  Server,
  Wifi,
  Video,
  Cpu,
  Layers,
  Download,
  Filter,
  RefreshCw,
  Copy,
  ExternalLink,
  SlidersHorizontal,
  CheckSquare,
  Square,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface SubnetPreset {
  id: string;
  label: string;
  subnet: string;
  description: string;
  icon: React.ReactNode;
}

const SUBNET_PRESETS: SubnetPreset[] = [
  {
    id: 'server_farm',
    label: 'Server Farm & Proxmox',
    subnet: '192.168.100.0/24',
    description: 'Server Proxmox VE, DNS Zeus, Loki, Prometheus, Grafana',
    icon: <Server className="w-3.5 h-3.5 text-purple-500" />,
  },
  {
    id: 'office_rd',
    label: 'R&D & Office LAN',
    subnet: '192.168.3.0/24',
    description: 'MikroTik Gateway, Ruijie Switch, Reyee AP, Workstation PC',
    icon: <Network className="w-3.5 h-3.5 text-blue-500" />,
  },
  {
    id: 'produksi',
    label: 'Produksi & Factory',
    subnet: '192.168.2.0/24',
    description: 'Mesin Produksi, IoT Controller, Terminal Pabrik',
    icon: <Cpu className="w-3.5 h-3.5 text-amber-500" />,
  },
  {
    id: 'cctv',
    label: 'CCTV Security VLAN',
    subnet: '172.31.1.0/24',
    description: 'Kamera IP CCTV Hikvision/Dahua & NVR Surveillance',
    icon: <Video className="w-3.5 h-3.5 text-rose-500" />,
  },
  {
    id: 'all',
    label: 'Semua Subnet (Multi-Subnet)',
    subnet: 'all',
    description: 'Pindai seluruh tabel ARP & DHCP RouterOS MikroTik',
    icon: <Layers className="w-3.5 h-3.5 text-emerald-500" />,
  },
];

export const AutoDiscoveryScanner: React.FC = () => {
  const {
    discoveredDevices,
    isScanning,
    scanProgress,
    startAutoDiscovery,
    approveDiscoveredDevice,
    ignoreDiscoveredDevice,
    batchApproveDiscoveredDevices,
    batchIgnoreDiscoveredDevices,
  } = useNms();

  const [selectedPreset, setSelectedPreset] = useState<string>('all');
  const [customSubnet, setCustomSubnet] = useState<string>('192.168.3.0/24');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'approved' | 'ignored' | 'snmp'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedMac, setCopiedMac] = useState<string | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState<boolean>(false);

  // Active target subnet string
  const activeSubnet = isCustomMode
    ? customSubnet
    : SUBNET_PRESETS.find((p) => p.id === selectedPreset)?.subnet || 'all';

  const handleStartScan = (target: string = activeSubnet) => {
    setSelectedIds([]);
    startAutoDiscovery(target);
  };

  const handleCopyMac = (mac: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(mac);
      setCopiedMac(mac);
      setTimeout(() => setCopiedMac(null), 2000);
    }
  };

  // Filtered devices based on search query, status filter, and type filter
  const filteredDevices = useMemo(() => {
    return discoveredDevices.filter((item) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchIp = item.ip.toLowerCase().includes(q);
        const matchMac = item.mac.toLowerCase().includes(q);
        const matchName = (item.suggested_name || '').toLowerCase().includes(q);
        const matchVendor = (item.vendor || '').toLowerCase().includes(q);
        if (!matchIp && !matchMac && !matchName && !matchVendor) return false;
      }

      // 2. Status filter
      if (statusFilter === 'new' && item.status !== 'new') return false;
      if (statusFilter === 'approved' && item.status !== 'approved') return false;
      if (statusFilter === 'ignored' && item.status !== 'ignored') return false;
      if (statusFilter === 'snmp' && !item.snmp_detected) return false;

      // 3. Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      return true;
    });
  }, [discoveredDevices, searchQuery, statusFilter, typeFilter]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = discoveredDevices.length;
    const snmpReady = discoveredDevices.filter((d) => d.snmp_detected).length;
    const approved = discoveredDevices.filter((d) => d.status === 'approved').length;
    const newItems = discoveredDevices.filter((d) => d.status === 'new').length;
    return { total, snmpReady, approved, newItems };
  }, [discoveredDevices]);

  // Selection toggle handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredDevices.length && filteredDevices.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDevices.map((d) => d.id));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchLoading(true);
    await batchApproveDiscoveredDevices(selectedIds);
    setSelectedIds([]);
    setIsBatchLoading(false);
  };

  const handleBatchIgnore = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchLoading(true);
    await batchIgnoreDiscoveredDevices(selectedIds);
    setSelectedIds([]);
    setIsBatchLoading(false);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (discoveredDevices.length === 0) return;
    const headers = ['IP Address', 'MAC Address', 'Suggested Name', 'Type', 'Vendor', 'SNMP Ready', 'Latency (ms)', 'Status', 'Discovered At'];
    const rows = discoveredDevices.map((d) => [
      d.ip,
      d.mac,
      `"${(d.suggested_name || '').replace(/"/g, '""')}"`,
      d.type,
      `"${(d.vendor || '').replace(/"/g, '""')}"`,
      d.snmp_detected ? 'TRUE' : 'FALSE',
      d.response_time,
      d.status,
      d.discovered_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nms_auto_discovery_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Device Type Badge
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'router':
        return <Network className="w-3.5 h-3.5 text-blue-500" />;
      case 'switch':
        return <Layers className="w-3.5 h-3.5 text-amber-500" />;
      case 'access_point':
        return <Wifi className="w-3.5 h-3.5 text-sky-500" />;
      case 'server':
      default:
        return <Server className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  return (
    <M3Card className="p-5 md:p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-6">
      {/* Header & Subnet Selector */}
      <div className="space-y-4 pb-5 border-b border-m3-outline-variant/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base md:text-lg font-bold text-m3-on-surface flex items-center gap-2">
              <Radio className="w-5 h-5 text-m3-primary animate-pulse" />
              Subnet Auto-Discovery & Vendor Fingerprinting Engine
            </h3>
            <p className="text-xs text-m3-on-surface-variant mt-0.5">
              Pindai subnet jaringan kantor & server farm secara otomatis via live MikroTik SNMP ARP & DHCP Leases
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <M3Button
              variant="outlined"
              size="sm"
              onClick={handleExportCsv}
              disabled={discoveredDevices.length === 0}
              icon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </M3Button>

            <M3Button
              variant="filled"
              loading={isScanning}
              onClick={() => handleStartScan()}
              icon={<Search className="w-4 h-4" />}
            >
              {isScanning ? 'Memindai Jaringan...' : 'Pindai Subnet'}
            </M3Button>
          </div>
        </div>

        {/* Subnet Preset Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-m3-on-surface-variant">
            <span>PILIH TARGET SUBNET JARINGAN SUNDAYA:</span>
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-xs text-m3-primary hover:underline flex items-center gap-1 font-medium"
            >
              <SlidersHorizontal className="w-3 h-3" />
              {isCustomMode ? 'Gunakan Preset Subnet' : 'Custom Subnet CIDR'}
            </button>
          </div>

          {!isCustomMode ? (
            <div className="flex flex-wrap gap-2">
              {SUBNET_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(preset.id);
                      handleStartScan(preset.subnet);
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-m3-lg text-xs font-medium border transition-all duration-200 text-left ${
                      isSelected
                        ? 'bg-m3-primary text-m3-on-primary border-m3-primary shadow-sm'
                        : 'bg-m3-surface-container-high text-m3-on-surface border-m3-outline-variant/40 hover:border-m3-primary/50'
                    }`}
                  >
                    <span className="shrink-0">{preset.icon}</span>
                    <div>
                      <div className="font-bold leading-tight">{preset.label}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-m3-on-primary/80' : 'text-m3-on-surface-variant'}`}>
                        {preset.subnet === 'all' ? 'Semua Range Subnet' : preset.subnet}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 max-w-md pt-1">
              <M3TextField
                placeholder="Contoh: 192.168.100.0/24 atau 10.0.0.0/24"
                value={customSubnet}
                onChange={(e) => setCustomSubnet(e.target.value)}
              />
              <M3Button
                variant="filled-tonal"
                size="sm"
                onClick={() => handleStartScan(customSubnet)}
                icon={<Search className="w-3.5 h-3.5" />}
              >
                Scan
              </M3Button>
            </div>
          )}
        </div>
      </div>

      {/* Scanning Progress Banner */}
      {isScanning && (
        <div className="p-4 rounded-m3-xl bg-m3-primary-container/30 border border-m3-primary/30 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-m3-on-surface">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-m3-primary animate-spin" />
              Memindai Live ARP Table & Hostname pada {activeSubnet === 'all' ? 'Seluruh Jaringan' : activeSubnet}...
            </span>
            <span className="font-mono text-m3-primary">{scanProgress}%</span>
          </div>
          <div className="h-2 w-full bg-m3-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-m3-primary rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-m3-on-surface-variant flex items-center justify-between">
            <span>Mengidentifikasi MAC OUI Vendor & Profil SNMP...</span>
            <span className="font-mono">SNMP Port 161 (v2c)</span>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-m3-xl bg-m3-surface-container-high/60 border border-m3-outline-variant/20">
          <div className="text-[11px] font-medium text-m3-on-surface-variant">Total Terdeteksi</div>
          <div className="text-xl font-bold text-m3-on-surface mt-0.5">{stats.total} Host</div>
        </div>

        <div className="p-3.5 rounded-m3-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">SNMP Ready</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.snmpReady} Device
          </div>
        </div>

        <div className="p-3.5 rounded-m3-xl bg-blue-500/10 border border-blue-500/20">
          <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300">Telah Disetujui</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {stats.approved} Node
          </div>
        </div>

        <div className="p-3.5 rounded-m3-xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Belum Ditinjau (Baru)</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {stats.newItems} Host
          </div>
        </div>
      </div>

      {/* Search Bar & Filter Chips */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-m3-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari IP, MAC, Nama, atau Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-m3-surface-container-high border border-m3-outline-variant/40 rounded-m3-md text-xs text-m3-on-surface placeholder:text-m3-on-surface-variant/60 focus:outline-none focus:border-m3-primary focus:ring-1 focus:ring-m3-primary transition-all"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <M3Chip
              selected={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              variant="filter"
            >
              Semua ({discoveredDevices.length})
            </M3Chip>
            <M3Chip
              selected={statusFilter === 'new'}
              onClick={() => setStatusFilter('new')}
              variant="filter"
            >
              Baru ({stats.newItems})
            </M3Chip>
            <M3Chip
              selected={statusFilter === 'approved'}
              onClick={() => setStatusFilter('approved')}
              variant="filter"
            >
              Disetujui ({stats.approved})
            </M3Chip>
            <M3Chip
              selected={statusFilter === 'snmp'}
              onClick={() => setStatusFilter('snmp')}
              variant="filter"
            >
              SNMP Ready ({stats.snmpReady})
            </M3Chip>
            <M3Chip
              selected={statusFilter === 'ignored'}
              onClick={() => setStatusFilter('ignored')}
              variant="filter"
            >
              Diabaikan
            </M3Chip>
          </div>
        </div>

        {/* Batch Action Floating Header */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-m3-xl bg-m3-primary-container text-m3-on-primary-container flex flex-wrap items-center justify-between gap-3 animate-in fade-in shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckSquare className="w-4 h-4 text-m3-primary" />
              <span>{selectedIds.length} perangkat dipilih</span>
            </div>

            <div className="flex items-center gap-2">
              <M3Button
                size="sm"
                variant="filled"
                loading={isBatchLoading}
                onClick={handleBatchApprove}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Setujui & Tambahkan ke Topologi ({selectedIds.length})
              </M3Button>

              <M3Button
                size="sm"
                variant="outlined"
                loading={isBatchLoading}
                onClick={handleBatchIgnore}
              >
                Abaikan ({selectedIds.length})
              </M3Button>

              <M3Button
                size="sm"
                variant="text"
                onClick={() => setSelectedIds([])}
              >
                Batal
              </M3Button>
            </div>
          </div>
        )}

        {/* Table View (Desktop) */}
        <div className="rounded-m3-2xl border border-m3-outline-variant/30 overflow-hidden bg-m3-surface-container-lowest hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-m3-surface-container-high text-m3-on-surface-variant font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-m3-on-surface-variant hover:text-m3-primary transition-colors"
                      title="Pilih Semua"
                    >
                      {selectedIds.length > 0 && selectedIds.length === filteredDevices.length ? (
                        <CheckSquare className="w-4 h-4 text-m3-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Alamat IP & MAC</th>
                  <th className="py-3 px-4">Identitas & Vendor</th>
                  <th className="py-3 px-4">Tipe Perangkat</th>
                  <th className="py-3 px-4">SNMP Engine</th>
                  <th className="py-3 px-4">Respon</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/20">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-m3-on-surface-variant text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Network className="w-8 h-8 text-m3-on-surface-variant/40" />
                        <span className="font-semibold">Tidak ada perangkat yang sesuai filter</span>
                        <span className="text-[11px] text-m3-on-surface-variant/70">
                          Ganti subnet di atas atau tekan <strong>Pindai Subnet</strong> untuk memindai ulang.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isApproved = item.status === 'approved';
                    const isIgnored = item.status === 'ignored';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-m3-surface-container-high/40 transition-colors ${
                          isSelected ? 'bg-m3-primary-container/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(item.id)}
                            className="text-m3-on-surface-variant hover:text-m3-primary transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-m3-primary" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* IP & MAC */}
                        <td className="py-3 px-4 font-mono font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-m3-on-surface">{item.ip}</span>
                            {item.ip.startsWith('192.168.100.') && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300">
                                Server
                              </span>
                            )}
                            {item.ip.startsWith('192.168.3.') && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-300">
                                Office
                              </span>
                            )}
                            {item.ip.startsWith('172.31.1.') && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300">
                                CCTV
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-m3-on-surface-variant font-normal flex items-center gap-1 mt-0.5">
                            <span>{item.mac}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyMac(item.mac)}
                              className="text-m3-on-surface-variant hover:text-m3-primary"
                              title="Salin MAC Address"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {copiedMac === item.mac && (
                              <span className="text-[9px] text-emerald-500 font-sans">Tersalin</span>
                            )}
                          </div>
                        </td>

                        {/* Identity & Vendor */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-m3-on-surface">{item.suggested_name}</div>
                          <div className="text-[11px] text-m3-on-surface-variant mt-0.5 flex items-center gap-1.5">
                            <span className="font-medium text-m3-primary">{item.vendor}</span>
                          </div>
                        </td>

                        {/* Device Type */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-m3-surface-container-high border border-m3-outline-variant/30 text-[11px] font-semibold text-m3-on-surface">
                            {renderTypeIcon(item.type)}
                            <span className="capitalize">{item.type.replace('_', ' ')}</span>
                          </span>
                        </td>

                        {/* SNMP */}
                        <td className="py-3 px-4">
                          {item.snmp_detected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" /> SNMP Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-m3-surface-container-highest text-m3-on-surface-variant text-[11px] font-medium">
                              ICMP Only
                            </span>
                          )}
                        </td>

                        {/* Latency */}
                        <td className="py-3 px-4 font-mono text-xs">
                          <span
                            className={`font-bold ${
                              item.response_time <= 4
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : item.response_time <= 15
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {item.response_time} ms
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          {isApproved ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                                <Check className="w-3.5 h-3.5" /> Ditambahkan
                              </span>
                              <Link
                                href="/map"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-m3-md bg-m3-surface-container-high hover:bg-m3-primary/10 text-m3-primary text-xs font-semibold border border-m3-outline-variant/30 transition-colors"
                              >
                                <span>Peta</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          ) : isIgnored ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-m3-on-surface-variant italic">Diabaikan</span>
                              <M3Button
                                size="sm"
                                variant="text"
                                onClick={() => approveDiscoveredDevice(item.id)}
                              >
                                Pulihkan
                              </M3Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <M3Button
                                size="sm"
                                variant="filled-tonal"
                                onClick={() => approveDiscoveredDevice(item.id)}
                                icon={<Plus className="w-3.5 h-3.5" />}
                              >
                                Setujui & Pantau
                              </M3Button>
                              <M3Button
                                size="sm"
                                variant="text"
                                onClick={() => ignoreDiscoveredDevice(item.id)}
                              >
                                Abaikan
                              </M3Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="space-y-3 block md:hidden">
          {filteredDevices.length === 0 ? (
            <div className="p-6 rounded-m3-2xl bg-m3-surface-container-high/40 border border-m3-outline-variant/20 text-center text-xs text-m3-on-surface-variant space-y-1">
              <Network className="w-6 h-6 mx-auto text-m3-on-surface-variant/40" />
              <div className="font-semibold">Belum ada perangkat yang terdeteksi</div>
              <div className="text-[11px]">Tekan tombol Pindai Subnet untuk memindai jaringan.</div>
            </div>
          ) : (
            filteredDevices.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isApproved = item.status === 'approved';
              const isIgnored = item.status === 'ignored';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-3 text-xs transition-all ${
                    isSelected ? 'ring-2 ring-m3-primary bg-m3-primary-container/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.id)}
                        className="mt-0.5 text-m3-on-surface-variant"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-m3-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <h5 className="font-bold text-sm text-m3-on-surface">{item.suggested_name}</h5>
                        <div className="text-[11px] text-m3-on-surface-variant font-mono mt-0.5">
                          {item.ip} • {item.mac}
                        </div>
                      </div>
                    </div>

                    {item.snmp_detected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                        <ShieldCheck className="w-3 h-3" /> SNMP
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-surface-container-highest text-m3-on-surface-variant shrink-0">
                        ICMP Only
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-m3-on-surface-variant pt-2 border-t border-m3-outline-variant/20">
                    <span>Vendor: <strong className="text-m3-on-surface">{item.vendor}</strong></span>
                    <span className="font-mono">Respon: <strong>{item.response_time} ms</strong></span>
                  </div>

                  <div className="pt-2 border-t border-m3-outline-variant/20 flex items-center justify-end gap-2">
                    {isApproved ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                          <Check className="w-3.5 h-3.5" /> Ditambahkan
                        </span>
                        <Link
                          href="/map"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-m3-md bg-m3-surface-container-highest text-m3-primary text-xs font-semibold"
                        >
                          <span>Peta Topologi</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ) : isIgnored ? (
                      <span className="text-xs text-m3-on-surface-variant italic">Diabaikan</span>
                    ) : (
                      <>
                        <M3Button
                          size="sm"
                          variant="text"
                          onClick={() => ignoreDiscoveredDevice(item.id)}
                        >
                          Abaikan
                        </M3Button>
                        <M3Button
                          size="sm"
                          variant="filled-tonal"
                          onClick={() => approveDiscoveredDevice(item.id)}
                          icon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Setujui & Pantau
                        </M3Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </M3Card>
  );
};
