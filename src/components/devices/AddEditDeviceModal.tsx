'use client';

import React, { useState, useEffect } from 'react';
import { Device, DeviceType } from '@/lib/types';
import { useNms } from '@/lib/store';
import { M3Dialog } from '../m3/M3Dialog';
import { M3TextField } from '../m3/M3TextField';
import { M3Switch } from '../m3/M3Switch';
import { Server, ShieldCheck } from 'lucide-react';

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
  const { locations, addDevice, updateDevice } = useNms();

  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>('router');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [model, setModel] = useState('');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [isPriority, setIsPriority] = useState(false);
  const [snmpVersion, setSnmpVersion] = useState<'v2c' | 'v3'>('v2c');
  const [snmpCommunity, setSnmpCommunity] = useState('public_nms');
  const [v3User, setV3User] = useState('');
  const [v3AuthKey, setV3AuthKey] = useState('');
  const [v3PrivKey, setV3PrivKey] = useState('');

  useEffect(() => {
    if (deviceToEdit) {
      setName(deviceToEdit.name);
      setType(deviceToEdit.type);
      setIpAddress(deviceToEdit.ip_address);
      setMacAddress(deviceToEdit.mac_address);
      setModel(deviceToEdit.model);
      setLocationId(deviceToEdit.location_id);
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
      setLocationId(locations[0]?.id || '');
      setIsPriority(false);
      setSnmpVersion('v2c');
      setSnmpCommunity('public_nms');
      setV3User('');
      setV3AuthKey('');
      setV3PrivKey('');
    }
  }, [deviceToEdit, locations]);

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
      maxWidth="lg"
    >
      <div className="space-y-4 pt-1">
        <M3TextField
          label="Nama Perangkat"
          placeholder="contoh: Switch Gedung B Lantai 2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
              Jenis / Tipe Perangkat
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DeviceType)}
              className="w-full h-12 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest px-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
            >
              <option value="router">Router Gateway</option>
              <option value="switch">Switch / Hub</option>
              <option value="access_point">Access Point (WiFi)</option>
              <option value="server">Server & Storage</option>
              <option value="firewall">Firewall / Security</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
              Lokasi Penempatan
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full h-12 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest px-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <M3TextField
            label="Alamat IP (Management / SNMP)"
            placeholder="contoh: 192.168.1.1"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
          />
          <M3TextField
            label="MAC Address"
            placeholder="contoh: DC:2C:6E:8A:11:01"
            value={macAddress}
            onChange={(e) => setMacAddress(e.target.value)}
          />
        </div>

        <M3TextField
          label="Model & Spesifikasi Hardware"
          placeholder="contoh: MikroTik CCR2004-16G-2S+ / Cisco Catalyst 2960"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />

        <div className="pt-2">
          <M3Switch
            checked={isPriority}
            onChange={setIsPriority}
            label="Tandai Sebagai Perangkat Prioritas / Kritis (High SLA)"
          />
        </div>

        {/* SNMP Settings Accordion Box */}
        <div className="p-4 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/40 space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs text-m3-on-surface uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-m3-primary" />
            <span>Konfigurasi Protokol SNMP</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-m3-on-surface">
            <label className="flex items-center gap-1.5 cursor-pointer">
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
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="snmp-ver"
                value="v3"
                checked={snmpVersion === 'v3'}
                onChange={() => setSnmpVersion('v3')}
                className="text-m3-primary focus:ring-m3-primary"
              />
              <span>SNMP v3 (Auth & Priv Encryption)</span>
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
        </div>
      </div>
    </M3Dialog>
  );
};
