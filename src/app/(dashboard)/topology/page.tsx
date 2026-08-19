'use client';

import React from 'react';
import { AutoDiscoveryScanner } from '@/components/topology/AutoDiscoveryScanner';
import { DependencyTree } from '@/components/topology/DependencyTree';
import { CapacityPlanningChart } from '@/components/topology/CapacityPlanningChart';
import { Network } from 'lucide-react';

export default function TopologyDiscoveryPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
          <Network className="w-6 h-6 text-m3-primary" />
          Topologi Lanjutan & Otomasi NMS
        </h1>
        <p className="text-xs md:text-sm text-m3-on-surface-variant">
          Fitur NMS modern: Auto-Discovery pemindaian subnet, pohon dependensi logis (Root Cause Tracking), dan Capacity Planning
        </p>
      </div>

      {/* Auto-Discovery Component */}
      <AutoDiscoveryScanner />

      {/* Dependency Hierarchy Tree */}
      <DependencyTree />

      {/* Capacity Planning Forecast */}
      <CapacityPlanningChart />
    </div>
  );
}
