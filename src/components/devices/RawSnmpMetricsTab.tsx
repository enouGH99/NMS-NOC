'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RawSnmpMetric, RawMetricCategory } from '@/lib/types';
import { nmsApi } from '@/lib/api-client';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import {
  Database,
  RefreshCw,
  Search,
  Download,
  Copy,
  Check,
  Tag,
  Cpu,
  Thermometer,
  HardDrive,
  Layers,
  SlidersHorizontal,
  Globe,
  Radio,
  Share2,
  FileCode,
} from 'lucide-react';

interface RawSnmpMetricsTabProps {
  deviceId: string;
  deviceName: string;
}

const CATEGORIES: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Semua OID', icon: <Database className="w-3.5 h-3.5" /> },
  { id: 'system', label: 'System & License', icon: <Radio className="w-3.5 h-3.5" /> },
  { id: 'hardware_health', label: 'Suhu & Tegangan', icon: <Thermometer className="w-3.5 h-3.5" /> },
  { id: 'cpu_cores', label: 'CPU Cores (MT7621A)', icon: <Cpu className="w-3.5 h-3.5" /> },
  { id: 'memory_storage', label: 'RAM & Flash Disk', icon: <HardDrive className="w-3.5 h-3.5" /> },
  { id: 'interfaces', label: 'Interface & 64-bit HC', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'optical_sfp', label: 'Optik SFP (DDM)', icon: <Radio className="w-3.5 h-3.5" /> },
  { id: 'queue_tree', label: 'Queue Tree & Mangle', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
  { id: 'ip_addresses', label: 'IP Address & ARP', icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'bridge_fdb', label: 'Bridge FDB MAC', icon: <Share2 className="w-3.5 h-3.5" /> },
  { id: 'dhcp_neighbors', label: 'DHCP & MNDP', icon: <Tag className="w-3.5 h-3.5" /> },
];

