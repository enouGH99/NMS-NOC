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
  GitFork,
  Tag,
  ShieldAlert,
  Layers,
  CornerDownRight,
} from 'lucide-react';
import { formatThroughput, buildQueueHierarchy } from '@/lib/utils';

type ThroughputUnitMode = 'auto' | 'mbps' | 'kbps' | 'bps';

export const QueueTrafficChart: React.FC = () => {
  const { queues, syncQueues, addQueue, updateQueue, deleteQueue, devices } = useNms();
  const [isSyncing, setIsSyncing] = useState(false);
  const [unitMode, setUnitMode] = useState<ThroughputUnitMode>('auto');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Queue Tree Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [queueName, setQueueName] = useState('');
  const [queueParent, setQueueParent] = useState('TOTAL-INTERNET');
  const [queuePacketMark, setQueuePacketMark] = useState('packet-dev');
  const [queueMaxLimit, setQueueMaxLimit] = useState('40M');
  const [queueLimitAt, setQueueLimitAt] = useState('15M');
  const [queuePriority, setQueuePriority] = useState(8);
  const [queueType, setQueueType] = useState('pcq-download-default');

  // Edit Queue Tree Modal
  const [editingQueue, setEditingQueue] = useState<QueueTraffic | null>(null);
  const [editName, setEditName] = useState('');
  const [editParent, setEditParent] = useState('');
  const [editPacketMark, setEditPacketMark] = useState('');
  const [editMaxLimit, setEditMaxLimit] = useState('');
  const [editLimitAt, setEditLimitAt] = useState('');
  const [editPriority, setEditPriority] = useState(8);
  const [editQueueType, setEditQueueType] = useState('pcq-download-default');

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
      parent: queueParent.trim() || 'global',
      packet_mark: queuePacketMark.trim() || 'no-mark',
      target: queueParent.trim() || 'global',
      max_limit: queueMaxLimit.trim() || '40M',
      limit_at: queueLimitAt.trim() || '10M',
      priority: Number(queuePriority) || 8,
      queue_type: queueType || 'pcq-download-default',
      device_id: devices[0]?.id,
    });

    setQueueName('');
    setAddModalOpen(false);
  };

  const handleOpenEdit = (q: QueueTraffic) => {
    setEditingQueue(q);
    setEditName(q.name);
    setEditParent(q.parent || 'global');
    setEditPacketMark(q.packet_mark || 'no-mark');
    setEditMaxLimit(q.max_limit || '40M');
    setEditLimitAt(q.limit_at || '10M');
    setEditPriority(q.priority || 8);
    setEditQueueType(q.queue_type || 'pcq-download-default');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQueue) return;

    updateQueue(editingQueue.id, {
      name: editName.trim() || editingQueue.name,
      parent: editParent.trim() || editingQueue.parent || 'global',
      packet_mark: editPacketMark.trim() || editingQueue.packet_mark || 'no-mark',
      max_limit: editMaxLimit.trim() || editingQueue.max_limit,
      limit_at: editLimitAt.trim() || editingQueue.limit_at || '10M',
      priority: Number(editPriority) || 8,
      queue_type: editQueueType || editingQueue.queue_type || 'pcq-download-default',
    });

    setEditingQueue(null);
  };

  // Build hierarchical multi-level queue tree
  const hierarchicalQueues = buildQueueHierarchy(queues);

  // Filter queues by search query (matches name, parent, packet_mark)
  const filteredQueues = hierarchicalQueues.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.name.toLowerCase().includes(query) ||
      (q.parent || '').toLowerCase().includes(query) ||
      (q.packet_mark || '').toLowerCase().includes(query) ||
      q.target.toLowerCase().includes(query) ||
      q.max_limit.toLowerCase().includes(query)
    );
  });

  const limitPresets = ['120M', '60M', '50M', '40M', '30M', '25M', '20M', '10M'];
  const limitAtPresets = ['120M', '60M', '30M', '25M', '20M', '15M', '10M', '5M', '2M'];
  const packetMarkPresets = ['no-mark', 'packet-server-cctv', 'packet-dev', 'packet-vip', 'packet-kantor'];

  // Available parent queue names for selection
  const parentOptions = Array.from(
    new Set(['global', ...queues.map(q => q.name)])
  );

  // Summary stats
  const totalAllocatedMbps = queues.filter(q => !q.parent || q.parent === 'global').reduce((acc, q) => {
    const val = parseInt(String(q.max_limit).replace(/[^0-9]/g, ''), 10) || 0;
    return acc + val;
  }, 0) || 120;
  const totalDrops = queues.reduce((acc, q) => acc + (q.dropped || 0), 0);
  const activeMarksCount = Array.from(new Set(queues.map(q => q.packet_mark).filter(m => m && m !== 'no-mark'))).length;

  return (
    <M3Card className="p-4 sm:p-5 flex flex-col h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-m3-xl bg-m3-secondary-container text-m3-on-secondary-container shrink-0">
            <GitFork className="w-5 h-5 text-m3-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-m3-on-surface tracking-tight truncate">
                Manajemen Bandwidth Queue Tree
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-surface-container-highest text-m3-primary font-mono font-bold border border-m3-outline-variant/30 shrink-0">
                {queues.length} Node Antrean
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-m3-on-surface-variant truncate">
              Pohon hierarki bandwidth, Packet Mark Mangle, & alokasi CIR/MIR MikroTik
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
              title="Tampilan Tabel Hierarki"
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
            title="Segarkan data Queue Tree langsung dari MikroTik (SNMP)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-m3-full bg-m3-surface-container-highest hover:bg-m3-surface-container-highest/80 text-m3-on-surface text-xs font-bold transition-colors border border-m3-outline-variant/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-m3-primary' : ''}`} />
            <span className="hidden sm:inline">Segarkan (SNMP)</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            title="Tambah Queue Tree Baru"
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
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" />
          <input
            type="text"
            placeholder="Cari queue, parent, mark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs text-m3-on-surface focus:outline-hidden focus:border-m3-primary font-mono placeholder:font-sans"
          />
        </div>
      </div>

      {/* Quick Summary Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30">
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold text-m3-on-surface-variant flex items-center gap-1 font-mono uppercase">
            <Gauge className="w-3 h-3 text-m3-primary" />
            Alokasi Total MIR
          </div>
          <div className="text-base font-extrabold font-mono text-m3-on-surface">
            {totalAllocatedMbps} Mbps
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] font-bold text-m3-on-surface-variant flex items-center gap-1 font-mono uppercase">
            <GitFork className="w-3 h-3 text-cyan-500" />
            Total Node Tree
          </div>
          <div className="text-base font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
            {queues.length} Antrean
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] font-bold text-m3-on-surface-variant flex items-center gap-1 font-mono uppercase">
            <Tag className="w-3 h-3 text-purple-500" />
            Packet Mark Mangle
          </div>
          <div className="text-base font-extrabold font-mono text-purple-600 dark:text-purple-400">
            {activeMarksCount} Rule Aktif
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] font-bold text-m3-on-surface-variant flex items-center gap-1 font-mono uppercase">
            <ShieldAlert className="w-3 h-3 text-rose-500" />
            Total Packet Drop
          </div>
          <div className={`text-base font-extrabold font-mono ${totalDrops > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {totalDrops.toLocaleString()} drop
          </div>
        </div>
      </div>

      {/* Content Area */}
      {filteredQueues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-m3-on-surface-variant">
          <GitFork className="w-8 h-8 text-m3-primary/40 mx-auto mb-2" />
          <p className="text-xs font-bold text-m3-on-surface mb-1">
            {queues.length === 0 ? 'Belum ada Queue Tree terbaca' : 'Tidak ada antrean yang cocok'}
          </p>
          <p className="text-[11px] text-m3-on-surface-variant max-w-xs mb-3">
            {queues.length === 0
              ? 'Klik tombol Segarkan untuk memuat antrean Queue Tree langsung dari router MikroTik.'
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
        /* ================== QUEUE TREE HIERARCHY TABLE VIEW ================== */
        <div className="rounded-m3-2xl border border-m3-outline-variant/30 overflow-hidden bg-m3-surface-container-lowest">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[860px]">
              <thead className="bg-m3-surface-container-high text-m3-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Nama Antrean (Queue Tree)</th>
                  <th className="py-2.5 px-3">Induk (Parent)</th>
                  <th className="py-2.5 px-3">Packet Mark (Mangle)</th>
                  <th className="py-2.5 px-3">Limit (Max / CIR)</th>
                  <th className="py-2.5 px-3">Trafik Tx / Rx</th>
                  <th className="py-2.5 px-3 w-44">Grafik Live</th>
                  <th className="py-2.5 px-3">Utilisasi</th>
                  <th className="py-2.5 px-3 text-center">Status / Drop</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/20">
                {filteredQueues.map((q, idx) => {
                  const maxNum = parseInt(String(q.max_limit).replace(/[^0-9]/g, ''), 10) || 40;
                  const currentDl = q.current_rate.download;
                  const currentUl = q.current_rate.upload;
                  const activeRate = currentDl > 0 ? currentDl : currentUl;
                  const usagePercent = Math.min(100, Math.round((activeRate / maxNum) * 100));

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
                      <td className="py-2.5 px-3 text-center font-mono text-m3-on-surface-variant text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded-sm font-mono text-[10px] ${
                          q.depth === 0 ? 'bg-m3-primary/15 text-m3-primary font-bold' : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                        }`}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Name & Tree Indent */}
                      <td className="py-2.5 px-3 font-bold font-mono text-m3-on-surface">
                        <div className="flex items-center gap-1.5" style={{ paddingLeft: `${q.depth * 16}px` }}>
                          {q.depth === 0 ? (
                            <Layers className="w-4 h-4 text-m3-primary shrink-0" />
                          ) : q.depth === 1 ? (
                            <CornerDownRight className="w-3.5 h-3.5 text-m3-primary/70 shrink-0" />
                          ) : (
                            <CornerDownRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[180px]">{q.name}</span>
                          {q.priority && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-m3-surface-container-highest text-m3-on-surface-variant border border-m3-outline-variant/30 font-mono">
                              P:{q.priority}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Parent */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                          q.parent === 'global' || !q.parent || q.parent === 'none'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20'
                            : 'bg-m3-surface-container-highest text-m3-on-surface-variant border-m3-outline-variant/30'
                        }`}>
                          {q.parent || 'global'}
                        </span>
                      </td>

                      {/* Packet Mark */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {q.packet_mark && q.packet_mark !== 'no-mark' ? (
                          <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/20 text-[10px] font-bold">
                            <Tag className="w-2.5 h-2.5" />
                            {q.packet_mark}
                          </span>
                        ) : (
                          <span className="text-m3-on-surface-variant/60 text-[10px] italic">no-mark</span>
                        )}
                      </td>

                      {/* Max Limit & Limit At (CIR) */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
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

                      {/* Current Rate */}
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {currentDl > 0 ? (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{formatThroughput(currentDl, unitMode)}</span>
                          </div>
                        ) : currentUl > 0 ? (
                          <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                            <ArrowUpRight className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>{formatThroughput(currentUl, unitMode)}</span>
                          </div>
                        ) : (
                          <span className="text-m3-on-surface-variant text-[11px]">0 Mbps</span>
                        )}
                      </td>

                      {/* Realtime Waveform Sparkline */}
                      <td className="py-2.5 px-3 w-44">
                        <div className="w-40">
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
                      <td className="py-2.5 px-3 min-w-[85px]">
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

                      {/* Status / Drop */}
                      <td className="py-2.5 px-3 text-center">
                        {q.dropped > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">
                            <ShieldAlert className="w-3 h-3" />
                            {q.dropped.toLocaleString()} drop
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Lancar
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(q)}
                          className="p-1 rounded-m3-md hover:bg-m3-surface-container-highest text-m3-primary transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                          title="Ubah Konfigurasi Queue Tree"
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
            const maxNum = parseInt(String(q.max_limit).replace(/[^0-9]/g, ''), 10) || 40;
            const currentDl = q.current_rate.download;
            const currentUl = q.current_rate.upload;
            const activeRate = currentDl > 0 ? currentDl : currentUl;
            const usagePercent = Math.min(100, Math.round((activeRate / maxNum) * 100));
            const isChild = q.parent && q.parent !== 'global';

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
                {/* Row 1: Name, Parent & Packet Mark */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="font-bold text-xs sm:text-sm text-m3-on-surface flex items-center gap-1.5 truncate">
                    <span className="text-m3-on-surface-variant font-mono text-[11px] font-semibold">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="truncate">{q.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-m3-on-surface-variant bg-m3-surface-container-highest px-2 py-0.5 rounded-full border border-m3-outline-variant/30">
                      Parent: {q.parent || 'global'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(q)}
                      className="p-1 rounded-m3-md hover:bg-m3-surface-container-highest text-m3-primary transition-colors"
                      title="Edit Queue Tree"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Packet Mark & Queue Type Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  {q.packet_mark && q.packet_mark !== 'no-mark' && (
                    <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      <Tag className="w-2.5 h-2.5" />
                      Mark: {q.packet_mark}
                    </span>
                  )}
                  {q.priority && (
                    <span className="bg-m3-surface-container-highest text-m3-on-surface-variant px-1.5 py-0.5 rounded-md border border-m3-outline-variant/30">
                      Priority: {q.priority}
                    </span>
                  )}
                  {q.queue_type && (
                    <span className="bg-m3-surface-container-highest text-m3-on-surface-variant px-1.5 py-0.5 rounded-md border border-m3-outline-variant/30">
                      {q.queue_type}
                    </span>
                  )}
                </div>

                {/* Row 2: Live Bitrate Values */}
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

                {/* Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-m3-surface-container-highest overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>

                {/* Row 3: Limits & Usage */}
                <div className="flex items-center justify-between text-[10px] font-mono text-m3-on-surface-variant pt-0.5">
                  <div className="flex items-center gap-2">
                    <span>Max: <strong className="text-amber-600 dark:text-amber-300">{q.max_limit}</strong></span>
                    {q.limit_at && <span>CIR: <strong>{q.limit_at}</strong></span>}
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

      {/* Dialog: Tambah Queue Tree Manual */}
      <M3Dialog
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah MikroTik Queue Tree"
      >
        <form onSubmit={handleCreateQueue} className="space-y-4 pt-2">
          <M3TextField
            label="Nama Antrean / Queue Name"
            placeholder="contoh: DEV-Download atau Staff-Upload"
            value={queueName}
            onChange={(e) => setQueueName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-m3-on-surface-variant block mb-1">
                Induk Antrean (Parent)
              </label>
              <input
                type="text"
                list="parent-suggestions"
                value={queueParent}
                onChange={(e) => setQueueParent(e.target.value)}
                placeholder="global / Total-Download"
                className="w-full px-3 py-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
              />
              <datalist id="parent-suggestions">
                {parentOptions.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-[11px] font-bold text-m3-on-surface-variant block mb-1">
                Packet Mark (Firewall Mangle Flow)
              </label>
              <input
                type="text"
                value={queuePacketMark}
                onChange={(e) => setQueuePacketMark(e.target.value)}
                placeholder="contoh: dev-in_pkt / no-mark"
                className="w-full px-3 py-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
              />
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {packetMarkPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQueuePacketMark(preset)}
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold transition-colors ${
                      queuePacketMark === preset
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <M3TextField
                label="Max Limit / MIR (Maksimum Bandwidth)"
                placeholder="contoh: 40M atau 120M"
                value={queueMaxLimit}
                onChange={(e) => setQueueMaxLimit(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {limitPresets.slice(0, 5).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQueueMaxLimit(preset)}
                    className="px-1.5 py-0.5 rounded-md bg-m3-surface-container-high hover:bg-m3-primary hover:text-m3-on-primary text-[10px] font-mono font-bold transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <M3TextField
                label="Limit At / CIR (Jaminan Minimum)"
                placeholder="contoh: 15M atau 10M"
                value={queueLimitAt}
                onChange={(e) => setQueueLimitAt(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {limitAtPresets.slice(0, 5).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQueueLimitAt(preset)}
                    className="px-1.5 py-0.5 rounded-md bg-m3-surface-container-high hover:bg-m3-primary hover:text-m3-on-primary text-[10px] font-mono font-bold transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-m3-on-surface-variant block mb-1">
                Prioritas (Priority 1-8)
              </label>
              <select
                value={queuePriority}
                onChange={(e) => setQueuePriority(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                  <option key={p} value={p}>
                    Prioritas {p} {p === 1 ? '(Tertinggi / Core)' : p === 8 ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-m3-on-surface-variant block mb-1">
                Queue Type
              </label>
              <select
                value={queueType}
                onChange={(e) => setQueueType(e.target.value)}
                className="w-full px-3 py-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
              >
                <option value="pcq-download-default">pcq-download-default</option>
                <option value="pcq-upload-default">pcq-upload-default</option>
                <option value="default">default</option>
                <option value="default-small">default-small</option>
                <option value="ethernet-default">ethernet-default</option>
              </select>
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
              Simpan Queue Tree
            </M3Button>
          </div>
        </form>
      </M3Dialog>

      {/* Dialog: Edit Queue Tree */}
      {editingQueue && (
        <M3Dialog
          isOpen={!!editingQueue}
          onClose={() => setEditingQueue(null)}
          title={`Konfigurasi Queue Tree: ${editingQueue.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <M3TextField
              label="Nama Antrean / Queue Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-m3-on-surface-variant block mb-1">
                  Induk Antrean (Parent)
                </label>
                <input
                  type="text"
                  list="edit-parent-suggestions"
                  value={editParent}
                  onChange={(e) => setEditParent(e.target.value)}
                  className="w-full px-3 py-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
                />
                <datalist id="edit-parent-suggestions">
                  {parentOptions.map(p => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-bold text-m3-on-surface-variant block mb-1">
                  Packet Mark (Flow Mangle)
                </label>
                <input
                  type="text"
                  value={editPacketMark}
                  onChange={(e) => setEditPacketMark(e.target.value)}
                  className="w-full px-3 py-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
                />
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {packetMarkPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditPacketMark(preset)}
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold transition-colors ${
                        editPacketMark === preset
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <M3TextField
                  label="Max Limit / MIR"
                  value={editMaxLimit}
                  onChange={(e) => setEditMaxLimit(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {limitPresets.slice(0, 4).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditMaxLimit(preset)}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors ${
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

              <div className="space-y-1.5">
                <M3TextField
                  label="Limit At / CIR"
                  value={editLimitAt}
                  onChange={(e) => setEditLimitAt(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {limitAtPresets.slice(0, 4).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditLimitAt(preset)}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors ${
                        editLimitAt === preset
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-m3-on-surface-variant block mb-1">
                  Prioritas (Priority)
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                    <option key={p} value={p}>
                      Prioritas {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-m3-on-surface-variant block mb-1">
                  Queue Type
                </label>
                <select
                  value={editQueueType}
                  onChange={(e) => setEditQueueType(e.target.value)}
                  className="w-full px-3 py-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:border-m3-primary"
                >
                  <option value="pcq-download-default">pcq-download-default</option>
                  <option value="pcq-upload-default">pcq-upload-default</option>
                  <option value="default">default</option>
                  <option value="default-small">default-small</option>
                  <option value="ethernet-default">ethernet-default</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-m3-outline-variant/30">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus Queue Tree ${editingQueue.name}?`)) {
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

