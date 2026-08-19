'use client';

import React, { useState } from 'react';
import { RepairRecord, RepairStatus } from '@/lib/types';
import { useNms } from '@/lib/store';
import { M3Button } from '../m3/M3Button';
import { M3Chip } from '../m3/M3Chip';
import {
  Wrench,
  Search,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Edit2,
  LayoutGrid,
  List,
  User,
} from 'lucide-react';
import { formatDate, downloadCsv } from '@/lib/utils';

interface RepairTableProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (record: RepairRecord) => void;
}

export const RepairTable: React.FC<RepairTableProps> = ({
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const { repairRecords } = useNms();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  const filteredRecords = repairRecords.filter((rec) => {
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = rec.ticket_code.toLowerCase().includes(q);
      const matchDev = rec.device_name.toLowerCase().includes(q);
      const matchProb = rec.problem.toLowerCase().includes(q);
      const matchUser = rec.user_name.toLowerCase().includes(q);
      if (!matchCode && !matchDev && !matchProb && !matchUser) return false;
    }

    return true;
  });

  const handleExportCsv = () => {
    const rows = filteredRecords.map((r) => ({
      Kode_Tiket: r.ticket_code,
      Perangkat: r.device_name,
      IP_Address: r.ip_address,
      Petugas: r.user_name,
      Masalah: r.problem,
      Tindakan: r.action,
      Hasil: r.result,
      Status: r.status,
      Waktu_Dibuat: formatDate(r.created_at),
    }));
    downloadCsv(`riwayat-perbaikan-${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-m3-surface-container-low p-4 rounded-m3-3xl border border-m3-outline-variant/30">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-m3-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor tiket, perangkat, gejala masalah..."
            className="w-full h-11 pl-10 pr-4 rounded-m3-full bg-m3-surface-container-lowest text-xs sm:text-sm text-m3-on-surface border border-m3-outline-variant/40 outline-none focus:ring-2 focus:ring-m3-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          {/* View Mode Toggle */}
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
            Catat Perbaikan
          </M3Button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 p-3 rounded-m3-2xl bg-m3-surface-container/50 border border-m3-outline-variant/30">
        <span className="text-xs font-bold text-m3-on-surface-variant mr-1">Status:</span>
        {[
          { id: 'all', label: 'Semua Status' },
          { id: 'berjalan', label: 'Sedang Berjalan' },
          { id: 'selesai', label: 'Telah Selesai' },
        ].map((st) => (
          <M3Chip
            key={st.id}
            selected={statusFilter === st.id}
            onClick={() => setStatusFilter(st.id)}
          >
            {st.label}
          </M3Chip>
        ))}
      </div>

      {/* Empty State */}
      {filteredRecords.length === 0 && (
        <div className="rounded-m3-3xl bg-m3-surface-container border border-m3-outline-variant/30 p-12 text-center text-m3-on-surface-variant">
          <Wrench className="w-10 h-10 mx-auto text-m3-outline mb-2 opacity-50" />
          <p className="font-semibold text-sm">Tidak ada catatan perbaikan yang cocok</p>
        </div>
      )}

      {/* 1. MOBILE RESPONSIVE CARDS VIEW */}
      {filteredRecords.length > 0 && (
        <div
          className={`space-y-3 ${
            viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block md:hidden'
          }`}
        >
          {filteredRecords.map((rec) => {
            const isCompleted = rec.status === 'selesai';
            return (
              <div
                key={rec.id}
                className="p-4 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-3 shadow-xs hover:border-m3-outline-variant/60 transition-colors"
              >
                {/* Card Top: Ticket Code + Status + Date */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-extrabold text-xs text-m3-primary block">
                      {rec.ticket_code}
                    </span>
                    <h4 className="font-bold text-sm text-m3-on-surface mt-0.5">
                      {rec.device_name}
                    </h4>
                    <span className="font-mono text-[10px] text-m3-on-surface-variant">
                      {rec.ip_address}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {isCompleted ? 'Selesai' : 'Berjalan'}
                  </span>
                </div>

                {/* Problem & Action Details */}
                <div className="p-3 rounded-m3-xl bg-m3-surface-container-lowest text-xs space-y-1.5 border border-m3-outline-variant/20">
                  <p className="text-m3-on-surface leading-relaxed">
                    <strong className="text-m3-on-surface-variant font-semibold">Gejala:</strong> {rec.problem}
                  </p>
                  <p className="text-m3-on-surface leading-relaxed">
                    <strong className="text-m3-on-surface-variant font-semibold">Tindakan:</strong> {rec.action}
                  </p>
                  <p className="text-m3-on-surface leading-relaxed">
                    <strong className="text-m3-on-surface-variant font-semibold">Hasil:</strong> {rec.result}
                  </p>
                </div>

                {/* Photos & Technician Footer */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-m3-on-surface-variant font-medium">
                      <User className="w-3.5 h-3.5 text-m3-primary" />
                      <span>{rec.user_name}</span>
                    </div>

                    {rec.photo_urls && rec.photo_urls.length > 0 && (
                      <div className="flex items-center gap-1 ml-2">
                        {rec.photo_urls.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActivePhoto(url)}
                            className="w-7 h-7 rounded-m3-sm overflow-hidden border border-m3-outline-variant hover:scale-110 transition-transform"
                          >
                            <img src={url} alt="Foto" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-m3-on-surface-variant font-mono">
                      {formatDate(rec.created_at)}
                    </span>
                    <button
                      onClick={() => onOpenEditModal(rec)}
                      title="Ubah Catatan"
                      className="p-1.5 rounded-full hover:bg-m3-surface-container-highest text-m3-on-surface-variant hover:text-m3-primary transition-colors ml-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. DESKTOP FULL TABLE VIEW */}
      {filteredRecords.length > 0 && (
        <div
          className={`rounded-m3-3xl bg-m3-surface-container border border-m3-outline-variant/30 overflow-hidden shadow-xs ${
            viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-m3-on-surface min-w-[760px]">
              <thead className="bg-m3-surface-container-high text-m3-on-surface-variant uppercase font-bold text-[11px] tracking-wider border-b border-m3-outline-variant/30">
                <tr>
                  <th className="py-3.5 px-4">Tiket & Tanggal</th>
                  <th className="py-3.5 px-4">Perangkat</th>
                  <th className="py-3.5 px-4">Gejala & Masalah</th>
                  <th className="py-3.5 px-4">Tindakan & Hasil</th>
                  <th className="py-3.5 px-4">Petugas</th>
                  <th className="py-3.5 px-4">Lampiran Foto</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/20">
                {filteredRecords.map((rec) => {
                  const isCompleted = rec.status === 'selesai';
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-m3-surface-container-high/60 transition-colors"
                    >
                      {/* Ticket Code & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-xs text-m3-primary">
                          {rec.ticket_code}
                        </div>
                        <div className="text-[10px] text-m3-on-surface-variant mt-0.5">
                          {formatDate(rec.created_at)}
                        </div>
                      </td>

                      {/* Device */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-xs text-m3-on-surface">
                          {rec.device_name}
                        </div>
                        <div className="font-mono text-[10px] text-m3-on-surface-variant">
                          {rec.ip_address}
                        </div>
                      </td>

                      {/* Problem */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-m3-on-surface leading-relaxed line-clamp-2">
                          {rec.problem}
                        </p>
                      </td>

                      {/* Action & Result */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-m3-on-surface leading-relaxed line-clamp-1">
                          <strong className="text-m3-on-surface-variant">Aksi:</strong> {rec.action}
                        </p>
                        <p className="text-xs text-m3-on-surface leading-relaxed line-clamp-1 mt-0.5">
                          <strong className="text-m3-on-surface-variant">Hasil:</strong> {rec.result}
                        </p>
                      </td>

                      {/* Technician */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-xs text-m3-on-surface">
                          {rec.user_name}
                        </div>
                      </td>

                      {/* Photos */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.photo_urls && rec.photo_urls.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {rec.photo_urls.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setActivePhoto(url)}
                                className="w-8 h-8 rounded-m3-md overflow-hidden border border-m3-outline-variant hover:scale-110 transition-transform cursor-pointer"
                              >
                                <img src={url} alt="Foto" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-m3-on-surface-variant italic">
                            Tanpa Foto
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {isCompleted ? 'Selesai' : 'Berjalan'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onOpenEditModal(rec)}
                          title="Ubah Catatan"
                          className="p-2 rounded-full hover:bg-m3-surface-container-highest text-m3-on-surface-variant hover:text-m3-primary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Photo Modal Viewer */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setActivePhoto(null)}
          />
          <div className="relative max-w-3xl max-h-[85vh] rounded-m3-3xl overflow-hidden shadow-m3-5 border border-m3-outline-variant z-10">
            <img src={activePhoto} alt="Bukti Perbaikan Full" className="w-full h-full object-contain" />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
