'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Device } from '@/lib/types';
import { useNms } from '@/lib/store';
import { M3Sheet } from '../m3/M3Sheet';
import { M3Button } from '../m3/M3Button';
import { getStatusM3Badge } from '@/lib/m3-theme';
import {
  Server,
  Zap,
  Activity,
  Cpu,
  HardDrive,
  Thermometer,
  Wrench,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Radio,
} from 'lucide-react';

interface DeviceDetailSheetProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRepairModal?: (device: Device) => void;
}

export const DeviceDetailSheet: React.FC<DeviceDetailSheetProps> = ({
  device,
  isOpen,
  onClose,
  onOpenRepairModal,
}) => {
  const { pingDevice } = useNms();
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    latency: number;
    loss: number;
    success: boolean;
    packets: number[];
  } | null>(null);

  if (!device) return null;

  const statusBadge = getStatusM3Badge(device.status);

  const handleRunPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await pingDevice(device.ip_address);
      setPingResult(res);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <M3Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={device.name}
      subtitle={`${device.model} • ${device.location_name}`}
      width="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Link href={`/devices/${device.id}`} className="flex-1">
            <M3Button variant="outlined" fullWidth icon={<ExternalLink className="w-4 h-4" />}>
              Buka Halaman Detail Penuh
            </M3Button>
          </Link>
          {onOpenRepairModal && (
            <M3Button
              variant="filled"
              icon={<Wrench className="w-4 h-4" />}
              onClick={() => {
                onClose();
                onOpenRepairModal(device);
              }}
            >
              Catat Perbaikan
            </M3Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Header Box */}
        <div className="p-4 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-m3-xl bg-m3-surface-container-high text-m3-primary">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-m3-on-surface-variant font-medium">Status Operasional</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${statusBadge.dot}`} />
                <span className="font-bold text-sm text-m3-on-surface">{statusBadge.label}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-m3-on-surface-variant font-medium">Ketersediaan Uptime</div>
            <div className="font-mono font-bold text-xs text-m3-on-surface mt-0.5">
              {device.uptime}
            </div>
          </div>
        </div>

        {/* Network & Specs Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20">
            <span className="text-m3-on-surface-variant font-medium">IP Address</span>
            <div className="font-mono font-bold text-sm text-m3-on-surface mt-0.5">
              {device.ip_address}
            </div>
          </div>
          <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20">
            <span className="text-m3-on-surface-variant font-medium">MAC Address</span>
            <div className="font-mono font-bold text-sm text-m3-on-surface mt-0.5">
              {device.mac_address}
            </div>
          </div>
          <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20">
            <span className="text-m3-on-surface-variant font-medium">SNMP Protocol</span>
            <div className="font-bold text-sm text-m3-on-surface mt-0.5">
              SNMP {device.snmp_version.toUpperCase()} ({device.snmp_community || 'v3-secured'})
            </div>
          </div>
          <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20">
            <span className="text-m3-on-surface-variant font-medium">Prioritas Monitoring</span>
            <div className="font-bold text-sm text-m3-on-surface mt-0.5">
              {device.is_priority ? '⭐ Perangkat Kritis / Prioritas' : 'Standar'}
            </div>
          </div>
        </div>

        {/* Realtime Resource Gauges */}
        <div>
          <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider mb-3">
            Kondisi Hardware & Metrik
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 text-center">
              <Cpu className="w-5 h-5 text-m3-primary mx-auto mb-1" />
              <div className="text-[11px] text-m3-on-surface-variant font-medium">CPU Load</div>
              <div className="font-bold text-base text-m3-on-surface mt-0.5">
                {device.cpu_usage}%
              </div>
            </div>
            <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 text-center">
              <HardDrive className="w-5 h-5 text-sky-500 mx-auto mb-1" />
              <div className="text-[11px] text-m3-on-surface-variant font-medium">RAM Usage</div>
              <div className="font-bold text-base text-m3-on-surface mt-0.5">
                {device.ram_usage}%
              </div>
            </div>
            <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 text-center">
              <Thermometer className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-[11px] text-m3-on-surface-variant font-medium">Suhu Internal</div>
              <div className="font-bold text-base text-m3-on-surface mt-0.5">
                {device.temperature}°C
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Ping Tool Section */}
        <div className="p-4 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider">
                Uji Koneksi Langsung (ICMP Ping)
              </h4>
            </div>
            <M3Button
              size="sm"
              variant="filled-tonal"
              loading={isPinging}
              onClick={handleRunPing}
            >
              Kirim Ping (4 Paket)
            </M3Button>
          </div>

          {pingResult && (
            <div className="p-3 rounded-m3-xl bg-m3-surface-container-highest border border-m3-outline-variant/30 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {pingResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  {pingResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal / Timeout'}
                </span>
                <span className="font-mono">
                  Rata-rata Latensi: {pingResult.latency} ms | Loss: {pingResult.loss}%
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-m3-on-surface-variant">
                <span>Respon Paket:</span>
                {pingResult.packets.map((lat, idx) => (
                  <span
                    key={idx}
                    className={`px-1.5 py-0.5 rounded ${
                      lat === 999
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold'
                        : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold'
                    }`}
                  >
                    #{idx + 1}: {lat === 999 ? 'Timeout' : `${lat}ms`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </M3Sheet>
  );
};
