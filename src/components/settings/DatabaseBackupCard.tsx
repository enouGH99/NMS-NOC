'use client';

import React, { useState, useEffect } from 'react';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { Database, Download, Trash2, RefreshCw, HardDrive, ShieldCheck, Clock, FileText, AlertCircle } from 'lucide-react';

interface BackupItem {
  fileName: string;
  filePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
}

export const DatabaseBackupCard: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      if (data.success && Array.isArray(data.backups)) {
        setBackups(data.backups);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    setMessage(null);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Backup berhasil dibuat.' });
        fetchBackups();
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal membuat backup.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal menjalankan backup: ${err.message}` });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDeleteBackup = async (fileName: string) => {
    if (!confirm(`Hapus file backup '${fileName}'?`)) return;
    try {
      const res = await fetch(`/api/backup?file=${encodeURIComponent(fileName)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBackups();
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Status Card */}
      <M3Card className="p-4 bg-m3-surface-container-low border border-m3-outline-variant/30 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-m3-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-m3-on-surface">Automated PostgreSQL Database Backup</h3>
              <p className="text-xs text-m3-on-surface-variant">
                Pencadangan database otomatis harian dan manajemen file snapshot pemulihan sistem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <M3Button
              variant="outlined"
              size="sm"
              onClick={fetchBackups}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Segarkan
            </M3Button>

            <M3Button
              variant="filled"
              size="sm"
              onClick={handleTriggerBackup}
              disabled={isBackingUp}
              className="text-xs font-bold"
            >
              <HardDrive className={`w-3.5 h-3.5 mr-1.5 ${isBackingUp ? 'animate-bounce' : ''}`} />
              {isBackingUp ? 'Memproses Dump...' : 'Backup Database Sekarang'}
            </M3Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20 flex items-center gap-3">
            <Clock className="w-4 h-4 text-m3-primary shrink-0" />
            <div className="text-xs">
              <div className="text-[10px] text-m3-on-surface-variant font-bold uppercase">Jadwal Cron Harian</div>
              <div className="font-mono font-bold text-m3-on-surface">02:00 WIB (0 2 * * *)</div>
            </div>
          </div>

          <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-xs">
              <div className="text-[10px] text-m3-on-surface-variant font-bold uppercase">Kebijakan Retensi</div>
              <div className="font-semibold text-m3-on-surface">Auto-Purge &gt; 14 Hari</div>
            </div>
          </div>

          <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20 flex items-center gap-3">
            <FileText className="w-4 h-4 text-sky-500 shrink-0" />
            <div className="text-xs">
              <div className="text-[10px] text-m3-on-surface-variant font-bold uppercase">Total File Tersimpan</div>
              <div className="font-bold text-m3-on-surface">{backups.length} Snapshot Backup</div>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-m3-xl text-xs font-medium flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}
      </M3Card>

      {/* Backups Table */}
      <M3Card className="p-0 bg-m3-surface-container-low border border-m3-outline-variant/30 overflow-hidden shadow-xs">
        <div className="p-3.5 bg-m3-surface-container/60 border-b border-m3-outline-variant/30 font-bold text-xs text-m3-on-surface flex items-center justify-between">
          <span>Riwayat File Backup Database</span>
          <span className="text-[10px] text-m3-on-surface-variant font-mono">./backups/postgres/</span>
        </div>

        <div className="overflow-x-auto">
          {backups.length === 0 ? (
            <div className="p-8 text-center text-xs text-m3-on-surface-variant">
              Belum ada file backup yang dibuat. Klik tombol <strong>&quot;Backup Database Sekarang&quot;</strong> untuk membuat salinan pertama.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-m3-outline-variant/20 bg-m3-surface-container-high/30 text-m3-on-surface-variant text-[11px] font-bold">
                  <th className="py-2.5 px-4">Nama File</th>
                  <th className="py-2.5 px-4">Ukuran</th>
                  <th className="py-2.5 px-4">Waktu Pembuatan</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/10">
                {backups.map((b) => (
                  <tr key={b.fileName} className="hover:bg-m3-surface-container-high/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-m3-on-surface flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-m3-primary shrink-0" />
                      {b.fileName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-m3-on-surface-variant font-medium">
                      {b.sizeFormatted}
                    </td>
                    <td className="py-2.5 px-4 text-m3-on-surface-variant text-[11px]">
                      {new Date(b.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1.5">
                      <a
                        href={b.filePath}
                        download={b.fileName}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-m3-lg bg-m3-primary/10 hover:bg-m3-primary/20 text-m3-primary font-bold text-[11px] transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Unduh
                      </a>

                      <button
                        onClick={() => handleDeleteBackup(b.fileName)}
                        className="p-1 rounded-m3-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Hapus Backup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </M3Card>

      {/* Linux Cronjob Setup Guide Box */}
      <div className="p-4 rounded-m3-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-xs space-y-2">
        <div className="text-zinc-400 font-sans text-xs font-bold flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Cara Setup Cronjob Backup Harian di Server Linux (VPS):</span>
        </div>
        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
          Buka crontab server dengan perintah <code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded">crontab -e</code> dan tambahkan baris berikut di baris paling bawah:
        </p>
        <pre className="p-2.5 rounded-m3-lg bg-zinc-900 text-emerald-400 text-[11px] overflow-x-auto">
          <code>0 2 * * * /bin/bash /path/ke/NMS-NOC/scripts/backup-database.sh &gt;&gt; /path/ke/NMS-NOC/backups/postgres/backup.log 2&gt;&amp;1</code>
        </pre>
      </div>
    </div>
  );
};
