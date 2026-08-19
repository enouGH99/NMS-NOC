'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import { M3Dialog } from '../m3/M3Dialog';
import { M3TextField } from '../m3/M3TextField';
import { SlidersHorizontal, AlertCircle, ArrowDown, ArrowUp, RefreshCw, Plus } from 'lucide-react';
import { formatMbps } from '@/lib/utils';

export const QueueTrafficChart: React.FC = () => {
  const { queues, syncQueues, addQueue, devices } = useNms();
  const [isSyncing, setIsSyncing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [queueName, setQueueName] = useState('');
  const [queueTarget, setQueueTarget] = useState('192.168.10.0/24');
  const [queueMaxLimit, setQueueMaxLimit] = useState('20M/20M');

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncQueues();
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
      max_limit: queueMaxLimit.trim() || '20M/20M',
      device_id: devices[0]?.id,
    });

    setQueueName('');
    setAddModalOpen(false);
  };

  return (
    <M3Card className="p-5 flex flex-col h-full border border-m3-outline-variant/30 bg-m3-surface-container-low shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-m3-xl bg-m3-secondary-container text-m3-on-secondary-container shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-m3-on-surface tracking-tight">
              Manajemen Bandwidth Simple Queue
            </h3>
            <p className="text-xs text-m3-on-surface-variant">
              Utilisasi & batasan trafik per divisi / subnet MikroTik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            title="Sinkronkan Simple Queue dari MikroTik"
            className="p-2 rounded-m3-full bg-m3-surface-container-highest hover:bg-m3-surface-container-highest/80 text-m3-on-surface transition-colors border border-m3-outline-variant/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-m3-primary' : ''}`} />
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            title="Tambah Simple Queue"
            className="flex items-center gap-1 px-2.5 py-1 rounded-m3-full bg-m3-primary/15 hover:bg-m3-primary/25 text-m3-primary text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>

          <span className="text-[11px] px-2.5 py-1 rounded-m3-full bg-m3-surface-container-highest text-m3-on-surface font-bold shrink-0 border border-m3-outline-variant/30">
            {queues.length} Queues
          </span>
        </div>
      </div>

      {/* Queue Cards List */}
      <div className="pt-3.5 space-y-3 flex-1 overflow-y-auto pr-1">
        {queues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-m3-on-surface-variant">
            <SlidersHorizontal className="w-8 h-8 text-m3-primary/40 mx-auto mb-2" />
            <p className="text-xs font-bold text-m3-on-surface mb-1">Belum ada Simple Queue terbaca</p>
            <p className="text-[11px] text-m3-on-surface-variant max-w-xs mb-3">
              Klik tombol sinkronkan untuk memuat antrean bandwidth dari router MikroTik Anda.
            </p>
            <div className="flex items-center gap-2">
              <M3Button size="sm" variant="filled" onClick={handleSync} icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}>
                Sinkronkan dari MikroTik
              </M3Button>
              <M3Button size="sm" variant="outlined" onClick={() => setAddModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                + Tambah Manual
              </M3Button>
            </div>
          </div>
        ) : (
          queues.map((q, idx) => {
            // Parse max download limit (e.g. 100M from "100M/100M")
          const maxNum = parseInt(q.max_limit.split('/')[1] || '100', 10);
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
                <div className="font-bold text-xs sm:text-sm text-m3-on-surface flex items-center gap-1.5">
                  <span className="text-m3-on-surface-variant font-mono text-[11px] font-semibold">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span>{q.name}</span>
                </div>

                <span className="font-mono text-[10px] text-m3-on-surface-variant bg-m3-surface-container-highest px-2 py-0.5 rounded-full border border-m3-outline-variant/30">
                  {q.target}
                </span>
              </div>

              {/* Row 2: Bandwidth Speed & Percentage Badge */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>{formatMbps(currentDl)}</span>
                  </div>
                  <span className="text-m3-on-surface-variant text-[11px]">
                    / maks {q.max_limit}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                >
                  {usagePercent}% Utilisasi
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="h-2 w-full rounded-full bg-m3-surface-container-highest overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              {/* Row 3: Upload Rate & Congestion status */}
              <div className="flex items-center justify-between text-[10px] font-mono text-m3-on-surface-variant pt-0.5">
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-sky-500" />
                  <span>Upload: {formatMbps(currentUl)}</span>
                </div>

                {q.dropped > 0 ? (
                  <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold font-sans">
                    <AlertCircle className="w-3 h-3" />
                    <span>{q.dropped} packet drops</span>
                  </div>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                    Antrean Lancar (0 drop)
                  </span>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>

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
            placeholder="contoh: 192.168.10.0/24 atau wlan1"
            value={queueTarget}
            onChange={(e) => setQueueTarget(e.target.value)}
          />

          <M3TextField
            label="Max Limit (Upload/Download)"
            placeholder="contoh: 20M/20M atau 100M/100M"
            value={queueMaxLimit}
            onChange={(e) => setQueueMaxLimit(e.target.value)}
          />

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
    </M3Card>
  );
};
