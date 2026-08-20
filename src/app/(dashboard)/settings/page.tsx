'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { Location } from '@/lib/types';
import { initialLocations } from '@/lib/mock-data';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3TextField } from '@/components/m3/M3TextField';
import { M3Switch } from '@/components/m3/M3Switch';
import { M3Dialog } from '@/components/m3/M3Dialog';
import {
  Settings,
  ShieldCheck,
  Clock,
  BellRing,
  Save,
  Check,
  Building,
  Plus,
  MapPin,
  Trash2,
  Edit2,
  Server,
  Layers,
} from 'lucide-react';

export default function SettingsPage() {
  const { soundEnabled, setSoundEnabled, locations, addLocation, updateLocation, deleteLocation, devices } = useNms();

  const availableLocations = locations.length > 0 ? locations : initialLocations;

  const [pollingInterval, setPollingInterval] = useState('5');
  const [snmpTimeout, setSnmpTimeout] = useState('2000');
  const [snmpRetries, setSnmpRetries] = useState('3');
  const [defaultCommunity, setDefaultCommunity] = useState('public_nms');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Location Modal State
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locForm, setLocForm] = useState({
    name: '',
    building: '',
    floor: '',
    description: '',
  });

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleOpenAddLocation = () => {
    setEditingLocation(null);
    setLocForm({
      name: '',
      building: '',
      floor: 'Lantai 1',
      description: '',
    });
    setLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc: Location) => {
    setEditingLocation(loc);
    setLocForm({
      name: loc.name,
      building: loc.building,
      floor: loc.floor,
      description: loc.description || '',
    });
    setLocationModalOpen(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locForm.name.trim() || !locForm.building.trim()) return;

    if (editingLocation) {
      updateLocation(editingLocation.id, {
        name: locForm.name.trim(),
        building: locForm.building.trim(),
        floor: locForm.floor.trim(),
        description: locForm.description.trim() || undefined,
      });
    } else {
      addLocation({
        name: locForm.name.trim(),
        building: locForm.building.trim(),
        floor: locForm.floor.trim() || 'Lantai 1',
        description: locForm.description.trim() || undefined,
        device_count: 0,
      });
    }

    setLocationModalOpen(false);
  };

  const handleDeleteLocation = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus lokasi "${name}"?`)) {
      deleteLocation(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-m3-primary" />
            Pengaturan Sistem & Manajemen Lokasi
          </h1>
          <p className="text-xs md:text-sm text-m3-on-surface-variant">
            Konfigurasi parameter polling SNMP, data master gedung/lokasi, dan template keamanan
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

      {/* Location & Building Management (Master Data) */}
      <M3Card className="p-6 bg-m3-surface-container border border-m3-outline-variant/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-m3-outline-variant/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-m3-lg bg-m3-primary/10 text-m3-primary">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-m3-on-surface uppercase tracking-wider">
                Manajemen Data Gedung & Lokasi ({availableLocations.length})
              </h3>
              <p className="text-xs text-m3-on-surface-variant">
                Daftar master lokasi dan lantai yang digunakan pada dropdown penambahan perangkat jaringan
              </p>
            </div>
          </div>

          <M3Button
            size="sm"
            variant="filled"
            onClick={handleOpenAddLocation}
            icon={<Plus className="w-4 h-4" />}
          >
            Tambah Lokasi Gedung
          </M3Button>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableLocations.map((loc) => {
            const attachedDevicesCount = devices.filter((d) => d.location_id === loc.id).length;

            return (
              <div
                key={loc.id}
                className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-outline-variant/30 flex flex-col justify-between space-y-3 hover:border-m3-primary/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sm text-m3-on-surface flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-m3-primary shrink-0" />
                      <span>{loc.name}</span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-m3-surface-container-highest text-m3-on-surface-variant border border-m3-outline-variant/30 shrink-0">
                      {loc.building} • {loc.floor}
                    </span>
                  </div>

                  {loc.description && (
                    <p className="text-xs text-m3-on-surface-variant line-clamp-2">
                      {loc.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-m3-outline-variant/20 text-xs">
                  <span className="text-[11px] text-m3-on-surface-variant flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-m3-primary" />
                    <strong>{attachedDevicesCount || loc.device_count || 0}</strong> Perangkat
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditLocation(loc)}
                      className="p-1.5 rounded-m3-md hover:bg-m3-surface-container-highest text-m3-on-surface-variant hover:text-m3-primary transition-colors"
                      title="Edit Lokasi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(loc.id, loc.name)}
                      className="p-1.5 rounded-m3-md hover:bg-rose-500/15 text-m3-on-surface-variant hover:text-rose-500 transition-colors"
                      title="Hapus Lokasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </M3Card>

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

      {/* Add / Edit Location Dialog */}
      {locationModalOpen && (
        <M3Dialog
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          title={editingLocation ? 'Edit Data Lokasi Gedung' : 'Tambah Master Lokasi Gedung'}
          icon={<Building className="w-5 h-5 text-m3-primary" />}
        >
          <form onSubmit={handleSaveLocation} className="space-y-4 pt-1">
            <M3TextField
              label="Nama Lokasi / Ruangan"
              placeholder="contoh: Ruang Server Utama / Lab Komputer 1"
              value={locForm.name}
              onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <M3TextField
                label="Nama Gedung"
                placeholder="contoh: Gedung A / Gedung Rektorat"
                value={locForm.building}
                onChange={(e) => setLocForm({ ...locForm, building: e.target.value })}
                required
              />

              <M3TextField
                label="Lantai / Level"
                placeholder="contoh: Lantai 2 / Basement"
                value={locForm.floor}
                onChange={(e) => setLocForm({ ...locForm, floor: e.target.value })}
                required
              />
            </div>

            <M3TextField
              label="Deskripsi / Keterangan (Opsional)"
              placeholder="contoh: Ruangan ber-AC dengan UPS sentral dan rak server rackmount"
              value={locForm.description}
              onChange={(e) => setLocForm({ ...locForm, description: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-2">
              <M3Button
                type="button"
                variant="outlined"
                onClick={() => setLocationModalOpen(false)}
              >
                Batal
              </M3Button>
              <M3Button type="submit" variant="filled">
                {editingLocation ? 'Simpan Perubahan' : 'Tambahkan Lokasi'}
              </M3Button>
            </div>
          </form>
        </M3Dialog>
      )}
    </div>
  );
}
