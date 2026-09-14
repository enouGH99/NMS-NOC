'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { QueueTraffic } from '@/lib/types';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import { M3Dialog } from '../m3/M3Dialog';
import { M3TextField } from '../m3/M3TextField';
import { QueueTrafficSparkline } from './QueueTrafficSparkline';
import {
  SlidersHorizontal,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Search,
  Gauge,
  LayoutGrid,
  ListFilter,
  CheckCircle2,
  Edit2,
  Trash2,
} from 'lucide-react';
import { formatThroughput } from '@/lib/utils';

type ThroughputUnitMode = 'auto' | 'mbps' | 'kbps' | 'bps';

export const QueueTrafficChart: React.FC = () => {
  const { queues, syncQueues, addQueue, updateQueue, deleteQueue, devices } = useNms();
  const [isSyncing, setIsSyncing] = useState(false);
  const [unitMode, setUnitMode] = useState<ThroughputUnitMode>('auto');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Queue Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [queueName, setQueueName] = useState('');
  const [queueTarget, setQueueTarget] = useState('192.168.10.0/24');
  const [queueMaxLimit, setQueueMaxLimit] = useState('40M/40M');

  // Edit Queue Modal
  const [editingQueue, setEditingQueue] = useState<QueueTraffic | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editMaxLimit, setEditMaxLimit] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncQueues(undefined, true);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleCreateQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueName.trim()) return;

    addQueue({
      name: queueName.trim(),
      target: queueTarget.trim() || '0.0.0.0/0',
      max_limit: queueMaxLimit.trim() || '40M/40M',
      device_id: devices[0]?.id,
    });

    setQueueName('');
    setAddModalOpen(false);
  };

  const handleOpenEdit = (q: QueueTraffic) => {
    setEditingQueue(q);
    setEditName(q.name);
    setEditTarget(q.target);
    setEditMaxLimit(q.max_limit || '40M/40M');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQueue) return;

    updateQueue(editingQueue.id, {
      name: editName.trim() || editingQueue.name,
      target: editTarget.trim() || editingQueue.target,
      max_limit: editMaxLimit.trim() || editingQueue.max_limit,
    });

    setEditingQueue(null);
  };

  // Filter queues by search query
  const filteredQueues = queues.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.name.toLowerCase().includes(query) ||
      q.target.toLowerCase().includes(query) ||
      q.max_limit.toLowerCase().includes(query)
    );
  });

  const limitPresets = ['120M/120M', '50M/50M', '40M/40M', '30M/30M', '20M/20M', '10M/10M'];

  return (
    <M3Card className="p-4 sm:p-5 flex flex-col h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-m3-xl bg-m3-secondary-container text-m3-on-secondary-container shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-m3-on-surface tracking-tight truncate">
                Manajemen Bandwidth Simple Queue
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-surface-container-highest text-m3-primary font-mono font-bold border border-m3-outline-variant/30 shrink-0">
                {queues.length} Antrean
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-m3-on-surface-variant truncate">
              Utilisasi & batasan trafik per antrean MikroTik
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-m3-full bg-m3-surface-container-highest border border-m3-outline-variant/30">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel (Trafik Ethernet)"
              className={`px-2.5 py-1 rounded-m3-full text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Tampilan Kartu Grafik"
              className={`px-2.5 py-1 rounded-m3-full text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            title="Segarkan data Simple Queue langsung dari MikroTik (SNMP)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-m3-full bg-m3-surface-container-highest hover:bg-m3-surface-container-highest/80 text-m3-on-surface text-xs font-bold transition-colors border border-m3-outline-variant/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-m3-primary' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            title="Tambah Simple Queue Manual"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-m3-full bg-m3-primary/15 hover:bg-m3-primary/25 text-m3-primary text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Unit Mode Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Unit Selector */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/20">
          <span className="text-[10px] font-bold text-m3-on-surface-variant px-1.5 flex items-center gap-1 font-mono shrink-0">
            <Gauge className="w-3 h-3 text-m3-primary" />
            Satuan:
          </span>
          {(['auto', 'mbps', 'kbps', 'bps'] as ThroughputUnitMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setUnitMode(mode)}
              className={`px-2 py-0.5 rounded-m3-md text-[10px] sm:text-[11px] font-bold font-mono transition-all ${
                unitMode === mode
                  ? 'bg-m3-primary text-m3-on-primary shadow-2xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
            >
              {mode === 'auto' ? 'Auto (Winbox)' : mode.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-60 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" />
          <input
            type="text"
            placeholder="Cari queue / subnet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs text-m3-on-surface focus:outline-hidden focus:border-m3-primary font-mono placeholder:font-sans"
          />
        </div>
      </div>

      {/* Content Area */}
      {filteredQueues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-m3-on-surface-variant">
          <SlidersHorizontal className="w-8 h-8 text-m3-primary/40 mx-auto mb-2" />
          <p className="text-xs font-bold text-m3-on-surface mb-1">
            {queues.length === 0 ? 'Belum ada Simple Queue terbaca' : 'Tidak ada antrean yang cocok'}
          </p>
          <p className="text-[11px] text-m3-on-surface-variant max-w-xs mb-3">
            {queues.length === 0
              ? 'Klik tombol Segarkan untuk memuat antrean bandwidth dari router MikroTik Anda.'
              : 'Silakan ubah kata kunci pencarian Anda.'}
          </p>
          {queues.length === 0 && (
            <div className="flex items-center gap-2">
              <M3Button size="sm" variant="filled" onClick={handleSync} icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}>
                Sinkronkan dari MikroTik
              </M3Button>
              <M3Button size="sm" variant="outlined" onClick={() => setAddModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                + Tambah Manual
              </M3Button>
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ================== ETHERNET-STYLE TABLE VIEW ================== */
        <div className="rounded-m3-2xl border border-m3-outline-variant/30 overflow-hidden bg-m3-surface-container-lowest">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-m3-surface-container-high text-m3-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Nama Antrean</th>
                  <th className="py-2.5 px-3">Target Subnet</th>
                  <th className="py-2.5 px-3">Max Limit</th>
                  <th className="py-2.5 px-3">Trafik Tx (UL)</th>
                  <th className="py-2.5 px-3">Trafik Rx (DL)</th>
                  <th className="py-2.5 px-3 w-48">Grafik Trafik Live</th>
                  <th className="py-2.5 px-3">Utilisasi</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/20">
                {filteredQueues.map((q, idx) => {
                  const maxNum = parseInt(q.max_limit.split('/')[1] || q.max_limit.replace(/[^0-9]/g, '') || '100', 10) || 100;
                  const currentDl = q.current_rate.download;
                  const currentUl = q.current_rate.upload;
                  const usagePercent = Math.min(100, Math.round((currentDl / maxNum) * 100));

                  let barColor = 'bg-emerald-500';
                  if (usagePercent > 80) barColor = 'bg-rose-500';
                  else if (usagePercent > 60) barColor = 'bg-amber-500';

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-m3-surface-container-high/40 transition-colors"
                    >
                      {/* Flag / Index */}
                      <td className="py-2 px-3 text-center font-mono font-bold text-m3-on-surface-variant text-[11px]">
                        <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500 font-mono text-[10px]">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-2 px-3 font-bold font-mono text-m3-on-surface">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{q.name}</span>
                        </div>
                      </td>

                      {/* Target Subnet */}
                      <td className="py-2 px-3 font-mono text-[11px] text-m3-on-surface-variant">
                        <span className="bg-m3-surface-container-highest px-2 py-0.5 rounded-full border border-m3-outline-variant/30">
                          {q.target}
                        </span>
                      </td>

                      {/* Max Limit */}
                      <td className="py-2 px-3 font-mono font-bold text-amber-600 dark:text-amber-300 text-[11px]">
                        <span className="bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {q.max_limit}
                        </span>
                      </td>

                      {/* Tx Upload */}
                      <td className="py-2 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-sky-500 shrink-0" />
                          <span>{formatThroughput(currentUl, unitMode)}</span>
                        </div>
                      </td>

                      {/* Rx Download */}
                      <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <div className="flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{formatThroughput(currentDl, unitMode)}</span>
                        </div>
                      </td>

                      {/* Realtime Waveform Sparkline */}
                      <td className="py-2 px-3 w-48">
                        <div className="w-44">
                          <QueueTrafficSparkline
                            queueId={q.id}
                            downloadRate={currentDl}
                            uploadRate={currentUl}
                            maxLimitStr={q.max_limit}
                            height={28}
                            unitMode={unitMode}
                            compact={true}
                            showBadges={false}
                          />
                        </div>
                      </td>

                      {/* Usage progress bar */}
                      <td className="py-2 px-3 min-w-[90px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
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

                      {/* Action */}
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(q)}
                          className="p-1 rounded-m3-md hover:bg-m3-surface-container-highest text-m3-primary transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                          title="Ubah Batasan Max Limit / Target Queue"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================== CARD VIEW WITH SPARKLINE ================== */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-0.5">
          {filteredQueues.map((q, idx) => {
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
                className="p-3.5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/20 hover:border-m3-outline-variant/50 transition-colors space-y-2.5 shadow-2xs"
              >
                {/* Row 1: Name & Subnet Target */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="font-bold text-xs sm:text-sm text-m3-on-surface flex items-center gap-1.5 truncate">
                    <span className="text-m3-on-surface-variant font-mono text-[11px] font-semibold">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="truncate">{q.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-m3-on-surface-variant bg-m3-surface-container-highest px-2 py-0.5 rounded-full border border-m3-outline-variant/30">
                      {q.target}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(q)}
                      className="p-1 rounded-m3-md hover:bg-m3-surface-container-highest text-m3-primary transition-colors"
                      title="Edit Queue"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Live Bitrate Values (Clear & Uncramped) */}
                <div className="flex items-center justify-between gap-2 text-xs font-mono pt-0.5">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Rx: {formatThroughput(currentDl, unitMode)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Tx: {formatThroughput(currentUl, unitMode)}</span>
                  </div>
                </div>

                {/* Real-time Waveform Graph */}
                <div className="pt-0.5">
                  <QueueTrafficSparkline
                    queueId={q.id}
                    downloadRate={currentDl}
                    uploadRate={currentUl}
                    maxLimitStr={q.max_limit}
                    height={44}
                    unitMode={unitMode}
                    showLegend={true}
                    showBadges={false}
                  />
                </div>

                {/* Progress Bar Container */}
                <div className="h-1.5 w-full rounded-full bg-m3-surface-container-highest overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>

                {/* Row 3: Congestion / Dropped Status */}
                <div className="flex items-center justify-between text-[10px] font-mono text-m3-on-surface-variant pt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-m3-on-surface-variant">Limit Kuota:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-300">{q.max_limit}</span>
                  </div>

                  <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {usagePercent}% Utilisasi
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog: Tambah Simple Queue Manual */}
      <M3Dialog
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Simple Queue MikroTik"
      >
        <form onSubmit={handleCreateQueue} className="space-y-4 pt-2">
          <M3TextField
            label="Nama Antrean / Queue Name"
            placeholder="contoh: WiFi-Tamu / Staff-LAN"
            value={queueName}
            onChange={(e) => setQueueName(e.target.value)}
          />

          <M3TextField
            label="Target (IP Address / Subnet / Interface)"
            placeholder="contoh: 192.168.10.0/24 atau bridge-Local"
            value={queueTarget}
            onChange={(e) => setQueueTarget(e.target.value)}
          />

          <div className="space-y-1.5">
            <M3TextField
              label="Max Limit (Upload/Download)"
              placeholder="contoh: 40M/40M atau 120M/120M"
              value={queueMaxLimit}
              onChange={(e) => setQueueMaxLimit(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-1 pt-1">
              <span className="text-[10px] text-m3-on-surface-variant font-mono mr-1">Preset:</span>
              {limitPresets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQueueMaxLimit(preset)}
                  className="px-2 py-0.5 rounded-md bg-m3-surface-container-high hover:bg-m3-primary hover:text-m3-on-primary text-[10px] font-mono font-bold transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-m3-outline-variant/30">
            <M3Button
              type="button"
              variant="outlined"
              onClick={() => setAddModalOpen(false)}
            >
              Batal
            </M3Button>
            <M3Button
              type="submit"
              variant="filled"
              disabled={!queueName.trim()}
            >
              Simpan Queue
            </M3Button>
          </div>
        </form>
      </M3Dialog>

      {/* Dialog: Edit Simple Queue */}
      {editingQueue && (
        <M3Dialog
          isOpen={!!editingQueue}
          onClose={() => setEditingQueue(null)}
          title={`Konfigurasi Queue: ${editingQueue.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <M3TextField
              label="Nama Antrean / Queue Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <M3TextField
              label="Target Subnet / Interface"
              value={editTarget}
              onChange={(e) => setEditTarget(e.target.value)}
            />

            <div className="space-y-1.5">
              <M3TextField
                label="Max Limit (Upload/Download)"
                value={editMaxLimit}
                onChange={(e) => setEditMaxLimit(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-m3-on-surface-variant font-mono mr-1">Pilihan Cepat:</span>
                {limitPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditMaxLimit(preset)}
                    className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-colors ${
                      editMaxLimit === preset
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-m3-outline-variant/30">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus antrean ${editingQueue.name}?`)) {
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
  );
};

