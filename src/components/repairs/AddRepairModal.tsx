'use client';

import React, { useState, useEffect } from 'react';
import { Device, RepairRecord, RepairStatus } from '@/lib/types';
import { useNms } from '@/lib/store';
import { M3Dialog } from '../m3/M3Dialog';
import { M3TextField } from '../m3/M3TextField';
import { Wrench, Image as ImageIcon, Plus, X } from 'lucide-react';

interface AddRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDevice?: Device | null;
  recordToEdit?: RepairRecord | null;
}

export const AddRepairModal: React.FC<AddRepairModalProps> = ({
  isOpen,
  onClose,
  initialDevice,
  recordToEdit,
}) => {
  const { devices, currentUser, addRepairRecord, updateRepairRecord } = useNms();

  const [deviceId, setDeviceId] = useState('');
  const [problem, setProblem] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState<RepairStatus>('berjalan');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');

  useEffect(() => {
    if (recordToEdit) {
      setDeviceId(recordToEdit.device_id);
      setProblem(recordToEdit.problem);
      setAction(recordToEdit.action);
      setResult(recordToEdit.result);
      setStatus(recordToEdit.status);
      setPhotoUrls(recordToEdit.photo_urls || []);
    } else if (initialDevice) {
      setDeviceId(initialDevice.id);
      setProblem('');
      setAction('');
      setResult('');
      setStatus('berjalan');
      setPhotoUrls([]);
    } else {
      setDeviceId(devices[0]?.id || '');
      setProblem('');
      setAction('');
      setResult('');
      setStatus('berjalan');
      setPhotoUrls([]);
    }
  }, [recordToEdit, initialDevice, devices, isOpen]);

  const handleAddPhoto = () => {
    if (!photoInput) return;
    setPhotoUrls([...photoUrls, photoInput]);
    setPhotoInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handlePresetPhoto = (url: string) => {
    setPhotoUrls([...photoUrls, url]);
  };

  const handleSubmit = () => {
    if (!problem || !action) return;

    const dev = devices.find((d) => d.id === deviceId);

    if (recordToEdit) {
      updateRepairRecord(recordToEdit.id, {
        device_id: deviceId,
        device_name: dev ? dev.name : 'Unknown Device',
        ip_address: dev ? dev.ip_address : '',
        problem,
        action,
        result,
        status,
        photo_urls: photoUrls,
      });
    } else {
      addRepairRecord({
        device_id: deviceId,
        device_name: dev ? dev.name : 'Unknown Device',
        ip_address: dev ? dev.ip_address : '',
        user_id: currentUser.id,
        user_name: currentUser.name,
        problem,
        action,
        result,
        status,
        photo_urls: photoUrls,
      });
    }

    onClose();
  };

  return (
    <M3Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={recordToEdit ? 'Ubah Catatan Perbaikan' : 'Catat Tindakan Perbaikan Jaringan'}
      icon={<Wrench className="w-5 h-5 text-m3-primary" />}
      confirmLabel={recordToEdit ? 'Simpan Perubahan' : 'Simpan Catatan'}
      onConfirm={handleSubmit}
      maxWidth="lg"
    >
      <div className="space-y-4 pt-1">
        {/* Device Selector */}
        <div>
          <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
            Perangkat yang Diperbaiki
          </label>
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full h-12 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest px-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.ip_address}) - {d.location_name}
              </option>
            ))}
          </select>
        </div>

        {/* Problem */}
        <div>
          <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
            Gejala & Masalah yang Ditemukan (Problem)
          </label>
          <textarea
            rows={2}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="contoh: Port flapping terus menerus, latensi tinggi di jam kerja, atau power mati..."
            className="w-full rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest p-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
          />
        </div>

        {/* Action Taken */}
        <div>
          <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
            Tindakan Perbaikan (Action Taken)
          </label>
          <textarea
            rows={2}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="contoh: Mengganti kabel patch cord UTP Cat6, re-crimping RJ45, atau tuning frekuensi WiFi..."
            className="w-full rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest p-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
          />
        </div>

        {/* Result */}
        <div>
          <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
            Hasil Akhir & Kondisi Pasca Perbaikan (Result)
          </label>
          <textarea
            rows={2}
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="contoh: Port kembali up 1 Gbps stabil tanpa packet drop..."
            className="w-full rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest p-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
          />
        </div>

        {/* Status Follow-up */}
        <div>
          <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
            Status Tindak Lanjut Perbaikan
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="repair-status"
                value="berjalan"
                checked={status === 'berjalan'}
                onChange={() => setStatus('berjalan')}
                className="text-amber-500 focus:ring-amber-500"
              />
              <span className="text-amber-600 dark:text-amber-400">
                🟡 Masih Berjalan (In Progress)
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="repair-status"
                value="selesai"
                checked={status === 'selesai'}
                onChange={() => setStatus('selesai')}
                className="text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-emerald-600 dark:text-emerald-400">
                🟢 Telah Selesai (Completed)
              </span>
            </label>
          </div>
        </div>

        {/* Photo Upload & Gallery Attachment */}
        <div className="p-4 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-m3-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-m3-primary" />
              Lampiran Foto Bukti Perbaikan ({photoUrls.length})
            </span>
          </div>

          <div className="flex gap-2">
            <M3TextField
              placeholder="Masukkan URL Foto / Bukti Dokumen..."
              value={photoInput}
              onChange={(e) => setPhotoInput(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddPhoto}
              className="px-4 rounded-m3-full bg-m3-secondary-container text-m3-on-secondary-container text-xs font-semibold hover:bg-m3-secondary-container/80 transition-colors shrink-0"
            >
              Tambah
            </button>
          </div>

          {/* Quick preset photo buttons for rapid demo */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-m3-on-surface-variant">
            <span>Contoh Foto Cepat:</span>
            <button
              type="button"
              onClick={() => handlePresetPhoto('https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60')}
              className="px-2 py-0.5 rounded bg-m3-surface-container-highest hover:text-m3-primary"
            >
              + Kabel Rack
            </button>
            <button
              type="button"
              onClick={() => handlePresetPhoto('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60')}
              className="px-2 py-0.5 rounded bg-m3-surface-container-highest hover:text-m3-primary"
            >
              + Switch Hardware
            </button>
          </div>

          {/* Photo Previews */}
          {photoUrls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
              {photoUrls.map((url, idx) => (
                <div key={idx} className="relative group rounded-m3-lg overflow-hidden border border-m3-outline-variant/40 aspect-video">
                  <img src={url} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </M3Dialog>
  );
};
