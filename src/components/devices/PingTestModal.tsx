'use client';

import React, { useState } from 'react';
import { Device } from '@/lib/types';
import { useNms } from '@/lib/store';
import { M3Dialog } from '../m3/M3Dialog';
import { M3Button } from '../m3/M3Button';
import { Zap, CheckCircle2, XCircle, Activity } from 'lucide-react';

interface PingTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export const PingTestModal: React.FC<PingTestModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const { pingDevice } = useNms();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    latency: number;
    loss: number;
    success: boolean;
    packets: number[];
  } | null>(null);

  if (!device) return null;

  const handleStartPing = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await pingDevice(device.ip_address);
      setResult(res);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <M3Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Uji Koneksi (Ping): ${device.name}`}
      icon={<Zap className="w-5 h-5 text-emerald-500" />}
      maxWidth="md"
      cancelLabel="Tutup"
    >
      <div className="space-y-4 pt-1">
        <div className="p-3.5 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 text-xs flex items-center justify-between">
          <div>
            <span className="text-m3-on-surface-variant">Target IP:</span>
            <div className="font-mono font-bold text-sm text-m3-on-surface">
              {device.ip_address}
            </div>
          </div>
          <M3Button
            variant="filled"
            size="sm"
            loading={isRunning}
            onClick={handleStartPing}
            icon={<Activity className="w-4 h-4" />}
          >
            Mulai Ping (4 Paket)
          </M3Button>
        </div>

        {isRunning && (
          <div className="text-center py-6 space-y-2">
            <Activity className="w-8 h-8 text-m3-primary animate-spin mx-auto" />
            <p className="text-xs font-semibold text-m3-on-surface">
              Mengirimkan paket ICMP Echo Request ke {device.ip_address}...
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-3 animate-in fade-in">
            <div
              className={`p-4 rounded-m3-2xl border flex items-center justify-between ${
                result.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {result.success ? 'Perangkat Merespons Cepat' : 'Koneksi Terputus / RTO'}
                  </h4>
                  <p className="text-xs opacity-90">
                    {result.success
                      ? 'Koneksi jaringan stabil tanpa kendala routing.'
                      : 'Perangkat tidak merespons. Periksa kabel fisik dan power supply.'}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <div>Latensi: <strong>{result.latency} ms</strong></div>
                <div>Packet Loss: <strong>{result.loss}%</strong></div>
              </div>
            </div>

            {/* Individual Packet breakdown */}
            <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 text-xs font-mono space-y-1">
              <div className="font-bold text-m3-on-surface mb-1 font-sans">
                Rincian Echo Reply:
              </div>
              {result.packets.map((lat, i) => (
                <div key={i} className="flex justify-between py-0.5 border-b border-m3-outline-variant/20 last:border-0">
                  <span className="text-m3-on-surface-variant">Paket #{i + 1} (bytes=64)</span>
                  <span
                    className={lat === 999 ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}
                  >
                    {lat === 999 ? 'Request Timed Out (RTO)' : `time=${lat}ms TTL=64`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </M3Dialog>
  );
};
