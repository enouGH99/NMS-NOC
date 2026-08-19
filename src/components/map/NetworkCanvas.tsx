'use client';

import React, { useState, useRef } from 'react';
import { Device, DeviceStatus } from '@/lib/types';
import { getStatusM3Badge } from '@/lib/m3-theme';
import {
  Router,
  Server,
  Wifi,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react';

interface NetworkCanvasProps {
  devices: Device[];
  selectedLocation: string;
  selectedType: string;
  onSelectDevice: (device: Device) => void;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  devices,
  selectedLocation,
  selectedType,
  onSelectDevice,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const filteredDevices = devices.filter((d) => {
    if (selectedLocation !== 'all' && d.location_id !== selectedLocation) return false;
    if (selectedType !== 'all' && d.type !== selectedType) return false;
    return true;
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag canvas if not clicking directly on interactive nodes
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'map-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeIcon = (type: Device['type']) => {
    switch (type) {
      case 'router':
        return <Router className="w-5 h-5" />;
      case 'switch':
        return <Layers className="w-5 h-5" />;
      case 'access_point':
        return <Wifi className="w-5 h-5" />;
      case 'server':
        return <Server className="w-5 h-5" />;
      case 'firewall':
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div
      className="relative w-full h-[650px] bg-m3-surface-container-lowest rounded-m3-3xl border border-m3-outline-variant/30 overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-inner"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Blueprint Grid */}
      <div
        id="map-bg"
        className="absolute inset-0 opacity-20 dark:opacity-30 pointer-events-auto"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(140, 145, 153, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(140, 145, 153, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-10 p-3 rounded-m3-xl bg-m3-surface-container/80 backdrop-blur-md border border-m3-outline-variant/30 text-xs space-y-1.5 pointer-events-none">
        <div className="font-bold text-m3-on-surface">Status Node Topologi</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span className="text-m3-on-surface-variant font-medium">Online (Sehat)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
          <span className="text-m3-on-surface-variant font-medium">Warning (Degradasi)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
          <span className="text-m3-on-surface-variant font-medium">Offline (Down)</span>
        </div>
      </div>

      {/* Floating Map Controls (FABs) */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 bg-m3-surface-container/90 p-1.5 rounded-m3-full border border-m3-outline-variant/30 shadow-m3-2 backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
          className="p-2.5 rounded-full hover:bg-m3-on-surface/8 text-m3-on-surface transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
          className="p-2.5 rounded-full hover:bg-m3-on-surface/8 text-m3-on-surface transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-2.5 rounded-full hover:bg-m3-on-surface/8 text-m3-on-surface transition-colors"
          title="Reset Posisi & Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Scalable & Pannable SVG Container */}
      <div
        className="absolute inset-0 origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <svg className="w-full h-full min-w-[1000px] min-h-[700px] overflow-visible">
          {/* Connection Cables / Links between Parent and Child devices */}
          {devices.map((device) => {
            if (!device.parent_device_id || !device.coordinates) return null;
            const parent = devices.find((d) => d.id === device.parent_device_id);
            if (!parent || !parent.coordinates) return null;

            const isLinkHealthy = device.status === 'online' && parent.status === 'online';
            const isLinkWarning = device.status === 'warning' || parent.status === 'warning';
            const isLinkDown = device.status === 'offline' || parent.status === 'offline';

            let strokeColor = '#10b981'; // Green
            let strokeClass = 'animate-flow-healthy';
            if (isLinkWarning) {
              strokeColor = '#f59e0b';
              strokeClass = 'animate-flow-healthy';
            } else if (isLinkDown) {
              strokeColor = '#f43f5e';
              strokeClass = '';
            }

            return (
              <g key={`link-${device.id}-${parent.id}`}>
                {/* Base Cable Glow */}
                <line
                  x1={parent.coordinates.x}
                  y1={parent.coordinates.y}
                  x2={device.coordinates.x}
                  y2={device.coordinates.y}
                  stroke={strokeColor}
                  strokeWidth="3"
                  strokeOpacity="0.4"
                />
                {/* Flow Animated Packet Line */}
                <line
                  x1={parent.coordinates.x}
                  y1={parent.coordinates.y}
                  x2={device.coordinates.x}
                  y2={device.coordinates.y}
                  stroke={strokeColor}
                  strokeWidth="2"
                  className={strokeClass}
                />
              </g>
            );
          })}
        </svg>

        {/* Device Interactive Nodes */}
        {filteredDevices.map((device) => {
          if (!device.coordinates) return null;
          const statusBadge = getStatusM3Badge(device.status);

          return (
            <div
              key={device.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDevice(device);
              }}
              style={{
                left: `${device.coordinates.x}px`,
                top: `${device.coordinates.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-20 cursor-pointer group select-none"
            >
              {/* Pulse status halo */}
              <div
                className={`absolute -inset-2 rounded-full opacity-30 ${
                  device.status === 'warning'
                    ? 'bg-amber-500 animate-ping'
                    : device.status === 'offline'
                    ? 'bg-rose-500'
                    : 'bg-emerald-500 group-hover:animate-ping'
                }`}
              />

              {/* Node Card Container */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-13 h-13 rounded-m3-2xl p-3 flex items-center justify-center transition-all duration-200 border-2 shadow-m3-2 group-hover:scale-115 group-hover:shadow-m3-3 ${
                    device.status === 'online'
                      ? 'bg-m3-surface-container-high border-emerald-500 text-emerald-400'
                      : device.status === 'warning'
                      ? 'bg-m3-surface-container-high border-amber-500 text-amber-400 animate-bounce'
                      : 'bg-m3-surface-container border-rose-500 text-rose-400'
                  }`}
                >
                  {getNodeIcon(device.type)}
                </div>

                {/* Node Label Card */}
                <div className="mt-2 px-2.5 py-1 rounded-m3-md bg-m3-surface-container/95 border border-m3-outline-variant/40 shadow-sm text-center max-w-[140px] pointer-events-none group-hover:scale-105 transition-transform">
                  <div className="text-[11px] font-bold text-m3-on-surface truncate">
                    {device.name}
                  </div>
                  <div className="text-[10px] font-mono text-m3-on-surface-variant">
                    {device.ip_address}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