export const RawSnmpMetricsTab: React.FC<RawSnmpMetricsTabProps> = ({ deviceId, deviceName }) => {
  const [metrics, setMetrics] = useState<RawSnmpMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (refresh = false) => {
    try {
      if (refresh) setIsExporting(true);
      else setIsLoading(true);

      const res: any = await nmsApi.getRawMetrics(deviceId, {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        refresh,
      });

      if (res && res.success) {
        setMetrics(res.data || []);
        if (res.categoryCounts) setCategoryCounts(res.categoryCounts);
      }
    } catch (err) {
      console.warn('Failed to load raw metrics:', err);
    } finally {
      setIsLoading(false);
      setIsExporting(false);
    }
  }, [deviceId, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchMetrics(false);
  }, [fetchMetrics]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `raw_snmp_metrics_${deviceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_ros6.48.4.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredMetrics = metrics.filter((m) => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      m.oid.toLowerCase().includes(q) ||
      m.oid_name.toLowerCase().includes(q) ||
      (m.parsed_value && m.parsed_value.toLowerCase().includes(q)) ||
      m.raw_value.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Banner & Exporter Controls */}
      <M3Card className="p-4 sm:p-5 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-m3-outline-variant/20">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-m3-on-surface flex items-center gap-2">
                <Database className="w-5 h-5 text-m3-primary" />
                Data Mentah SNMP (RouterOS v6.48.4 / hEX S)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-primary/15 text-m3-primary font-mono font-bold">
                {metrics.length} Total OID
              </span>
            </div>
            <p className="text-xs text-m3-on-surface-variant mt-0.5">
              Seluruh OID metrik sistem, sensor hardware, CPU core, storage, port interface, dan queue tree diekspor langsung ke database PostgreSQL
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <M3Button
              size="sm"
              variant="outlined"
              onClick={handleDownloadJson}
              icon={<Download className="w-3.5 h-3.5" />}
              disabled={filteredMetrics.length === 0}
            >
              Unduh JSON Raw
            </M3Button>

            <M3Button
              size="sm"
              variant="filled"
              onClick={() => fetchMetrics(true)}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isExporting ? 'animate-spin' : ''}`} />}
              disabled={isExporting}
            >
              {isExporting ? 'Mengekspor SNMP...' : 'Ekspor Ulang (SNMP)'}
            </M3Button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count = cat.id === 'all' ? metrics.length : (categoryCounts[cat.id] || 0);
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-m3-primary text-m3-on-primary border-m3-primary shadow-xs'
                    : 'bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface border-m3-outline-variant/30'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-m3-on-primary/20 text-m3-on-primary' : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan OID (contoh: 1.3.6.1.4.1.14988.1.1.3), nama OID (mtxrHlTemperature), atau nilai..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30 text-m3-on-surface placeholder:text-m3-on-surface-variant/50 focus:outline-hidden focus:border-m3-primary font-mono"
          />
        </div>
      </M3Card>

      {/* Metrics Table */}
      <M3Card className="p-0 bg-m3-surface-container border border-m3-outline-variant/30 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-m3-primary animate-spin mx-auto opacity-70" />
            <p className="text-xs text-m3-on-surface-variant font-mono">Memuat raw data SNMP dari database...</p>
          </div>
        ) : filteredMetrics.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileCode className="w-10 h-10 text-m3-outline mx-auto opacity-40" />
            <p className="text-sm font-bold text-m3-on-surface">Tidak ada data raw OID yang cocok</p>
            <p className="text-xs text-m3-on-surface-variant max-w-sm mx-auto">
              Coba gunakan kata kunci pencarian lain atau klik tombol "Ekspor Ulang (SNMP)" di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-m3-surface-container-high/60 text-m3-on-surface-variant font-bold text-[11px] uppercase tracking-wider border-b border-m3-outline-variant/30">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Nama Metrik & Kategori</th>
                  <th className="py-3 px-4 font-mono">Alamat OID ASN.1</th>
                  <th className="py-3 px-3">Tipe Data</th>
                  <th className="py-3 px-4">Nilai Mentah (Raw)</th>
                  <th className="py-3 px-4">Nilai Terparsing (Parsed)</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/20 font-mono text-[11px]">
                {filteredMetrics.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-m3-surface-container-high/40 transition-colors">
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center text-m3-on-surface-variant font-bold text-[10px]">
                      {String(idx + 1).padStart(2, '0')}
                    </td>

                    {/* Name & Category */}
                    <td className="py-2.5 px-4 font-sans">
                      <div className="flex flex-col">
                        <span className="font-extrabold font-mono text-m3-on-surface text-xs">{item.oid_name}</span>
                        <span className="text-[10px] text-m3-on-surface-variant/80 font-mono capitalize">
                          {item.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>

                    {/* OID Address */}
                    <td className="py-2.5 px-4 text-m3-primary font-bold">
                      <span className="px-1.5 py-0.5 rounded-sm bg-m3-surface-container-highest border border-m3-outline-variant/30 text-[10px]">
                        {item.oid}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-m3-surface-container-highest text-m3-on-surface-variant border border-m3-outline-variant/20">
                        {item.type}
                      </span>
                    </td>

                    {/* Raw Value */}
                    <td className="py-2.5 px-4 max-w-[200px] truncate text-m3-on-surface-variant" title={item.raw_value}>
                      {item.raw_value}
                    </td>

                    {/* Parsed Value */}
                    <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        {item.parsed_value || item.raw_value}
                      </span>
                    </td>

                    {/* Copy Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-sans">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.oid, `oid-${item.id}`)}
                          title="Salin Alamat OID"
                          className="p-1 rounded-md hover:bg-m3-surface-container-highest text-m3-on-surface-variant hover:text-m3-on-surface transition-colors"
                        >
                          {copiedId === `oid-${item.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </M3Card>
    </div>
  );
};
