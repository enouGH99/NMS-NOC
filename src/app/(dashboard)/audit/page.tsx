'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '@/components/m3/M3Card';
import { M3Chip } from '@/components/m3/M3Chip';
import { History, Search, Shield, User, Clock, Terminal } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AuditLogPage() {
  const { auditLogs } = useNms();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchUser = log.user_name.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchIp = log.ip_address.includes(q);
      if (!matchUser && !matchAction && !matchDetails && !matchIp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-m3-primary" />
          Audit Aktivitas & Rekam Jejak Keamanan
        </h1>
        <p className="text-xs md:text-sm text-m3-on-surface-variant">
          Catatan kronologis seluruh interaksi pengguna, modifikasi perangkat, eksekusi tes, dan tindakan peringatan
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-m3-surface-container-low p-4 rounded-m3-3xl border border-m3-outline-variant/30">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-m3-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aktivitas, nama pengguna, IP..."
            className="w-full h-11 pl-10 pr-4 rounded-m3-full bg-m3-surface-container-lowest text-xs sm:text-sm text-m3-on-surface border border-m3-outline-variant/40 outline-none focus:ring-2 focus:ring-m3-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Semua Aksi' },
            { id: 'LOGIN', label: 'Login' },
            { id: 'ADD_DEVICE', label: 'Tambah Perangkat' },
            { id: 'ACKNOWLEDGE_ALERT', label: 'Acknowledge Alert' },
            { id: 'CREATE_REPAIR_RECORD', label: 'Tiket Perbaikan' },
          ].map((act) => (
            <M3Chip
              key={act.id}
              selected={actionFilter === act.id}
              onClick={() => setActionFilter(act.id)}
            >
              {act.label}
            </M3Chip>
          ))}
        </div>
      </div>

      {/* Logs Timeline List */}
      <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4">
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <p className="text-center py-10 text-xs text-m3-on-surface-variant italic">
              Tidak ada riwayat audit yang cocok dengan filter pencarian.
            </p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-m3-xl bg-m3-surface-container text-m3-primary shrink-0 mt-0.5 sm:mt-0">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-m3-primary/15 text-m3-primary text-[10px]">
                        {log.action}
                      </span>
                      <span className="font-bold text-m3-on-surface">{log.user_name}</span>
                      <span className="text-[10px] text-m3-on-surface-variant font-mono">
                        ({log.ip_address})
                      </span>
                    </div>
                    <p className="text-m3-on-surface-variant mt-1 leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-m3-on-surface-variant shrink-0 font-mono flex items-center gap-1.5 self-end sm:self-center">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(log.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </M3Card>
    </div>
  );
}
