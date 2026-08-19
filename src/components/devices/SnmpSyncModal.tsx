'use client';

import React, { useState } from 'react';
import { Device } from '@/lib/types';
import { useNms } from '@/lib/store';
import { M3Dialog } from '../m3/M3Dialog';
import { M3Button } from '../m3/M3Button';
import {
  Radio,
  Cpu,
  HardDrive,
  Clock,
  Layers,
  Thermometer,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  ShieldCheck,
} from 'lucide-react';

interface SnmpSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device;
}

export const SnmpSyncModal: React.FC<SnmpSyncModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const { syncDeviceViaSnmp } = useNms();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  const handleStartSync = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await syncDeviceViaSnmp(device.id);
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || 'SNMP Port 161 UDP tidak merespon.');
        setResult(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat polling SNMP');
    } finally {
      setLoading(false);
    }
  };

  const defaultCli = `/snmp set enabled=yes\n/snmp community add name=${device.snmp_community || 'public_nms'} addresses=0.0.0.0/0 read-access=yes`;
  const cliText = result?.cliHelp || defaultCli;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliText);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <M3Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Tarik Data Realtime MikroTik via SNMP"
      icon={<Radio className="w-5 h-5 text-m3-primary" />}
      maxWidth="lg"
    >
      <div className="space-y-5 pt-1">
        {/* Device & SNMP Config Info Banner */}
        <div className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-m3-on-surface">{device.name}</span>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-m3-primary/15 text-m3-primary border border-m3-primary/30">
                {device.ip_address}
              </span>
            </div>
            <span className="text-[11px] font-mono text-m3-on-surface-variant">
              Protokol: {device.snmp_version.toUpperCase()} (Community: {device.snmp_community || 'public_nms'})
            </span>
          </div>
          <p className="text-m3-on-surface-variant text-[11px]">
            NMS akan melakukan polling langsung ke UDP port 161 MikroTik untuk membaca CPU load asli, RAM terpakai, uptime, suhu board, dan antarmuka fisik asli.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3">
          <M3Button
            variant="filled"
            loading={loading}
            onClick={handleStartSync}
            icon={<RefreshCw className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {loading ? 'Sedang Melakukan Polling SNMP...' : 'Mulai Tarik Data SNMP Sekarang'}
          </M3Button>

          {result?.latencyMs && (
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              Respon SNMP: {result.latencyMs} ms
            </span>
          )}
        </div>

        {/* Success Result Box */}
        {result && result.system && (
          <div className="p-4 sm:p-5 rounded-m3-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Metrik Asli Berhasil Ditarik dari MikroTik!</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1">
                <span className="text-[10px] text-m3-on-surface-variant flex items-center gap-1 font-bold">
                  <Cpu className="w-3.5 h-3.5 text-m3-primary" /> CPU Load
                </span>
                <span className="text-lg font-black font-mono text-m3-on-surface">
                  {result.system.cpuUsage}%
                </span>
              </div>

              <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1">
                <span className="text-[10px] text-m3-on-surface-variant flex items-center gap-1 font-bold">
                  <HardDrive className="w-3.5 h-3.5 text-sky-500" /> RAM Terpakai
                </span>
                <span className="text-lg font-black font-mono text-m3-on-surface">
                  {result.system.ramUsage}%
                </span>
              </div>

              <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1">
                <span className="text-[10px] text-m3-on-surface-variant flex items-center gap-1 font-bold">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Suhu Board
                </span>
                <span className="text-lg font-black font-mono text-m3-on-surface">
                  {result.system.temperature}°C
                </span>
              </div>

              <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1">
                <span className="text-[10px] text-m3-on-surface-variant flex items-center gap-1 font-bold">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" /> Port Interface
                </span>
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {result.interfaces?.length || 0} Terbaca
                </span>
              </div>
            </div>

            <div className="p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1 text-xs font-mono">
              <div className="text-m3-on-surface-variant text-[11px]">
                <strong>Identity:</strong> {result.system.sysName} • <strong>Uptime:</strong> {result.system.sysUpTime}
              </div>
              <div className="text-m3-on-surface-variant text-[11px] truncate">
                <strong>Model/Descr:</strong> {result.system.sysDescr}
              </div>
            </div>
          </div>
        )}

        {/* Error & CLI Helper Box */}
        {error && (
          <div className="p-4 sm:p-5 rounded-m3-2xl bg-amber-500/10 border border-amber-500/30 space-y-3.5 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                  Router Belum Merespon Query SNMP
                </h4>
                <p className="text-xs text-m3-on-surface-variant mt-0.5">
                  {error} Pastikan service SNMP di MikroTik sudah diaktifkan dan Community String <strong>{device.snmp_community || 'public_nms'}</strong> sudah terdaftar.
                </p>
              </div>
            </div>

            {/* Quick RouterOS Terminal Script */}
            <div className="rounded-m3-xl bg-black/15 dark:bg-black/40 border border-m3-outline-variant/30 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] font-bold text-m3-on-surface flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-m3-primary" />
                  Salin Perintah Ini ke Terminal Winbox RouterOS:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCli}
                  className="flex items-center gap-1 text-[11px] font-semibold text-m3-primary hover:underline"
                >
                  {copiedCli ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Script</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-black/30 p-2.5 rounded-m3-md overflow-x-auto whitespace-pre">
                <code>{cliText}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </M3Dialog>
  );
};
