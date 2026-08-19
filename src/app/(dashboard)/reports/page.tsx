'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { ReportScheduleModal } from '@/components/reports/ReportScheduleModal';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3Switch } from '@/components/m3/M3Switch';
import { FileBarChart, Calendar, Plus, Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ReportsPage() {
  const { reportSchedules, toggleReportSchedule } = useNms();
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-m3-primary" />
            Laporan Berkala & Evaluasi SLA
          </h1>
          <p className="text-xs md:text-sm text-m3-on-surface-variant">
            Generate laporan otomatis kondisi jaringan, pencapaian SLA, grafik performa, dan jadwal pengiriman email
          </p>
        </div>

        <M3Button
          variant="filled"
          size="sm"
          onClick={() => setScheduleModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Atur Jadwal Otomatis
        </M3Button>
      </div>

      {/* Automated Schedules Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportSchedules.map((sch) => (
          <M3Card
            key={sch.id}
            className="p-4 bg-m3-surface-container border border-m3-outline-variant/30 flex items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="font-bold text-sm text-m3-on-surface">{sch.name}</div>
              <div className="text-xs text-m3-on-surface-variant flex items-center gap-2">
                <span className="capitalize font-semibold text-m3-primary">
                  Frekuensi: {sch.frequency}
                </span>
                <span>•</span>
                <span className="uppercase font-mono font-bold">{sch.format}</span>
              </div>
              <div className="text-[11px] text-m3-on-surface-variant flex items-center gap-1 font-mono">
                <Mail className="w-3 h-3 text-m3-primary inline" />
                {sch.recipients.join(', ')}
              </div>
            </div>

            <M3Switch
              checked={sch.enabled}
              onChange={() => toggleReportSchedule(sch.id)}
            />
          </M3Card>
        ))}
      </div>

      {/* Main Report Generator & Printable Document */}
      <ReportGenerator />

      {/* Schedule Modal */}
      <ReportScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
    </div>
  );
}
