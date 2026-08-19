'use client';

import React, { useState } from 'react';
import { Device } from '@/lib/types';
import { DeviceTable } from '@/components/devices/DeviceTable';
import { AddEditDeviceModal } from '@/components/devices/AddEditDeviceModal';
import { PingTestModal } from '@/components/devices/PingTestModal';
import { AddRepairModal } from '@/components/repairs/AddRepairModal';
import { Server } from 'lucide-react';

export default function DevicesPage() {
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<Device | null>(null);

  const [pingModalOpen, setPingModalOpen] = useState(false);
  const [pingTargetDevice, setPingTargetDevice] = useState<Device | null>(null);

  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [repairTargetDevice, setRepairTargetDevice] = useState<Device | null>(null);

  const handleOpenAdd = () => {
    setDeviceToEdit(null);
    setAddEditModalOpen(true);
  };

  const handleOpenEdit = (device: Device) => {
    setDeviceToEdit(device);
    setAddEditModalOpen(true);
  };

  const handleOpenPing = (device: Device) => {
    setPingTargetDevice(device);
    setPingModalOpen(true);
  };

  const handleOpenRepair = (device: Device) => {
    setRepairTargetDevice(device);
    setRepairModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-m3-primary" />
            Pemantauan & Inventaris Perangkat
          </h1>
          <p className="text-xs md:text-sm text-m3-on-surface-variant">
            Daftar lengkap perangkat jaringan kantor, status ketersediaan, konfigurasi SNMP, dan riwayat kesehatan
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DeviceTable
        onOpenAddModal={handleOpenAdd}
        onOpenEditModal={handleOpenEdit}
        onOpenPingModal={handleOpenPing}
        onOpenRepairModal={handleOpenRepair}
      />

      {/* Modal Dialogs */}
      <AddEditDeviceModal
        isOpen={addEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        deviceToEdit={deviceToEdit}
      />

      <PingTestModal
        isOpen={pingModalOpen}
        onClose={() => setPingModalOpen(false)}
        device={pingTargetDevice}
      />

      <AddRepairModal
        isOpen={repairModalOpen}
        onClose={() => setRepairModalOpen(false)}
        initialDevice={repairTargetDevice}
      />
    </div>
  );
}
