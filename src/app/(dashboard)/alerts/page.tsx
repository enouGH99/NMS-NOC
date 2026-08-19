'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { getSeverityM3Badge } from '@/lib/m3-theme';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3Chip } from '@/components/m3/M3Chip';
import { M3Switch } from '@/components/m3/M3Switch';
import { M3Dialog } from '@/components/m3/M3Dialog';
import { M3TextField } from '@/components/m3/M3TextField';
import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { formatDate, formatTimeAgo } from '@/lib/utils';

export default function AlertsPage() {
  const { alerts, alertRules, acknowledgeAlert, resolveAlert, toggleAlertRule, addAlertRule } = useNms();

  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [targetAlertId, setTargetAlertId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleThreshold, setNewRuleThreshold] = useState('80');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterStatus === 'active' && a.resolved_at) return false;
    if (filterStatus === 'resolved' && !a.resolved_at) return false;
    return true;
  });

  const handleOpenResolve = (alertId: string) => {
    setTargetAlertId(alertId);
    setResolutionNotes('');
    setResolveModalOpen(true);
  };

  const handleConfirmResolve = () => {
    if (targetAlertId && resolutionNotes) {
      resolveAlert(targetAlertId, resolutionNotes);
      setResolveModalOpen(false);
    }
  };

  const handleCreateRule = () => {
    if (!newRuleName) return;
    addAlertRule({
      name: newRuleName,
      metric: 'latency',
      condition: '>',
      threshold: Number(newRuleThreshold) || 80,
      duration_seconds: 60,
      enabled: true,
      escalation_tier: 1,
      notify_email: true,
      notify_sound: true,
    });
    setNewRuleName('');
    setAddRuleOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Pusat Peringatan & Aturan Notifikasi
          </h1>
          <p className="text-xs md:text-sm text-m3-on-surface-variant">
            Triage gangguan jaringan real-time, pengakuan alert, dan manajemen aturan eskalasi bertingkat
          </p>
        </div>

        <M3Button
          variant="filled"
          size="sm"
          onClick={() => setAddRuleOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Buat Aturan Alert Baru
        </M3Button>
      </div>

      {/* Main Grid: Alerts List (Left) & Alert Rules / Escalation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Incident Feed & Triage (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-m3-2xl bg-m3-surface-container/60 border border-m3-outline-variant/30">
            <span className="text-xs font-bold text-m3-on-surface-variant mr-1">Tingkat:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'critical', label: 'Critical' },
              { id: 'warning', label: 'Warning' },
              { id: 'info', label: 'Info' },
            ].map((s) => (
              <M3Chip
                key={s.id}
                selected={filterSeverity === s.id}
                onClick={() => setFilterSeverity(s.id)}
              >
                {s.label}
              </M3Chip>
            ))}

            <div className="h-4 w-px bg-m3-outline-variant/40 mx-1" />

            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'active', label: 'Aktif Saja' },
              { id: 'resolved', label: 'Terselesaikan' },
            ].map((st) => (
              <M3Chip
                key={st.id}
                selected={filterStatus === st.id}
                onClick={() => setFilterStatus(st.id as any)}
              >
                {st.label}
              </M3Chip>
            ))}
          </div>

          {/* Alert Cards List */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <M3Card className="p-12 text-center bg-m3-surface-container border border-m3-outline-variant/30">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-m3-on-surface">Tidak Ada Peringatan Terdeteksi</h3>
                <p className="text-xs text-m3-on-surface-variant mt-1">
                  Kondisi jaringan sesuai dengan batas toleransi yang ditentukan.
                </p>
              </M3Card>
            ) : (
              filteredAlerts.map((alert) => {
                const badge = getSeverityM3Badge(alert.severity);
                const isResolved = Boolean(alert.resolved_at);

                return (
                  <M3Card
                    key={alert.id}
                    className={`p-5 border transition-all ${
                      isResolved
                        ? 'bg-m3-surface-container/60 opacity-80 border-m3-outline-variant/20'
                        : 'bg-m3-surface-container border-m3-outline-variant/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                          <h4 className="font-extrabold text-sm text-m3-on-surface">
                            {alert.device_name}
                          </h4>
                          <span className="text-[11px] font-mono text-m3-on-surface-variant">
                            ({alert.ip_address})
                          </span>
                        </div>
                        <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-m3-on-surface-variant pt-1 font-medium">
                          <span>Terdeteksi: {formatDate(alert.triggered_at)} ({formatTimeAgo(alert.triggered_at)})</span>
                          {alert.acknowledged && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              ✓ Diterima oleh {alert.acknowledged_by}
                            </span>
                          )}
                        </div>

                        {alert.resolution_notes && (
                          <div className="mt-2 p-2.5 rounded-m3-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200">
                            <strong>Catatan Penyelesaian:</strong> {alert.resolution_notes} ({alert.resolved_by})
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {!isResolved && (
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {!alert.acknowledged && (
                            <M3Button
                              size="sm"
                              variant="filled-tonal"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Tandai Diterima
                            </M3Button>
                          )}
                          <M3Button
                            size="sm"
                            variant="filled"
                            onClick={() => handleOpenResolve(alert.id)}
                          >
                            Selesaikan
                          </M3Button>
                        </div>
                      )}
                    </div>
                  </M3Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Alert Rules & Escalation Policies (1 Col) */}
        <div className="space-y-6">
          {/* Active Rules List */}
          <M3Card className="p-5 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-m3-outline-variant/30">
              <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-m3-primary" />
                Aturan Alert Aktif
              </h3>
            </div>

            <div className="space-y-3">
              {alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-m3-on-surface">{rule.name}</div>
                    <div className="text-[11px] text-m3-on-surface-variant font-mono">
                      Ambang: {rule.condition} {rule.threshold} ({rule.duration_seconds}s)
                    </div>
                    <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-m3-surface-container-highest text-m3-primary font-semibold">
                      Eskalasi Tier {rule.escalation_tier}
                    </span>
                  </div>
                  <M3Switch
                    checked={rule.enabled}
                    onChange={() => toggleAlertRule(rule.id)}
                  />
                </div>
              ))}
            </div>
          </M3Card>

          {/* Escalation Policy Diagram Box */}
          <M3Card className="p-5 bg-m3-surface-container border border-m3-outline-variant/30 space-y-3">
            <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Kebijakan Eskalasi Bertingkat
            </h3>
            <div className="space-y-2 text-xs text-m3-on-surface-variant">
              <div className="p-3 rounded-m3-xl bg-m3-surface-container-high border-l-4 border-m3-primary">
                <div className="font-bold text-m3-on-surface">Tier 1: Petugas Lapangan (0 - 15 Menit)</div>
                <p className="text-[11px] mt-0.5">Notifikasi Web & Audio dikirim langsung ke seluruh petugas jaga.</p>
              </div>
              <div className="p-3 rounded-m3-xl bg-m3-surface-container-high border-l-4 border-amber-500">
                <div className="font-bold text-m3-on-surface">Tier 2: Admin / Koordinator (15 - 30 Menit)</div>
                <p className="text-[11px] mt-0.5">Jika alert belum di-acknowledge dalam 15m, eskalasi ke Admin.</p>
              </div>
              <div className="p-3 rounded-m3-xl bg-m3-surface-container-high border-l-4 border-rose-500">
                <div className="font-bold text-m3-on-surface">Tier 3: Kepala IT & Manajemen (&gt; 30 Menit)</div>
                <p className="text-[11px] mt-0.5">Eskalasi darurat untuk insiden kritis berkepanjangan.</p>
              </div>
            </div>
          </M3Card>
        </div>
      </div>

      {/* Resolve Dialog */}
      <M3Dialog
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Tandai Peringatan Terselesaikan"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        confirmLabel="Simpan & Selesaikan"
        onConfirm={handleConfirmResolve}
      >
        <div className="space-y-3 pt-1">
          <label className="text-xs font-medium text-m3-on-surface-variant px-1 block">
            Catatan Tindakan & Penyelesaian Masalah
          </label>
          <textarea
            rows={3}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="contoh: Kabel fiber optik telah di-reconnect dan link kembali stabil..."
            className="w-full rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest p-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
          />
        </div>
      </M3Dialog>

      {/* Add Rule Dialog */}
      <M3Dialog
        isOpen={addRuleOpen}
        onClose={() => setAddRuleOpen(false)}
        title="Buat Aturan Alert Baru"
        icon={<Plus className="w-5 h-5 text-m3-primary" />}
        confirmLabel="Buat Aturan"
        onConfirm={handleCreateRule}
      >
        <div className="space-y-4 pt-1">
          <M3TextField
            label="Nama Aturan"
            placeholder="contoh: Ambang Batas Latensi Tinggi AP Gedung B"
            value={newRuleName}
            onChange={(e) => setNewRuleName(e.target.value)}
          />
          <M3TextField
            label="Nilai Batas Threshold"
            placeholder="80"
            value={newRuleThreshold}
            onChange={(e) => setNewRuleThreshold(e.target.value)}
          />
        </div>
      </M3Dialog>
    </div>
  );
}
