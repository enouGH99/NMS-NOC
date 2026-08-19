'use client';

import React, { useState } from 'react';
import { ReportFrequency } from '@/lib/types';
import { useNms } from '@/lib/store';
import { M3Dialog } from '../m3/M3Dialog';
import { M3TextField } from '../m3/M3TextField';
import { Calendar, Mail } from 'lucide-react';

interface ReportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportScheduleModal: React.FC<ReportScheduleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, addReportSchedule } = useNms();

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<ReportFrequency>('harian');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [recipientsInput, setRecipientsInput] = useState('');

  const handleSubmit = () => {
    if (!name || !recipientsInput) return;

    const emails = recipientsInput
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    addReportSchedule({
      name,
      frequency,
      format,
      recipients: emails,
      created_by: currentUser.name,
      next_run_at: new Date(Date.now() + 86400000).toISOString(),
      enabled: true,
    });

    onClose();
  };

  return (
    <M3Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Jadwal Laporan Otomatis"
      icon={<Calendar className="w-5 h-5 text-m3-primary" />}
      confirmLabel="Simpan Jadwal"
      onConfirm={handleSubmit}
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        <M3TextField
          label="Nama Laporan / Jadwal"
          placeholder="contoh: Laporan SLA & Gangguan Harian Direksi"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
              Frekuensi Pengiriman
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ReportFrequency)}
              className="w-full h-12 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest px-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
            >
              <option value="harian">Harian (Setiap Hari 23:59)</option>
              <option value="mingguan">Mingguan (Setiap Senin 08:00)</option>
              <option value="bulanan">Bulanan (Tanggal 1)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
              Format Dokumen
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full h-12 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest px-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
            >
              <option value="pdf">PDF Ringkasan Eksekutif</option>
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV Raw Data</option>
            </select>
          </div>
        </div>

        <div>
          <M3TextField
            label="Daftar Email Penerima (Pisahkan dengan koma)"
            placeholder="pimpinan@kantor.go.id, noc@kantor.go.id"
            value={recipientsInput}
            onChange={(e) => setRecipientsInput(e.target.value)}
            leadingIcon={<Mail className="w-4 h-4" />}
            helperText="Laporan akan dibuat otomatis oleh Vercel Cron dan dikirimkan ke email-email di atas."
          />
        </div>
      </div>
    </M3Dialog>
  );
};
