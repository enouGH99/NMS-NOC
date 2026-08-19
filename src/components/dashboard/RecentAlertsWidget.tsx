'use client';

import React from 'react';
import Link from 'next/link';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getSeverityM3Badge } from '@/lib/m3-theme';
import { formatTimeAgo } from '@/lib/utils';

export const RecentAlertsWidget: React.FC = () => {
  const { alerts, acknowledgeAlert } = useNms();

  const unresolvedAlerts = alerts.filter((a) => !a.resolved_at);

  return (
    <M3Card className="p-5 flex flex-col h-full border border-m3-outline-variant/30">
      <div className="flex items-center justify-between pb-3 border-b border-m3-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-m3-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-m3-on-surface">
              Log Gangguan & Peringatan Terkini
            </h3>
            <p className="text-xs text-m3-on-surface-variant">
              Insiden aktif yang membutuhkan investigasi petugas
            </p>
          </div>
        </div>

        <Link href="/alerts">
          <M3Button variant="text" size="sm" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
            Semua Alert
          </M3Button>
        </Link>
      </div>

      <div className="pt-4 space-y-3 flex-1 overflow-y-auto">
        {unresolvedAlerts.length === 0 ? (
          <div className="text-center py-8 text-m3-on-surface-variant">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-semibold">Tidak ada insiden aktif</p>
          </div>
        ) : (
          unresolvedAlerts.slice(0, 4).map((alert) => {
            const badge = getSeverityM3Badge(alert.severity);
            return (
              <div
                key={alert.id}
                className="p-3.5 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs font-bold text-m3-on-surface truncate">
                      {alert.device_name}
                    </span>
                  </div>
                  <span className="text-[10px] text-m3-on-surface-variant shrink-0">
                    {formatTimeAgo(alert.triggered_at)}
                  </span>
                </div>

                <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                  {alert.message}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-m3-on-surface-variant">
                    {alert.ip_address}
                  </span>
                  {!alert.acknowledged ? (
                    <M3Button
                      size="sm"
                      variant="filled-tonal"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Tandai Diterima
                    </M3Button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Diterima ({alert.acknowledged_by})
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </M3Card>
  );
};
