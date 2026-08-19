'use client';

import React from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { GitFork, AlertCircle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { getStatusM3Badge } from '@/lib/m3-theme';

export const DependencyTree: React.FC = () => {
  const { devices } = useNms();

  // Find root devices (devices with no parent_device_id)
  const rootDevices = devices.filter((d) => !d.parent_device_id);

  const renderChildren = (parentId: string, depth = 1) => {
    const children = devices.filter((d) => d.parent_device_id === parentId);
    if (!children.length) return null;

    return (
      <div className="pl-6 border-l-2 border-m3-outline-variant/40 ml-4 space-y-3 mt-3">
        {children.map((child) => {
          const statusBadge = getStatusM3Badge(child.status);
          const isUnreachable = child.status === 'unreachable';

          return (
            <div key={child.id} className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusBadge.dot}`} />
                  <div>
                    <span className="font-bold text-sm text-m3-on-surface">{child.name}</span>
                    <span className="text-[10px] font-mono text-m3-on-surface-variant ml-2">
                      {child.ip_address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isUnreachable && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 font-semibold flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      Unreachable (Supressed Alert Storm)
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>
              </div>

              {renderChildren(child.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-5">
      <div className="pb-3 border-b border-m3-outline-variant/30">
        <h3 className="text-base font-bold text-m3-on-surface flex items-center gap-2">
          <GitFork className="w-5 h-5 text-m3-primary" />
          Monitoring Topologi Logis & Pelacakan Dependensi
        </h3>
        <p className="text-xs text-m3-on-surface-variant">
          Pohon ketergantungan hierarki perangkat untuk mendeteksi Root Cause dan meredam badai notifikasi (*Alert Storm*)
        </p>
      </div>

      <div className="space-y-4">
        {rootDevices.map((root) => {
          const statusBadge = getStatusM3Badge(root.status);
          return (
            <div key={root.id} className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${statusBadge.dot}`} />
                  <div>
                    <span className="font-extrabold text-sm text-m3-on-surface">
                      [ROOT GATEWAY] {root.name}
                    </span>
                    <span className="text-xs font-mono text-m3-on-surface-variant ml-2">
                      {root.ip_address}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
              </div>

              {renderChildren(root.id)}
            </div>
          );
        })}
      </div>
    </M3Card>
  );
};
