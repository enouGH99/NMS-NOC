'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Device, DeviceStatus, DeviceType } from '@/lib/types';
import { useNms } from '@/lib/store';
import { getStatusM3Badge } from '@/lib/m3-theme';
import { M3Button } from '../m3/M3Button';
import { M3Chip } from '../m3/M3Chip';
import {
  Server,
  Star,
  Zap,
  Wrench,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  Plus,
  Download,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Cpu,
  Activity,
  Router,
  Wifi,
  Shield,
  Layers,
} from 'lucide-react';
import { downloadCsv } from '@/lib/utils';

interface DeviceTableProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (device: Device) => void;
  onOpenPingModal: (device: Device) => void;
  onOpenRepairModal: (device: Device) => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenPingModal,
  onOpenRepairModal,
}) => {
  const { devices, locations, toggleDevicePriority, deleteDevice } = useNms();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyPriority, setOnlyPriority] = useState(false);
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  const filteredDevices = devices.filter((dev) => {
    if (onlyPriority && !dev.is_priority) return false;
    if (selectedStatus !== 'all' && dev.status !== selectedStatus) return false;
    if (selectedLocation !== 'all' && dev.location_id !== selectedLocation) return false;
    if (selectedType !== 'all' && dev.type !== selectedType) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = dev.name.toLowerCase().includes(q);
      const matchIp = dev.ip_address.includes(q);
      const matchMac = dev.mac_address.toLowerCase().includes(q);
      const matchModel = dev.model.toLowerCase().includes(q);
      if (!matchName && !matchIp && !matchMac && !matchModel) return false;
    }

    return true;
  });

  const handleExportCsv = () => {
    const rows = filteredDevices.map((d) => ({
      ID: d.id,
      Nama_Perangkat: d.name,
      Tipe: d.type,
      IP_Address: d.ip_address,
      MAC_Address: d.mac_address,
      Model: d.model,
      Lokasi: d.location_name,
      Status: d.status,
      Prioritas: d.is_priority ? 'Ya' : 'Tidak',
      CPU_Usage: `${d.cpu_usage}%`,
      RAM_Usage: `${d.ram_usage}%`,
      Latency: `${d.latency}ms`,
      Uptime: d.uptime,
    }));
    downloadCsv(`daftar-perangkat-nms-${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'router':
        return <Router className="w-4 h-4" />;
      case 'switch':
        return <Layers className="w-4 h-4" />;
      case 'access_point':
        return <Wifi className="w-4 h-4" />;
      case 'server':
        return <Server className="w-4 h-4" />;
      case 'firewall':
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-m3-surface-container-low p-4 rounded-m3-3xl border border-m3-outline-variant/30">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-m3-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama perangkat, IP, MAC..."
            className="w-full h-11 pl-10 pr-4 rounded-m3-full bg-m3-surface-container-lowest text-xs sm:text-sm text-m3-on-surface border border-m3-outline-variant/40 outline-none focus:ring-2 focus:ring-m3-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          {/* View Mode Toggle (Cards vs Table) */}
          <div className="flex items-center bg-m3-surface-container-lowest rounded-m3-full p-1 border border-m3-outline-variant/40">
            <button
              onClick={() => setViewMode('cards')}
              title="Tampilan Kartu (Responsif)"
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === 'cards'
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container font-bold'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel (Desktop)"
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === 'table'
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container font-bold'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <M3Button
            variant="outlined"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-4 h-4" />}
          >
            Ekspor CSV
          </M3Button>
          <M3Button
            variant="filled"
            size="sm"
            onClick={onOpenAddModal}
            icon={<Plus className="w-4 h-4" />}
          >
            Tambah Perangkat
          </M3Button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-m3-2xl bg-m3-surface-container/50 border border-m3-outline-variant/30">
        <div className="flex items-center gap-1 text-xs font-bold text-m3-on-surface-variant mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Status:</span>
        </div>

        {[
          { id: 'all', label: 'Semua' },
          { id: 'online', label: 'Online' },
          { id: 'warning', label: 'Warning' },
          { id: 'offline', label: 'Offline' },
        ].map((st) => (
          <M3Chip
            key={st.id}
            selected={selectedStatus === st.id}
            onClick={() => setSelectedStatus(st.id)}
          >
            {st.label}
          </M3Chip>
        ))}

        <div className="h-4 w-px bg-m3-outline-variant/40 mx-1 hidden sm:block" />

        <M3Chip
          selected={onlyPriority}
          onClick={() => setOnlyPriority(!onlyPriority)}
          icon={<Star className={`w-3.5 h-3.5 ${onlyPriority ? 'fill-current' : ''}`} />}
        >
          Hanya Prioritas
        </M3Chip>
      </div>

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <div className="rounded-m3-3xl bg-m3-surface-container border border-m3-outline-variant/30 p-12 text-center text-m3-on-surface-variant">
          <Server className="w-12 h-12 mx-auto text-m3-outline mb-3 opacity-50" />
          <h3 className="font-bold text-sm text-m3-on-surface">Tidak Ada Perangkat yang Sesuai</h3>
          <p className="text-xs text-m3-on-surface-variant mt-1">
            Coba ubah kata kunci pencarian atau sesuaikan filter status di atas.
          </p>
        </div>
      )}

      {/* 1. MOBILE RESPONSIVE CARDS VIEW (Visible on mobile < md or if viewMode === 'cards') */}
      {filteredDevices.length > 0 && (
        <div
          className={`space-y-3 ${
            viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block md:hidden'
          }`}
        >
          {filteredDevices.map((device) => {
            const statusBadge = getStatusM3Badge(device.status);

            return (
              <div
                key={device.id}
                className="p-4 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-3 shadow-xs hover:border-m3-outline-variant/60 transition-colors"
              >
                {/* Card Top Row: Star + Name + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <button
                      onClick={() => toggleDevicePriority(device.id)}
                      title="Ubah Status Prioritas"
                      className="p-1 rounded-full text-m3-on-surface-variant hover:text-amber-500 transition-colors shrink-0"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          device.is_priority
                            ? 'fill-amber-400 text-amber-500'
                            : 'opacity-40'
                        }`}
                      />
                    </button>

                    <div className="overflow-hidden flex-1">
                      <Link
                        href={`/devices/${device.id}`}
                        className="font-extrabold text-sm text-m3-on-surface hover:text-m3-primary transition-colors flex items-center gap-1.5 truncate"
                      >
                        <span className="truncate">{device.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                      </Link>
                      <div className="text-[11px] text-m3-on-surface-variant flex items-center gap-1 mt-0.5 truncate">
                        {getDeviceIcon(device.type)}
                        <span className="truncate">{device.model}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusBadge.bg} ${statusBadge.text}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                {/* Card Middle Grid: IP, MAC, Location, Uptime */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-m3-outline-variant/20">
                  <div className="p-2 rounded-m3-md bg-m3-surface-container-high/60">
                    <span className="text-[10px] text-m3-on-surface-variant block">Alamat IP</span>
                    <span className="font-mono font-bold text-xs text-m3-on-surface">
                      {device.ip_address}
                    </span>
                  </div>

                  <div className="p-2 rounded-m3-md bg-m3-surface-container-high/60">
                    <span className="text-[10px] text-m3-on-surface-variant block">Lokasi</span>
                    <span className="font-medium text-xs text-m3-on-surface flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-m3-primary shrink-0" />
                      <span className="truncate">{device.location_name}</span>
                    </span>
                  </div>

                  <div className="p-2 rounded-m3-md bg-m3-surface-container-high/60">
                    <span className="text-[10px] text-m3-on-surface-variant block">MAC Address</span>
                    <span className="font-mono text-[11px] text-m3-on-surface-variant">
                      {device.mac_address}
                    </span>
                  </div>

                  <div className="p-2 rounded-m3-md bg-m3-surface-container-high/60">
                    <span className="text-[10px] text-m3-on-surface-variant block">Uptime</span>
                    <span className="font-mono font-semibold text-[11px] text-m3-on-surface">
                      {device.uptime}
                    </span>
                  </div>
                </div>

                {/* Health Gauges Row */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-m3-md bg-m3-surface-container-lowest text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-m3-primary" />
                    <span>CPU: <strong>{device.cpu_usage}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-m3-on-surface-variant">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ping: {device.latency}ms ({device.packet_loss}% loss)</span>
                  </div>
                </div>

                {/* Action Buttons Bar for Mobile Touch */}
                <div className="flex items-center gap-2 pt-2 border-t border-m3-outline-variant/20">
                  <M3Button
                    size="sm"
                    variant="filled-tonal"
                    fullWidth
                    onClick={() => onOpenPingModal(device)}
                    icon={<Zap className="w-3.5 h-3.5 text-emerald-500" />}
                  >
                    Uji Ping
                  </M3Button>

                  <M3Button
                    size="sm"
                    variant="outlined"
                    fullWidth
                    onClick={() => onOpenRepairModal(device)}
                    icon={<Wrench className="w-3.5 h-3.5 text-m3-primary" />}
                  >
                    Perbaikan
                  </M3Button>

                  <button
                    onClick={() => onOpenEditModal(device)}
                    title="Ubah Konfigurasi"
                    className="p-2 rounded-full hover:bg-m3-surface-container-highest text-m3-on-surface-variant transition-colors shrink-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus ${device.name}?`)) {
                        deleteDevice(device.id);
                      }
                    }}
                    title="Hapus Perangkat"
                    className="p-2 rounded-full hover:bg-m3-error/10 text-m3-error transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. DESKTOP FULL DATA TABLE VIEW (Visible on desktop >= md or if viewMode === 'table') */}
      {filteredDevices.length > 0 && (
        <div
          className={`rounded-m3-3xl bg-m3-surface-container border border-m3-outline-variant/30 overflow-hidden shadow-xs ${
            viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-m3-on-surface min-w-[760px]">
              <thead className="bg-m3-surface-container-high text-m3-on-surface-variant uppercase font-bold text-[11px] tracking-wider border-b border-m3-outline-variant/30">
                <tr>
                  <th className="py-3.5 px-4 w-10">Prio</th>
                  <th className="py-3.5 px-4">Perangkat & Model</th>
                  <th className="py-3.5 px-4">Alamat IP & MAC</th>
                  <th className="py-3.5 px-4">Lokasi</th>
                  <th className="py-3.5 px-4">Status & Uptime</th>
                  <th className="py-3.5 px-4">Metrik (CPU/Latensi)</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/20">
                {filteredDevices.map((device) => {
                  const statusBadge = getStatusM3Badge(device.status);

                  return (
                    <tr
                      key={device.id}
                      className="hover:bg-m3-surface-container-high/60 transition-colors"
                    >
                      {/* Priority Star */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleDevicePriority(device.id)}
                          title="Ubah Status Prioritas"
                          className="p-1 rounded-full text-m3-on-surface-variant hover:text-amber-500 transition-colors"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              device.is_priority
                                ? 'fill-amber-400 text-amber-500'
                                : 'opacity-40'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Name & Model */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/devices/${device.id}`}
                          className="font-bold text-sm text-m3-on-surface hover:text-m3-primary transition-colors flex items-center gap-1.5"
                        >
                          {device.name}
                          <ExternalLink className="w-3 h-3 opacity-60 inline" />
                        </Link>
                        <div className="text-[11px] text-m3-on-surface-variant mt-0.5">
                          {device.model}
                        </div>
                      </td>

                      {/* IP & MAC */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-xs text-m3-on-surface">
                          {device.ip_address}
                        </div>
                        <div className="text-[10px] text-m3-on-surface-variant">
                          {device.mac_address}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-xs text-m3-on-surface">
                          {device.location_name}
                        </div>
                      </td>

                      {/* Status & Uptime */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-m3-on-surface-variant font-mono mt-1">
                          {device.uptime}
                        </div>
                      </td>

                      {/* Metrics */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>CPU: <strong>{device.cpu_usage}%</strong></div>
                        <div className="text-m3-on-surface-variant">
                          Ping: {device.latency}ms ({device.packet_loss}% loss)
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenPingModal(device)}
                            title="Uji Koneksi (Ping)"
                            className="p-2 rounded-full hover:bg-m3-primary/10 text-emerald-600 dark:text-emerald-400 transition-colors"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenRepairModal(device)}
                            title="Catat Riwayat Perbaikan"
                            className="p-2 rounded-full hover:bg-m3-primary/10 text-m3-primary transition-colors"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(device)}
                            title="Ubah Konfigurasi"
                            className="p-2 rounded-full hover:bg-m3-surface-container-highest text-m3-on-surface-variant transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus ${device.name}?`)) {
                                deleteDevice(device.id);
                              }
                            }}
                            title="Hapus Perangkat"
                            className="p-2 rounded-full hover:bg-m3-error/10 text-m3-error transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
