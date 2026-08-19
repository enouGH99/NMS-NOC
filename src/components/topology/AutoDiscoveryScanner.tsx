'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import { M3TextField } from '../m3/M3TextField';
import { Radio, Plus, Check, ShieldCheck, Search } from 'lucide-react';

export const AutoDiscoveryScanner: React.FC = () => {
  const {
    discoveredDevices,
    isScanning,
    scanProgress,
    startAutoDiscovery,
    approveDiscoveredDevice,
    ignoreDiscoveredDevice,
  } = useNms();

  const [subnet, setSubnet] = useState('192.168.1.0/24');

  return (
    <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-m3-outline-variant/30">
        <div>
          <h3 className="text-base font-bold text-m3-on-surface flex items-center gap-2">
            <Radio className="w-5 h-5 text-m3-primary" />
            Otomasi Penemuan Perangkat (Auto-Discovery)
          </h3>
          <p className="text-xs text-m3-on-surface-variant">
            Pindai subnet jaringan untuk menemukan perangkat baru via protokol ICMP & SNMP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-48">
            <M3TextField
              placeholder="192.168.1.0/24"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
            />
          </div>
          <M3Button
            variant="filled"
            loading={isScanning}
            onClick={() => startAutoDiscovery(subnet)}
            icon={<Search className="w-4 h-4" />}
          >
            Mulai Scan Subnet
          </M3Button>
        </div>
      </div>

      {/* Progress Bar when Scanning */}
      {isScanning && (
        <div className="space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-m3-on-surface">
            <span>Memindai IP Range {subnet}...</span>
            <span>{scanProgress}%</span>
          </div>
          <div className="h-2 w-full bg-m3-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-m3-primary rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Discovered Devices List / Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider">
          Hasil Penemuan Perangkat Baru ({discoveredDevices.length})
        </h4>

        {/* Mobile Cards */}
        <div className="space-y-3 block md:hidden">
          {discoveredDevices.map((item) => {
            const isApproved = item.status === 'approved';
            const isIgnored = item.status === 'ignored';

            return (
              <div
                key={item.id}
                className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-sm text-m3-on-surface">{item.suggested_name}</h5>
                    <div className="text-[11px] text-m3-on-surface-variant font-mono mt-0.5">
                      {item.ip} • {item.mac}
                    </div>
                  </div>

                  {item.snmp_detected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                      <ShieldCheck className="w-3 h-3" /> SNMP
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-surface-container-highest text-m3-on-surface-variant shrink-0">
                      ICMP Only
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-m3-on-surface-variant pt-1 border-t border-m3-outline-variant/20">
                  <span>Vendor: <strong>{item.vendor}</strong></span>
                  <span className="font-mono">Respon: <strong>{item.response_time} ms</strong></span>
                </div>

                <div className="pt-2 border-t border-m3-outline-variant/20 flex items-center justify-end gap-2">
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <Check className="w-3.5 h-3.5" /> Ditambahkan
                    </span>
                  ) : isIgnored ? (
                    <span className="text-xs text-m3-on-surface-variant italic">Diabaikan</span>
                  ) : (
                    <>
                      <M3Button
                        size="sm"
                        variant="text"
                        onClick={() => ignoreDiscoveredDevice(item.id)}
                      >
                        Abaikan
                      </M3Button>
                      <M3Button
                        size="sm"
                        variant="filled-tonal"
                        onClick={() => approveDiscoveredDevice(item.id)}
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Setujui & Pantau
                      </M3Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="rounded-m3-2xl border border-m3-outline-variant/30 overflow-hidden bg-m3-surface-container-lowest hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-m3-surface-container-high text-m3-on-surface-variant font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Alamat IP & MAC</th>
                  <th className="py-3 px-4">Saran Nama / Vendor</th>
                  <th className="py-3 px-4">SNMP Terdeteksi</th>
                  <th className="py-3 px-4">Response Time</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/20">
                {discoveredDevices.map((item) => {
                  const isApproved = item.status === 'approved';
                  const isIgnored = item.status === 'ignored';

                  return (
                    <tr key={item.id} className="hover:bg-m3-surface-container-high/40">
                      <td className="py-3 px-4 font-mono font-bold">
                        <div>{item.ip}</div>
                        <div className="text-[10px] text-m3-on-surface-variant font-normal">
                          {item.mac}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-m3-on-surface">{item.suggested_name}</div>
                        <div className="text-[10px] text-m3-on-surface-variant">{item.vendor}</div>
                      </td>

                      <td className="py-3 px-4">
                        {item.snmp_detected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" /> SNMP Ready
                          </span>
                        ) : (
                          <span className="text-[11px] text-m3-on-surface-variant">ICMP Only</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">
                        {item.response_time} ms
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            <Check className="w-3.5 h-3.5" /> Ditambahkan
                          </span>
                        ) : isIgnored ? (
                          <span className="text-xs text-m3-on-surface-variant italic">Diabaikan</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <M3Button
                              size="sm"
                              variant="filled-tonal"
                              onClick={() => approveDiscoveredDevice(item.id)}
                              icon={<Plus className="w-3.5 h-3.5" />}
                            >
                              Setujui & Pantau
                            </M3Button>
                            <M3Button
                              size="sm"
                              variant="text"
                              onClick={() => ignoreDiscoveredDevice(item.id)}
                            >
                              Abaikan
                            </M3Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </M3Card>
  );
};
