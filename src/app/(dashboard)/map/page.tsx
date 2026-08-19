'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { Device } from '@/lib/types';
import { NetworkCanvas } from '@/components/map/NetworkCanvas';
import { FloorFilter } from '@/components/map/FloorFilter';
import { DeviceDetailSheet } from '@/components/map/DeviceDetailSheet';
import { AddRepairModal } from '@/components/repairs/AddRepairModal';
import { Map, Info } from 'lucide-react';

export default function MapPage() {
  const { devices, locations } = useNms();

  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [deviceForRepair, setDeviceForRepair] = useState<Device | null>(null);

  const handleSelectDevice = (dev: Device) => {
    setSelectedDevice(dev);
    setDetailSheetOpen(true);
  };

  const handleOpenRepair = (dev: Device) => {
    setDeviceForRepair(dev);
    setRepairModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
              <Map className="w-6 h-6 text-m3-primary" />
              Peta Jaringan Interaktif (Network Topology)
            </h1>
            <p className="text-xs md:text-sm text-m3-on-surface-variant">
              Visualisasi tata letak perangkat, jalur kabel, aliran data real-time, dan status kesehatan
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-m3-on-surface-variant bg-m3-surface-container-high px-3 py-1.5 rounded-m3-full border border-m3-outline-variant/30">
            <Info className="w-3.5 h-3.5 text-m3-primary" />
            <span>Klik node perangkat untuk membuka inspeksi & tes ping</span>
          </div>
        </div>

        {/* Floor and Type Filter Bar */}
        <FloorFilter
          locations={locations}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />
      </div>

      {/* Main Interactive Map Canvas */}
      <NetworkCanvas
        devices={devices}
        selectedLocation={selectedLocation}
        selectedType={selectedType}
        onSelectDevice={handleSelectDevice}
      />

      {/* Side Sheet Detail Inspector */}
      <DeviceDetailSheet
        device={selectedDevice}
        isOpen={detailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        onOpenRepairModal={handleOpenRepair}
      />

      {/* Quick Add Repair Modal triggered from Map */}
      <AddRepairModal
        isOpen={repairModalOpen}
        onClose={() => setRepairModalOpen(false)}
        initialDevice={deviceForRepair}
      />
    </div>
  );
}
