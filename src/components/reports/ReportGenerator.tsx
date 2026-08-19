'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import { M3SegmentedButton } from '../m3/M3SegmentedButton';
import {
  FileBarChart,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatDate, downloadCsv } from '@/lib/utils';

export const ReportGenerator: React.FC = () => {
  const { devices, alerts, repairRecords, liveStats } = useNms();
  const [period, setPeriod] = useState<string>('harian');

  const completedRepairs = repairRecords.filter((r) => r.status === 'selesai');

  const handlePrint = () => {
    window.print();
  };

  const handleExportSummaryCsv = () => {
    const rows = [
      { Indikator: 'Total Perangkat', Nilai: liveStats.totalDevices },
      { Indikator: 'Perangkat Sehat (Online)', Nilai: liveStats.onlineCount },
      { Indikator: 'Perangkat Bermasalah (Warning)', Nilai: liveStats.warningCount },
      { Indikator: 'Perangkat Terputus (Offline)', Nilai: liveStats.offlineCount },
      { Indikator: 'SLA Ketersediaan Jaringan', Nilai: `${liveStats.slaPercent}%` },
      { Indikator: 'Total Insiden Periode Ini', Nilai: alerts.length },
      { Indikator: 'Perbaikan Selesai', Nilai: completedRepairs.length },
    ];
    downloadCsv(`laporan-eksekutif-nms-${period}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-m3-surface-container-low p-4 rounded-m3-3xl border border-m3-outline-variant/30 print:hidden">
        <div className="flex items-center gap-3">
          <M3SegmentedButton
            options={[
              { id: 'harian', label: 'Laporan Harian' },
              { id: 'mingguan', label: 'Laporan Mingguan' },
              { id: 'bulanan', label: 'Laporan Bulanan' },
            ]}
            selected={period}
            onChange={setPeriod}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <M3Button
            variant="outlined"
            size="sm"
            onClick={handleExportSummaryCsv}
            icon={<Download className="w-4 h-4" />}
          >
            Unduh CSV / Excel
          </M3Button>
          <M3Button
            variant="filled"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Cetak / Simpan PDF
          </M3Button>
        </div>
      </div>

      {/* Printable Executive Report Sheet Preview */}
      <M3Card className="p-6 md:p-8 bg-m3-surface-container-lowest border border-m3-outline-variant/40 space-y-6 shadow-m3-2">
        {/* Report Official Header */}
        <div className="flex items-start justify-between border-b-2 border-m3-primary/30 pb-6">
          <div className="space-y-1">
            <div className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-m3-primary text-m3-on-primary uppercase tracking-wider mb-1">
              Dokumen Resmi Divisi IT & Jaringan
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight">
              LAPORAN KINERJA & KETERSEDIAAN JARINGAN
            </h1>
            <p className="text-xs text-m3-on-surface-variant font-medium">
              Periode: {period === 'harian' ? 'Harian (24 Jam Terakhir)' : period === 'mingguan' ? 'Mingguan (7 Hari Terakhir)' : 'Bulanan (30 Hari Terakhir)'} • Digenerate otomatis pada {formatDate(new Date().toISOString())}
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {liveStats.slaPercent}%
            </div>
            <div className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
              SLA Availability Score
            </div>
          </div>
        </div>

        {/* 4 Key Executive Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30">
            <span className="text-xs text-m3-on-surface-variant font-bold uppercase tracking-wider">
              Total Node Jaringan
            </span>
            <div className="text-2xl font-black text-m3-on-surface mt-1">
              {liveStats.totalDevices} Unit
            </div>
            <p className="text-[10px] text-m3-on-surface-variant mt-0.5">
              Router, Switch, AP, Server
            </p>
          </div>

          <div className="p-4 rounded-m3-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
              Online Normal
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {liveStats.onlineCount} Unit
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              Status 100% Beroperasi Sehat
            </p>
          </div>

          <div className="p-4 rounded-m3-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
              Peringatan & Anomali
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {alerts.length} Insiden
            </div>
            <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5">
              Latensi tinggi & degradasi
            </p>
          </div>

          <div className="p-4 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30">
            <span className="text-xs text-m3-on-surface-variant font-bold uppercase tracking-wider">
              Perbaikan Selesai
            </span>
            <div className="text-2xl font-black text-m3-primary mt-1">
              {completedRepairs.length} Tiket
            </div>
            <p className="text-[10px] text-m3-on-surface-variant mt-0.5">
              Tindakan teknisi tuntas
            </p>
          </div>
        </div>

        {/* Section 1: Device Summary Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-m3-primary" />
            1. Ringkasan Status & Ketersediaan Perangkat
          </h3>
          <div className="rounded-m3-2xl border border-m3-outline-variant/30 overflow-hidden bg-m3-surface-container/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-m3-surface-container-high text-m3-on-surface-variant font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Nama Perangkat</th>
                    <th className="py-2.5 px-4">IP & Lokasi</th>
                    <th className="py-2.5 px-4">Uptime</th>
                    <th className="py-2.5 px-4">Beban Rata-Rata</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-m3-outline-variant/20">
                  {devices.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2.5 px-4 font-bold">{d.name}</td>
                      <td className="py-2.5 px-4 text-m3-on-surface-variant">
                        {d.ip_address} • {d.location_name}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{d.uptime}</td>
                      <td className="py-2.5 px-4 font-mono">
                        CPU: {d.cpu_usage}% | Ping: {d.latency}ms
                      </td>
                      <td className="py-2.5 px-4 font-bold">
                        <span
                          className={
                            d.status === 'online'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : d.status === 'warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 2: Recent Repairs Record */}
        <div>
          <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            2. Tindak Lanjut & Log Pemeliharaan
          </h3>
          <div className="space-y-2">
            {repairRecords.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-m3-primary font-mono">{rep.ticket_code} — {rep.device_name}</span>
                  <span className="text-[10px] text-m3-on-surface-variant">{formatDate(rep.created_at)}</span>
                </div>
                <div className="text-m3-on-surface"><strong className="text-m3-on-surface-variant">Gejala:</strong> {rep.problem}</div>
                <div className="text-m3-on-surface"><strong className="text-m3-on-surface-variant">Tindakan:</strong> {rep.action}</div>
                <div className="text-m3-on-surface"><strong className="text-m3-on-surface-variant">Hasil:</strong> {rep.result} ({rep.user_name})</div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 pt-8 border-t border-m3-outline-variant/30 text-xs">
          <div>
            <p className="text-m3-on-surface-variant">Dibuat Oleh Petugas NOC:</p>
            <div className="mt-12 font-bold text-m3-on-surface">Dimas Prakoso</div>
            <p className="text-[11px] text-m3-on-surface-variant">IT Support & Network Engineer</p>
          </div>
          <div className="text-right">
            <p className="text-m3-on-surface-variant">Mengetahui, Kepala Divisi IT:</p>
            <div className="mt-12 font-bold text-m3-on-surface">Budi Santoso, S.Kom</div>
            <p className="text-[11px] text-m3-on-surface-variant">Administrator NMS</p>
          </div>
        </div>
      </M3Card>
    </div>
  );
};
