'use client';

import React, { useState } from 'react';
import { DeviceInterface } from '@/lib/types';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import { M3Dialog } from '../m3/M3Dialog';
import { M3TextField } from '../m3/M3TextField';
import { formatBytes, formatThroughput } from '@/lib/utils';
import {
  Layers,
  Zap,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  Settings2,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Gauge,
  Edit2,
  Radio,
  Check,
  ChevronDown,
} from 'lucide-react';

interface InterfaceTableProps {
  deviceId: string;
  interfaces: DeviceInterface[];
  onScanSnmp: () => void;
  isScanning?: boolean;
}

type ThroughputUnitMode = 'auto' | 'mbps' | 'kbps' | 'bps';
type InterfaceCategoryFilter = 'all' | 'ethernet' | 'bridge' | 'vpn' | 'vlan_sfp';

export const InterfaceTable: React.FC<InterfaceTableProps> = ({
  deviceId,
  interfaces,
  onScanSnmp,
  isScanning = false,
}) => {
  const { updateInterface, updateAllInterfaceSpeeds } = useNms();

  // Unit and display states
  const [unitMode, setUnitMode] = useState<ThroughputUnitMode>('auto');
  const [categoryFilter, setCategoryFilter] = useState<InterfaceCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick global speed profile
  const [globalSpeed, setGlobalSpeed] = useState<'100M' | '1G' | '10G'>('100M');

  // Edit interface modal state
  const [editingInterface, setEditingInterface] = useState<DeviceInterface | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    speed: string;
    mtu: number;
    l2_mtu: number;
    status: 'up' | 'down';
  }>({
    name: '',
    speed: '100 Mbps (Fast Ethernet)',
    mtu: 1500,
    l2_mtu: 1596,
    status: 'up',
  });

  // Filtered interfaces
  const filteredInterfaces = interfaces.filter((iface) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = iface.name.toLowerCase().includes(q);
      const matchType = iface.type.toLowerCase().includes(q);
      const matchSpeed = iface.speed.toLowerCase().includes(q);
      if (!matchName && !matchType && !matchSpeed) return false;
    }

    // Category filter
    if (categoryFilter === 'ethernet') {
      return iface.type === 'ethernet';
    }
    if (categoryFilter === 'bridge') {
      return iface.type === 'bridge';
    }
    if (categoryFilter === 'vpn') {
      return iface.type === 'ovpn' || iface.type === 'pptp' || iface.type === 'l2tp' || iface.type === 'pppoe';
    }
    if (categoryFilter === 'vlan_sfp') {
      return iface.type === 'vlan' || iface.type === 'sfp';
    }

    return true;
  });

  // Category counts
  const ethernetCount = interfaces.filter((i) => i.type === 'ethernet').length;
  const bridgeCount = interfaces.filter((i) => i.type === 'bridge').length;
  const vpnCount = interfaces.filter((i) => ['ovpn', 'pptp', 'l2tp', 'pppoe'].includes(i.type)).length;
  const vlanSfpCount = interfaces.filter((i) => ['vlan', 'sfp'].includes(i.type)).length;

  const handleApplyGlobalSpeed = (speedValue: '100 Mbps (Fast Ethernet)' | '1 Gbps (Gigabit)' | '10 Gbps (SFP+)') => {
    updateAllInterfaceSpeeds(deviceId, speedValue);
    if (speedValue.includes('100 Mbps')) setGlobalSpeed('100M');
    else if (speedValue.includes('1 Gbps')) setGlobalSpeed('1G');
    else setGlobalSpeed('10G');
  };

  const handleOpenEditModal = (iface: DeviceInterface) => {
    setEditingInterface(iface);
    setEditForm({
      name: iface.name,
      speed: iface.speed || '100 Mbps (Fast Ethernet)',
      mtu: iface.mtu || 1500,
      l2_mtu: iface.l2_mtu || 1596,
      status: iface.status || 'up',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInterface) return;

    updateInterface(editingInterface.id, {
      name: editForm.name,
      speed: editForm.speed,
      mtu: Number(editForm.mtu),
      l2_mtu: Number(editForm.l2_mtu),
      status: editForm.status,
    });

    setEditingInterface(null);
  };

  // Helper for type badges
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ethernet':
        return { label: 'Ethernet', bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' };
      case 'bridge':
        return { label: 'Bridge', bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' };
      case 'ovpn':
        return { label: 'OVPN Server', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
      case 'pptp':
        return { label: 'PPTP', bg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' };
      case 'l2tp':
        return { label: 'L2TP', bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30' };
      case 'pppoe':
        return { label: 'PPPoE', bg: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30' };
      case 'vlan':
        return { label: 'VLAN', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' };
      case 'sfp':
        return { label: 'SFP / Fiber', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
      default:
        return { label: type.toUpperCase(), bg: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30' };
    }
  };

  // Helper for Winbox link flag
  const getWinboxFlag = (iface: DeviceInterface) => {
    if (iface.status === 'down') return { code: 'X', label: 'Disabled / Down', color: 'text-rose-500 bg-rose-500/10' };
    if (iface.type === 'ovpn' || iface.type === 'pptp') return { code: 'DR', label: 'Dynamic Running', color: 'text-amber-500 bg-amber-500/10' };
    if (iface.name.includes('ether') && iface.name.includes('-')) return { code: 'RS', label: 'Running Slave', color: 'text-cyan-500 bg-cyan-500/10' };
    return { code: 'R', label: 'Running', color: 'text-emerald-500 bg-emerald-500/10' };
  };

  return (
    <M3Card className="p-4 sm:p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-5">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-m3-outline-variant/20">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-m3-on-surface flex items-center gap-2">
              <Layers className="w-5 h-5 text-m3-primary" />
              Daftar Interface & Port Jaringan
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-m3-surface-container-highest text-m3-primary border border-m3-outline-variant/30">
              {interfaces.length} Total
            </span>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-1">
            Monitoring throughput live, MTU, packet per second (p/s), dan status port sesuai konfigurasi MikroTik RouterOS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <M3Button
            size="sm"
            variant="filled"
            loading={isScanning}
            onClick={onScanSnmp}
            icon={<Radio className="w-4 h-4" />}
          >
            {isScanning ? 'Memindai SNMP...' : 'Pindai Port Interface (SNMP)'}
          </M3Button>
        </div>
      </div>

      {/* Speed Profile & Unit Control Bar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30">
        {/* Unit Selector (Left) */}
        <div className="xl:col-span-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-m3-on-surface">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-m3-primary" />
              Format Satuan Trafik Throughput:
            </span>
            <span className="text-[11px] text-m3-primary font-mono font-semibold">
              {unitMode === 'auto' && 'Mode Auto (bps / kbps / Mbps seperti Winbox)'}
              {unitMode === 'mbps' && 'Selalu Format Mbps'}
              {unitMode === 'kbps' && 'Selalu Format kbps'}
              {unitMode === 'bps' && 'Format bps Mentah'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-m3-lg bg-m3-surface-container-lowest border border-m3-outline-variant/20">
            <button
              type="button"
              onClick={() => setUnitMode('auto')}
              className={`py-1.5 px-2 rounded-m3-md text-xs font-bold transition-all text-center ${
                unitMode === 'auto'
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
            >
              Auto (Winbox)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('mbps')}
              className={`py-1.5 px-2 rounded-m3-md text-xs font-bold transition-all text-center ${
                unitMode === 'mbps'
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
            >
              Mbps
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('kbps')}
              className={`py-1.5 px-2 rounded-m3-md text-xs font-bold transition-all text-center ${
                unitMode === 'kbps'
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
            >
              kbps
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('bps')}
              className={`py-1.5 px-2 rounded-m3-md text-xs font-bold transition-all text-center ${
                unitMode === 'bps'
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
            >
              bps
            </button>
          </div>
        </div>

        {/* Global Fast Ethernet / Gigabit Port Speed Switcher (Right) */}
        <div className="xl:col-span-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-m3-on-surface">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
              Pilihan Kecepatan Port Fisik (Ethernet):
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Ubah semua port sekaligus
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-m3-lg bg-m3-surface-container-lowest border border-m3-outline-variant/20">
            <button
              type="button"
              onClick={() => handleApplyGlobalSpeed('100 Mbps (Fast Ethernet)')}
              className={`py-1.5 px-2 rounded-m3-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                globalSpeed === '100M'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
            >
              ⚡ Fast Ethernet (100M)
            </button>
            <button
              type="button"
              onClick={() => handleApplyGlobalSpeed('1 Gbps (Gigabit)')}
              className={`py-1.5 px-2 rounded-m3-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                globalSpeed === '10G' || globalSpeed === '1G'
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
            >
              🚀 Gigabit (1 Gbps)
            </button>
            <button
              type="button"
              onClick={() => handleApplyGlobalSpeed('10 Gbps (SFP+)')}
              className={`py-1.5 px-2 rounded-m3-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                globalSpeed === '10G'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
            >
              💎 10G SFP+ Fiber
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              categoryFilter === 'all'
                ? 'bg-m3-primary text-m3-on-primary'
                : 'bg-m3-surface-container-high text-m3-on-surface-variant hover:bg-m3-surface-container-highest'
            }`}
          >
            Semua ({interfaces.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('ethernet')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              categoryFilter === 'ethernet'
                ? 'bg-blue-600 text-white'
                : 'bg-m3-surface-container-high text-m3-on-surface-variant hover:bg-m3-surface-container-highest'
            }`}
          >
            Ethernet Port ({ethernetCount})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('bridge')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              categoryFilter === 'bridge'
                ? 'bg-purple-600 text-white'
                : 'bg-m3-surface-container-high text-m3-on-surface-variant hover:bg-m3-surface-container-highest'
            }`}
          >
            Bridge ({bridgeCount})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('vpn')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              categoryFilter === 'vpn'
                ? 'bg-emerald-600 text-white'
                : 'bg-m3-surface-container-high text-m3-on-surface-variant hover:bg-m3-surface-container-highest'
            }`}
          >
            VPN & Tunnel ({vpnCount})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('vlan_sfp')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              categoryFilter === 'vlan_sfp'
                ? 'bg-amber-600 text-white'
                : 'bg-m3-surface-container-high text-m3-on-surface-variant hover:bg-m3-surface-container-highest'
            }`}
          >
            VLAN & SFP ({vlanSfpCount})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" />
          <input
            type="text"
            placeholder="Cari nama interface (misal: ether1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs text-m3-on-surface focus:outline-hidden focus:border-m3-primary font-mono placeholder:font-sans"
          />
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="space-y-3 block md:hidden">
        {filteredInterfaces.length === 0 ? (
          <div className="text-center py-8 text-xs text-m3-on-surface-variant">
            Tidak ada interface yang cocok dengan filter.
          </div>
        ) : (
          filteredInterfaces.map((iface) => {
            const flag = getWinboxFlag(iface);
            const typeBadge = getTypeBadge(iface.type);

            return (
              <div
                key={iface.id}
                className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded-sm font-mono font-black text-[10px] ${flag.color}`}>
                        {flag.code}
                      </span>
                      <span className="font-mono font-bold text-sm text-m3-on-surface">
                        {iface.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeBadge.bg}`}>
                        {typeBadge.label}
                      </span>
                      {iface.mtu && (
                        <span className="text-[10px] font-mono text-m3-on-surface-variant bg-m3-surface-container-highest px-2 py-0.5 rounded-full">
                          MTU: {iface.mtu} {iface.l2_mtu ? `(L2: ${iface.l2_mtu})` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(iface)}
                    className="p-1.5 rounded-m3-md hover:bg-m3-surface-container-highest text-m3-primary transition-colors"
                    title="Ubah Kecepatan / Konfigurasi Port"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Speed Badge */}
                <div className="flex items-center justify-between py-1 px-2.5 rounded-m3-md bg-m3-surface-container-lowest">
                  <span className="text-[11px] text-m3-on-surface-variant font-medium">Kapasitas Link:</span>
                  <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-300">
                    {iface.speed || '100 Mbps (Fast Ethernet)'}
                  </span>
                </div>

                {/* Throughput Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="p-2.5 rounded-m3-xl bg-m3-surface-container-lowest space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-m3-on-surface-variant font-sans">
                      <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <ArrowDownLeft className="w-3 h-3" /> Download (Rx)
                      </span>
                      {iface.rx_packet_ps !== undefined && (
                        <span className="text-[10px] opacity-75">{iface.rx_packet_ps} p/s</span>
                      )}
                    </div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {formatThroughput(iface.rx_rate, unitMode)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-m3-xl bg-m3-surface-container-lowest space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-m3-on-surface-variant font-sans">
                      <span className="flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
                        <ArrowUpRight className="w-3 h-3" /> Upload (Tx)
                      </span>
                      {iface.tx_packet_ps !== undefined && (
                        <span className="text-[10px] opacity-75">{iface.tx_packet_ps} p/s</span>
                      )}
                    </div>
                    <div className="text-sm font-black text-sky-600 dark:text-sky-400">
                      {formatThroughput(iface.tx_rate, unitMode)}
                    </div>
                  </div>
                </div>

                {/* Total Bytes */}
                <div className="flex items-center justify-between text-[11px] text-m3-on-surface-variant font-mono pt-1">
                  <span>Total: ↓ {formatBytes(iface.rx_bytes)} / ↑ {formatBytes(iface.tx_bytes)}</span>
                  <span>Error: {iface.error_rate}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Full Table (>= md) */}
      <div className="rounded-m3-2xl border border-m3-outline-variant/30 overflow-hidden bg-m3-surface-container-lowest hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-m3-surface-container-high text-m3-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3 w-12 text-center">Flag</th>
                <th className="py-3 px-4">Nama Interface</th>
                <th className="py-3 px-3">Tipe & MTU</th>
                <th className="py-3 px-4">Kapasitas Kecepatan</th>
                <th className="py-3 px-4">Trafik Tx (Upload)</th>
                <th className="py-3 px-4">Trafik Rx (Download)</th>
                <th className="py-3 px-4">Paket Rate (p/s)</th>
                <th className="py-3 px-4">Total Data In / Out</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-m3-outline-variant/20">
              {filteredInterfaces.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-m3-on-surface-variant">
                    Tidak ada interface yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredInterfaces.map((iface) => {
                  const flag = getWinboxFlag(iface);
                  const typeBadge = getTypeBadge(iface.type);

                  return (
                    <tr
                      key={iface.id}
                      className={`hover:bg-m3-surface-container-high/40 transition-colors ${
                        iface.status === 'down' ? 'opacity-60 bg-m3-surface-container/20' : ''
                      }`}
                    >
                      {/* Flag column */}
                      <td className="py-3 px-3 text-center">
                        <span
                          title={flag.label}
                          className={`inline-block px-1.5 py-0.5 rounded-sm font-mono font-black text-[10px] ${flag.color}`}
                        >
                          {flag.code}
                        </span>
                      </td>

                      {/* Name column */}
                      <td className="py-3 px-4 font-bold font-mono text-m3-on-surface">
                        <div className="flex items-center gap-1.5">
                          <span>{iface.name}</span>
                          {iface.status === 'up' ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          )}
                        </div>
                      </td>

                      {/* Type & MTU column */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeBadge.bg}`}>
                            {typeBadge.label}
                          </span>
                          {iface.mtu && (
                            <div className="text-[10px] font-mono text-m3-on-surface-variant">
                              MTU: {iface.mtu} {iface.l2_mtu ? `(${iface.l2_mtu})` : ''}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Speed Capacity Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
                              iface.speed?.includes('100 Mbps') || iface.speed?.includes('Fast')
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : iface.speed?.includes('10 Gbps')
                                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {iface.speed || '100 Mbps (Fast Ethernet)'}
                          </span>
                        </div>
                      </td>

                      {/* Tx Throughput Column */}
                      <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                        <div>
                          <span>{formatThroughput(iface.tx_rate, unitMode)}</span>
                          {iface.fp_tx_rate !== undefined && (
                            <div className="text-[10px] text-m3-on-surface-variant font-normal">
                              FP Tx: {formatThroughput(iface.fp_tx_rate, unitMode)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Rx Throughput Column */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <div>
                          <span>{formatThroughput(iface.rx_rate, unitMode)}</span>
                          {iface.fp_rx_rate !== undefined && (
                            <div className="text-[10px] text-m3-on-surface-variant font-normal">
                              FP Rx: {formatThroughput(iface.fp_rx_rate, unitMode)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Packet Rate (p/s) Column */}
                      <td className="py-3 px-4 font-mono text-[11px] text-m3-on-surface">
                        {iface.tx_packet_ps !== undefined || iface.rx_packet_ps !== undefined ? (
                          <div className="space-y-0.5">
                            <div className="text-sky-600 dark:text-sky-400">Tx: {iface.tx_packet_ps || 0} p/s</div>
                            <div className="text-emerald-600 dark:text-emerald-400">Rx: {iface.rx_packet_ps || 0} p/s</div>
                          </div>
                        ) : (
                          <span className="text-m3-on-surface-variant text-[10px]">-</span>
                        )}
                      </td>

                      {/* Total In/Out Bytes */}
                      <td className="py-3 px-4 font-mono text-m3-on-surface-variant text-[11px]">
                        <div>↓ {formatBytes(iface.rx_bytes)}</div>
                        <div>↑ {formatBytes(iface.tx_bytes)}</div>
                      </td>

                      {/* Action Column */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(iface)}
                          className="p-1.5 rounded-m3-md hover:bg-m3-surface-container-highest text-m3-primary transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                          title="Ubah Kecepatan Port"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Interface Modal */}
      {editingInterface && (
        <M3Dialog
          isOpen={!!editingInterface}
          onClose={() => setEditingInterface(null)}
          title={`Konfigurasi Port: ${editingInterface.name}`}
          icon={<Settings2 className="w-5 h-5 text-m3-primary" />}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-1">
            <M3TextField
              label="Nama Interface"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />

            {/* Port Speed Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-m3-on-surface">
                Pilihan Kecepatan Port Fisik (Kapasitas Link)
              </label>
              <select
                value={editForm.speed}
                onChange={(e) => setEditForm({ ...editForm, speed: e.target.value })}
                className="w-full p-2.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
              >
                <option value="100 Mbps (Fast Ethernet)">⚡ 100 Mbps (Fast Ethernet - 100BASE-TX)</option>
                <option value="1 Gbps (Gigabit)">🚀 1 Gbps (Gigabit Ethernet - 1000BASE-T)</option>
                <option value="2.5 Gbps (Multi-Gig)">🔥 2.5 Gbps (Multi-Gigabit)</option>
                <option value="10 Gbps (SFP+)">💎 10 Gbps (10G SFP+ Fiber Optic)</option>
                <option value="10 Mbps (Legacy)">🐢 10 Mbps (Legacy 10BASE-T)</option>
                <option value="Virtual Tunnel">🛡️ Virtual Tunnel / VPN</option>
                <option value="VLAN 20">🏷️ VLAN Tagged Virtual</option>
              </select>
              <p className="text-[11px] text-m3-on-surface-variant">
                Pilih <strong>Fast Ethernet (100 Mbps)</strong> jika port fisik switch atau kabel LAN Anda menggunakan spesifikasi 100 Mbps.
              </p>
            </div>

            {/* MTU Inputs */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <M3TextField
                label="Actual MTU"
                type="number"
                value={editForm.mtu}
                onChange={(e) => setEditForm({ ...editForm, mtu: Number(e.target.value) })}
              />
              <M3TextField
                label="L2 MTU"
                type="number"
                value={editForm.l2_mtu}
                onChange={(e) => setEditForm({ ...editForm, l2_mtu: Number(e.target.value) })}
              />
            </div>

            {/* Status Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-m3-on-surface">Status Operasional Port</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, status: 'up' })}
                  className={`py-2 px-3 rounded-m3-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    editForm.status === 'up'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-m3-surface-container-high text-m3-on-surface-variant'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Link UP (Running)
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, status: 'down' })}
                  className={`py-2 px-3 rounded-m3-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    editForm.status === 'down'
                      ? 'bg-rose-500 text-white font-black'
                      : 'bg-m3-surface-container-high text-m3-on-surface-variant'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> Link DOWN (Disabled)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <M3Button variant="outlined" type="button" onClick={() => setEditingInterface(null)}>
                Batal
              </M3Button>
              <M3Button variant="filled" type="submit">
                Simpan Perubahan
              </M3Button>
            </div>
          </form>
        </M3Dialog>
      )}
    </M3Card>
  );
};
