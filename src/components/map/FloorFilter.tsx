'use client';

import React from 'react';
import { M3Chip } from '../m3/M3Chip';
import { Location } from '@/lib/types';
import { Building2, Layers, Filter } from 'lucide-react';

interface FloorFilterProps {
  locations: Location[];
  selectedLocation: string;
  onSelectLocation: (locId: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
}

export const FloorFilter: React.FC<FloorFilterProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  selectedType,
  onSelectType,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-m3-2xl bg-m3-surface-container/70 border border-m3-outline-variant/30 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-bold text-m3-on-surface-variant mr-1">
        <Building2 className="w-4 h-4 text-m3-primary" />
        <span>Lokasi / Area:</span>
      </div>

      <M3Chip
        selected={selectedLocation === 'all'}
        onClick={() => onSelectLocation('all')}
      >
        Semua Area ({locations.reduce((acc, l) => acc + (l.device_count || 0), 0)})
      </M3Chip>

      {locations.map((loc) => (
        <M3Chip
          key={loc.id}
          selected={selectedLocation === loc.id}
          onClick={() => onSelectLocation(loc.id)}
        >
          {loc.name} {loc.device_count ? `(${loc.device_count})` : ''}
        </M3Chip>
      ))}

      <div className="h-4 w-px bg-m3-outline-variant/40 mx-2 hidden sm:block" />

      <div className="flex items-center gap-1.5 text-xs font-bold text-m3-on-surface-variant mr-1">
        <Filter className="w-4 h-4 text-m3-primary" />
        <span>Tipe:</span>
      </div>

      {[
        { id: 'all', label: 'Semua Tipe' },
        { id: 'router', label: 'Router' },
        { id: 'switch', label: 'Switch' },
        { id: 'access_point', label: 'Access Point' },
        { id: 'server', label: 'Server' },
      ].map((t) => (
        <M3Chip
          key={t.id}
          selected={selectedType === t.id}
          onClick={() => onSelectType(t.id)}
        >
          {t.label}
        </M3Chip>
      ))}
    </div>
  );
};
