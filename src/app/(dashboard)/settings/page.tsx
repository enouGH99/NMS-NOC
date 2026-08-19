'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3TextField } from '@/components/m3/M3TextField';
import { M3Switch } from '@/components/m3/M3Switch';
import { Settings, ShieldCheck, Clock, BellRing, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const { soundEnabled, setSoundEnabled } = useNms();
  const [pollingInterval, setPollingInterval] = useState('5');
  const [snmpTimeout, setSnmpTimeout] = useState('2000');
  const [snmpRetries, setSnmpRetries] = useState('3');
  const [defaultCommunity, setDefaultCommunity] = useState('public_nms');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-m3-primary" />
            Pengaturan Sistem & SNMP Collector
          </h1>
          <p className="text-xs md:text-sm text-m3-on-surface-variant">
            Konfigurasi parameter polling berkala, timeout koneksi SNMP MikroTik, dan preferensi notifikasi
          </p>
        </div>

        <M3Button
          variant="filled"
          size="sm"
          onClick={handleSave}
          icon={savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        >
          {savedSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi'}
        </M3Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SNMP Collector Polling Engine Settings */}
        <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4">
          <div className="pb-3 border-b border-m3-outline-variant/30 flex items-center gap-2">
            <Clock className="w-5 h-5 text-m3-primary" />
            <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider">
              Interval & Parameter Polling SNMP
            </h3>
          </div>

          <div className="space-y-4">
            <M3TextField
              label="Interval Polling Status (Detik)"
              value={pollingInterval}
              onChange={(e) => setPollingInterval(e.target.value)}
              helperText="Frekuensi scheduler mengambil status ketersediaan dan interface traffic (Direkomendasikan: 5-30s)."
            />

            <M3TextField
              label="Timeout Request (Milidetik)"
              value={snmpTimeout}
              onChange={(e) => setSnmpTimeout(e.target.value)}
              helperText="Batas waktu menunggu respons paket SNMP sebelum dianggap timeout."
            />

            <M3TextField
              label="Jumlah Percobaan Ulang (Retries)"
              value={snmpRetries}
              onChange={(e) => setSnmpRetries(e.target.value)}
            />
          </div>
        </M3Card>

        {/* Global Security & Notification Defaults */}
        <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4">
          <div className="pb-3 border-b border-m3-outline-variant/30 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-m3-primary" />
            <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider">
              Template Kredensial & Notifikasi
            </h3>
          </div>

          <div className="space-y-4">
            <M3TextField
              label="Default Community String (SNMP v2c)"
              value={defaultCommunity}
              onChange={(e) => setDefaultCommunity(e.target.value)}
              helperText="Community string bawaan saat menambahkan perangkat MikroTik baru."
            />

            <div className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-m3-on-surface">Suara Peringatan Audio</div>
                  <p className="text-[11px] text-m3-on-surface-variant">
                    Putar suara sirine/beep saat terdeteksi node kritis down
                  </p>
                </div>
                <M3Switch
                  checked={soundEnabled}
                  onChange={setSoundEnabled}
                />
              </div>
            </div>
          </div>
        </M3Card>
      </div>
    </div>
  );
}
