'use client';

import React, { useState, useEffect } from 'react';
import { Device, DeviceType } from '@/lib/types';
import { useNms } from '@/lib/store';
import { M3Dialog } from '../m3/M3Dialog';
import { M3TextField } from '../m3/M3TextField';
import { M3Switch } from '../m3/M3Switch';
import { M3Button } from '../m3/M3Button';
import {
  Server,
  ShieldCheck,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Building,
  Plus,
  X,
  MapPin,
  Cpu,
  Network,
  Tag,
} from 'lucide-react';
import { initialLocations } from '@/lib/mock-data';

interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceToEdit?: Device | null;
}

export const AddEditDeviceModal: React.FC<AddEditDeviceModalProps> = ({
  isOpen,
  onClose,
  deviceToEdit,
}) => {
  const { locations, addLocation, addDevice, updateDevice, testSnmpConnection } = useNms();

  const availableLocations = locations.length > 0 ? locations : initialLocations;

  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>('router');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [model, setModel] = useState('');
  const [locationId, setLocationId] = useState(availableLocations[0]?.id || 'loc-1');
  const [isPriority, setIsPriority] = useState(false);
  const [snmpVersion, setSnmpVersion] = useState<'v2c' | 'v3'>('v2c');
  const [snmpCommunity, setSnmpCommunity] = useState('public_nms');
  const [v3User, setV3User] = useState('');
  const [v3AuthKey, setV3AuthKey] = useState('');
  const [v3PrivKey, setV3PrivKey] = useState('');

  // Inline Add Location Form State
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocBuilding, setNewLocBuilding] = useState('');
  const [newLocFloor, setNewLocFloor] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');

  const [testingSnmp, setTestingSnmp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  useEffect(() => {
    if (deviceToEdit) {
      setName(deviceToEdit.name);
      setType(deviceToEdit.type);
      setIpAddress(deviceToEdit.ip_address);
      setMacAddress(deviceToEdit.mac_address);
      setModel(deviceToEdit.model);
      setLocationId(deviceToEdit.location_id || availableLocations[0]?.id || 'loc-1');
      setIsPriority(deviceToEdit.is_priority);
      setSnmpVersion(deviceToEdit.snmp_version);
      setSnmpCommunity(deviceToEdit.snmp_community || 'public_nms');
      if (deviceToEdit.snmp_v3) {
        setV3User(deviceToEdit.snmp_v3.username);
        setV3AuthKey(deviceToEdit.snmp_v3.auth_key);
        setV3PrivKey(deviceToEdit.snmp_v3.privacy_key);
      }
    } else {
      setName('');
      setType('router');
      setIpAddress('');
      setMacAddress('');
      setModel('');
      setLocationId(availableLocations[0]?.id || 'loc-1');
      setIsPriority(false);
      setSnmpVersion('v2c');
      setSnmpCommunity('public_nms');
      setV3User('');
      setV3AuthKey('');
      setV3PrivKey('');
    }
    setTestResult(null);
    setShowAddLocation(false);
  }, [deviceToEdit, locations]);

  const handleCreateNewLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newLocName.trim() || !newLocBuilding.trim()) return;

    const newId = `loc-${Date.now()}`;
    addLocation({
      name: newLocName.trim(),
      building: newLocBuilding.trim(),
      floor: newLocFloor.trim() || 'Lantai 1',
      description: newLocDesc.trim() || undefined,
      device_count: 0,
    });

    setLocationId(newId);
    setNewLocName('');
    setNewLocBuilding('');
    setNewLocFloor('');
    setNewLocDesc('');
    setShowAddLocation(false);
  };

  const handleTestSnmp = async () => {
    if (!ipAddress) {
      setTestResult({ success: false, message: 'Alamat IP wajib diisi terlebih dahulu' });
      return;
    }

    setTestingSnmp(true);
    setTestResult(null);

    try {
      const res = await testSnmpConnection({
        ipAddress,
        version: snmpVersion,
        community: snmpCommunity,
        snmpV3:
          snmpVersion === 'v3'
            ? {
                username: v3User,
                auth_protocol: 'SHA',
                auth_key: v3AuthKey,
                privacy_protocol: 'AES',
                privacy_key: v3PrivKey,
              }
            : undefined,
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: `Berhasil tersambung ke perangkat! Response: OK`,
          latency: res.data?.latencyMs || 4,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'SNMP Port 161 UDP timeout / tidak merespons.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal melakukan handshake SNMP',
      });
    } finally {
      setTestingSnmp(false);
    }
  };

  const handleSubmit = () => {
    if (!name || !ipAddress) return;

    if (deviceToEdit) {
      updateDevice(deviceToEdit.id, {
        name,
        type,
        ip_address: ipAddress,
        mac_address: macAddress,
        model,
        location_id: locationId,
        is_priority: isPriority,
        snmp_version: snmpVersion,
        snmp_community: snmpCommunity,
        snmp_v3:
          snmpVersion === 'v3'
            ? {
                username: v3User,
                auth_protocol: 'SHA',
                auth_key: v3AuthKey,
                privacy_protocol: 'AES',
                privacy_key: v3PrivKey,
              }
            : undefined,
      });
    } else {
      addDevice({
        name,
        type,
        ip_address: ipAddress,
        mac_address: macAddress || '00:00:00:00:00:00',
        model: model || 'Generic Network Device',
        location_id: locationId,
        is_priority: isPriority,
        status: 'online',
        uptime: 'Baru ditambahkan',
        cpu_usage: 10,
        ram_usage: 20,
        storage_usage: 15,
        temperature: 36,
        latency: 4,
        packet_loss: 0,
        snmp_version: snmpVersion,
        snmp_community: snmpCommunity,
        snmp_v3:
          snmpVersion === 'v3'
            ? {
                username: v3User,
                auth_protocol: 'SHA',
                auth_key: v3AuthKey,
                privacy_protocol: 'AES',
                privacy_key: v3PrivKey,
              }
            : undefined,
        coordinates: { x: 400 + Math.floor(Math.random() * 200), y: 300 + Math.floor(Math.random() * 150) },
      });
    }

    onClose();
  };

  return (
    <M3Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={deviceToEdit ? 'Ubah Konfigurasi Perangkat' : 'Tambah Perangkat Jaringan'}
      icon={<Server className="w-5 h-5" />}
      confirmLabel={deviceToEdit ? 'Simpan Perubahan' : 'Tambahkan Perangkat'}
      onConfirm={handleSubmit}
      maxWidth="3xl"
    >
      <div className="space-y-5 pt-1">
        {/* Section 1: Identitas & Lokasi Perangkat */}
        <div className="p-4 sm:p-5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-m3-outline-variant/20 text-xs font-bold text-m3-on-surface uppercase tracking-wider">
            <Tag className="w-4 h-4 text-m3-primary" />
            <span>Identitas & Penempatan Fisik Perangkat</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <M3TextField
              label="Nama Perangkat"
              placeholder="contoh: MikroTik CCR2004 (Core Gateway)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <M3TextField
              label="Model & Spesifikasi Hardware"
              placeholder="contoh: MikroTik CCR2004-16G-2S+ / Cisco 2960"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider mb-1.5">
                Tipe Node Jaringan
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DeviceType)}
                className="w-full h-12 px-4 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant text-xs sm:text-sm font-semibold text-m3-on-surface focus:outline-hidden focus:border-m3-primary transition-colors"
              >
                <option value="router">Router / Gateway</option>
                <option value="switch">Switch Distribution / Core</option>
                <option value="access_point">Wireless Access Point</option>
                <option value="server">Physical / VM Server</option>
                <option value="firewall">Hardware Firewall</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider">
                  Lokasi / Gedung
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddLocation(!showAddLocation)}
                  className="text-[11px] font-bold text-m3-primary hover:underline flex items-center gap-1 transition-colors"
                >
                  {showAddLocation ? (
                    <>
                      <X className="w-3 h-3" /> Tutup Form
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" /> Tambah Lokasi
                    </>
                  )}
                </button>
              </div>

              <select
                value={locationId}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setShowAddLocation(true);
                  } else {
                    setLocationId(e.target.value);
                  }
                }}
                className="w-full h-12 px-4 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant text-xs sm:text-sm font-semibold text-m3-on-surface focus:outline-hidden focus:border-m3-primary transition-colors truncate"
              >
                {availableLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.building} - {loc.floor})
                  </option>
                ))}
                <option value="__add_new__">➕ + Tambah Lokasi / Gedung Baru...</option>
              </select>
            </div>
          </div>

          {/* Inline Add Location Panel */}
          {showAddLocation && (
            <div className="p-4 rounded-m3-2xl bg-m3-surface-container-high border border-m3-primary/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-m3-outline-variant/20 pb-2">
                <span className="text-xs font-bold text-m3-primary flex items-center gap-1.5">
                  <Building className="w-4 h-4" /> Form Tambah Lokasi Gedung Baru
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddLocation(false)}
                  className="text-m3-on-surface-variant hover:text-m3-on-surface"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <M3TextField
                    label="Nama Lokasi"
                    placeholder="contoh: Ruang Server 2"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  <M3TextField
                    label="Nama Gedung"
                    placeholder="contoh: Gedung B"
                    value={newLocBuilding}
                    onChange={(e) => setNewLocBuilding(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  <M3TextField
                    label="Lantai"
                    placeholder="contoh: Lantai 2"
                    value={newLocFloor}
                    onChange={(e) => setNewLocFloor(e.target.value)}
                  />
                </div>
              </div>

              <M3TextField
                label="Deskripsi / Catatan Lokasi (Opsional)"
                placeholder="contoh: Ruang NOC & Rack Switch Distribusi"
                value={newLocDesc}
                onChange={(e) => setNewLocDesc(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-1">
                <M3Button
                  size="sm"
                  variant="outlined"
                  type="button"
                  onClick={() => setShowAddLocation(false)}
                >
                  Batal
                </M3Button>
                <M3Button
                  size="sm"
                  variant="filled"
                  type="button"
                  onClick={handleCreateNewLocation}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Simpan Lokasi
                </M3Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            <M3TextField
              label="Alamat IP (Management / SNMP)"
              placeholder="contoh: 192.168.1.1"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              required
            />
            <M3TextField
              label="MAC Address"
              placeholder="contoh: DC:2C:6E:8A:11:01"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
            />
          </div>

          <div className="pt-1">
            <M3Switch
              checked={isPriority}
              onChange={setIsPriority}
              label="Tandai Sebagai Perangkat Prioritas / Kritis (High SLA)"
            />
          </div>
        </div>

        {/* Section 2: SNMP Settings Box */}
        <div className="p-4 sm:p-5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-m3-outline-variant/20">
            <div className="flex items-center gap-2 font-bold text-xs text-m3-on-surface uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-m3-primary" />
              <span>Konfigurasi Protokol SNMP (Telemetri Realtime)</span>
            </div>

            <M3Button
              size="sm"
              variant="outlined"
              loading={testingSnmp}
              onClick={handleTestSnmp}
              icon={<Radio className="w-3.5 h-3.5" />}
            >
              Uji Polling SNMP
            </M3Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-m3-on-surface">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 hover:border-m3-primary/40 transition-colors">
              <input
                type="radio"
                name="snmp-ver"
                value="v2c"
                checked={snmpVersion === 'v2c'}
                onChange={() => setSnmpVersion('v2c')}
                className="text-m3-primary focus:ring-m3-primary"
              />
              <span>SNMP v2c (Community String)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 hover:border-m3-primary/40 transition-colors">
              <input
                type="radio"
                name="snmp-ver"
                value="v3"
                checked={snmpVersion === 'v3'}
                onChange={() => setSnmpVersion('v3')}
                className="text-m3-primary focus:ring-m3-primary"
              />
              <span>SNMP v3 (Auth SHA & Priv AES)</span>
            </label>
          </div>

          {snmpVersion === 'v2c' ? (
            <M3TextField
              label="Community String"
              placeholder="contoh: public_nms"
              value={snmpCommunity}
              onChange={(e) => setSnmpCommunity(e.target.value)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <M3TextField
                label="Username SNMP v3"
                value={v3User}
                onChange={(e) => setV3User(e.target.value)}
              />
              <M3TextField
                label="Auth Key (SHA)"
                type="password"
                value={v3AuthKey}
                onChange={(e) => setV3AuthKey(e.target.value)}
              />
              <M3TextField
                label="Privacy Key (AES)"
                type="password"
                value={v3PrivKey}
                onChange={(e) => setV3PrivKey(e.target.value)}
              />
            </div>
          )}

          {/* Test SNMP result alert */}
          {testResult && (
            <div
              className={`p-3.5 rounded-m3-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold">{testResult.message}</span>
                {testResult.latency && (
                  <span className="block text-[11px] font-mono opacity-80 mt-0.5">
                    Latensi Respon UDP: {testResult.latency} ms
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </M3Dialog>
  );
};
