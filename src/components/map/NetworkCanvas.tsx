'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Device } from '@/lib/types';
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
  Move,
} from 'lucide-react';

interface NetworkCanvasProps {
  devices: Device[];
  selectedLocation: string;
  selectedType: string;
  onSelectDevice: (device: Device) => void;
  onUpdateCoordinates?: (id: string, coords: { x: number; y: number }) => void;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  devices,
  selectedLocation,
  selectedType,
  onSelectDevice,
  onUpdateCoordinates,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Realtime coordinates for all devices on canvas
  const [localCoords, setLocalCoords] = useState<Record<string, { x: number; y: number }>>({});

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartInfo, setDragStartInfo] = useState<{
    clientX: number;
    clientY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [hasMovedNode, setHasMovedNode] = useState(false);

  // Synchronize and auto-layout overlapping coordinates
  useEffect(() => {
    const coordsMap: Record<string, { x: number; y: number }> = {};
    const rootRouter = devices.find(
      (d) => d.type === 'router' || d.name.toLowerCase().includes('mikrotik')
    ) || devices[0];

    // Find if devices are overlapping at identical coordinates (e.g. both at 400, 300)
    devices.forEach((d, idx) => {
      let x = d.coordinates?.x ?? 450;
      let y = d.coordinates?.y ?? 250;

      // If router, keep near top center
      if (d.id === rootRouter?.id) {
        x = d.coordinates?.x ?? 450;
        y = d.coordinates?.y ?? 160;
      } else {
        // If not router and has no distinct coordinates or overlaps exactly with router
        if (
          !d.coordinates ||
          (d.coordinates.x === rootRouter?.coordinates?.x && d.coordinates.y === rootRouter?.coordinates?.y) ||
          (x === 400 && y === 300 && d.id !== rootRouter?.id)
        ) {
          const nonRootIndex = devices.filter((dev) => dev.id !== rootRouter?.id).indexOf(d);
          const cols = 3;
          const col = nonRootIndex % cols;
          const row = Math.floor(nonRootIndex / cols);
          x = 280 + col * 200;
          y = 350 + row * 160;
        }
      }

      coordsMap[d.id] = { x, y };
    });

    setLocalCoords(coordsMap);
  }, [devices]);

  const filteredDevices = devices.filter((d) => {
    if (selectedLocation !== 'all' && d.location_id !== selectedLocation) return false;
    if (selectedType !== 'all' && d.type !== selectedType) return false;
    return true;
  });

  // Background Canvas Pan Handling
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background, not a device node
    if ((e.target as HTMLElement).id === 'map-bg' || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId && dragStartInfo) {
      // Calculate delta in canvas coordinate space accounting for zoom
      const deltaX = (e.clientX - dragStartInfo.clientX) / zoom;
      const deltaY = (e.clientY - dragStartInfo.clientY) / zoom;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setHasMovedNode(true);
      }

      const newX = Math.round(dragStartInfo.origX + deltaX);
      const newY = Math.round(dragStartInfo.origY + deltaY);

      setLocalCoords((prev) => ({
        ...prev,
        [draggingNodeId]: { x: newX, y: newY },
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
      if (hasMovedNode && onUpdateCoordinates) {
        const finalPos = localCoords[draggingNodeId];
        if (finalPos) {
          onUpdateCoordinates(draggingNodeId, finalPos);
        }
      }
      setDraggingNodeId(null);
      setDragStartInfo(null);
      setHasMovedNode(false);
    }
    setIsPanning(false);
  };

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, device: Device) => {
    e.stopPropagation();
    // Only primary mouse button (left-click)
    if (e.button !== 0) return;

    const currentPos = localCoords[device.id] || device.coordinates || { x: 450, y: 300 };
    setDraggingNodeId(device.id);
    setHasMovedNode(false);
    setDragStartInfo({
      clientX: e.clientX,
      clientY: e.clientY,
      origX: currentPos.x,
      origY: currentPos.y,
    });
  };

  const handleNodeClick = (device: Device) => {
    if (!hasMovedNode) {
      onSelectDevice(device);
    }
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

  // Find root gateway router
  const rootRouter =
    devices.find((d) => d.type === 'router' || d.name.toLowerCase().includes('mikrotik')) || devices[0];

  return (
    <div
      className="relative w-full h-[650px] bg-m3-surface-container-lowest rounded-m3-3xl border border-m3-outline-variant/30 overflow-hidden select-none cursor-default shadow-inner"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Blueprint Grid Background */}
      <div
        id="map-bg"
        className="absolute inset-0 opacity-20 dark:opacity-30 cursor-grab active:cursor-grabbing"
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
        <div className="pt-1 border-t border-m3-outline-variant/20 text-[10px] text-m3-primary flex items-center gap-1">
          <Move className="w-3 h-3" />
          <span>Klik & geser node untuk atur posisi</span>
        </div>
      </div>

      {/* Floating Map Controls */}
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
        className="absolute inset-0 origin-top-left transition-transform duration-75 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Animated Connection Lines / Cables */}
        <svg className="w-full h-full min-w-[1200px] min-h-[800px] overflow-visible">
          {devices.map((device) => {
            // Find parent device: explicit parent_device_id or default to root router
            const parentId =
              device.parent_device_id || (device.id !== rootRouter?.id && rootRouter ? rootRouter.id : undefined);

            if (!parentId || device.id === parentId) return null;
            const parent = devices.find((d) => d.id === parentId);
            if (!parent) return null;

            const childCoords = localCoords[device.id] || device.coordinates || { x: 450, y: 350 };
            const parentCoords = localCoords[parent.id] || parent.coordinates || { x: 450, y: 160 };

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
                {/* Base Cable Glow Line */}
                <line
                  x1={parentCoords.x}
                  y1={parentCoords.y}
                  x2={childCoords.x}
                  y2={childCoords.y}
                  stroke={strokeColor}
                  strokeWidth="3"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />
                {/* Animated Packet Flow Line */}
                <line
                  x1={parentCoords.x}
                  y1={parentCoords.y}
                  x2={childCoords.x}
                  y2={childCoords.y}
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  className={strokeClass}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>

        {/* Interactive Draggable Device Nodes */}
        {filteredDevices.map((device) => {
          const coords = localCoords[device.id] || device.coordinates || { x: 450, y: 300 };
          const statusBadge = getStatusM3Badge(device.status);
          const isBeingDragged = draggingNodeId === device.id;

          return (
            <div
              key={device.id}
              onMouseDown={(e) => handleNodeMouseDown(e, device)}
              onClick={() => handleNodeClick(device)}
              style={{
                left: `${coords.x}px`,
                top: `${coords.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute z-20 select-none pointer-events-auto transition-shadow ${
                isBeingDragged
                  ? 'cursor-grabbing scale-110 z-30 shadow-2xl'
                  : 'cursor-grab group'
              }`}
            >
              {/* Pulse Status Halo */}
              <div
                className={`absolute -inset-2 rounded-full opacity-30 ${
                  device.status === 'warning'
                    ? 'bg-amber-500 animate-ping'
                    : device.status === 'offline'
                    ? 'bg-rose-500'
                    : isBeingDragged
                    ? 'bg-emerald-400'
                    : 'bg-emerald-500 group-hover:animate-ping'
                }`}
              />

              {/* Node Card Container */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-13 h-13 rounded-m3-2xl p-3 flex items-center justify-center transition-all duration-150 border-2 shadow-m3-2 ${
                    isBeingDragged
                      ? 'scale-115 ring-4 ring-m3-primary/30 border-m3-primary bg-m3-surface-container-highest text-m3-primary'
                      : 'group-hover:scale-110'
                  } ${
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
                <div className="mt-2 px-2.5 py-1 rounded-m3-md bg-m3-surface-container/95 border border-m3-outline-variant/40 shadow-sm text-center max-w-[150px] pointer-events-none group-hover:scale-105 transition-transform backdrop-blur-sm">
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
