'use client';

import React, { useState } from 'react';
import { Device } from '@/lib/types';
import { Compass, Eye, EyeOff } from 'lucide-react';

interface TopologyMiniMapProps {
  devices: Device[];
  localCoords: Record<string, { x: number; y: number }>;
  zoom: number;
  pan: { x: number; y: number };
  containerWidth?: number;
  containerHeight?: number;
}

export const TopologyMiniMap: React.FC<TopologyMiniMapProps> = ({
  devices,
  localCoords,
  zoom,
  pan,
  containerWidth = 1100,
  containerHeight = 650,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Mini-map dimensions
  const miniW = 160;
  const miniH = 100;
  const scaleX = miniW / 1200;
  const scaleY = miniH / 800;

  // Viewport box dimensions on mini-map
  const vpWidth = (containerWidth / zoom) * scaleX;
  const vpHeight = (containerHeight / zoom) * scaleY;
  const vpX = (-pan.x / zoom) * scaleX;
  const vpY = (-pan.y / zoom) * scaleY;

  return (
    <div className="absolute bottom-4 left-4 z-20 select-none">
      <div className="rounded-m3-2xl bg-m3-surface-container/90 backdrop-blur-md border border-m3-outline-variant/40 shadow-m3-2 overflow-hidden transition-all duration-200">
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-m3-outline-variant/30 flex items-center justify-between gap-2 text-[10px] font-bold text-m3-on-surface-variant bg-m3-surface-container-high/60">
          <div className="flex items-center gap-1.5 text-m3-primary">
            <Compass className="w-3 h-3" />
            <span>Mini-Map Radar</span>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:text-m3-on-surface rounded transition-colors"
            title={collapsed ? 'Tampilkan Mini-Map' : 'Sembunyikan'}
          >
            {collapsed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>

        {/* Mini Radar Canvas */}
        {!collapsed && (
          <div className="p-2 relative bg-m3-surface-container-lowest/80">
            <svg
              width={miniW}
              height={miniH}
              className="rounded-lg bg-m3-surface/60 border border-m3-outline-variant/20"
            >
              {/* Device Nodes as Miniature Dots */}
              {devices.map((d) => {
                const coords = localCoords[d.id] || d.coordinates || { x: 500, y: 350 };
                const dotX = coords.x * scaleX;
                const dotY = coords.y * scaleY;

                let fill = '#10b981'; // Green
                if (d.status === 'warning') fill = '#f59e0b'; // Amber
                else if (d.status === 'offline' || d.status === 'unreachable') fill = '#f43f5e'; // Rose

                return (
                  <circle
                    key={`mini-${d.id}`}
                    cx={Math.max(4, Math.min(miniW - 4, dotX))}
                    cy={Math.max(4, Math.min(miniH - 4, dotY))}
                    r={d.type === 'router' ? 4 : 2.5}
                    fill={fill}
                    className="transition-all"
                  />
                );
              })}

              {/* Viewport Box (Current camera view) */}
              <rect
                x={Math.max(0, vpX)}
                y={Math.max(0, vpY)}
                width={Math.min(miniW, vpWidth)}
                height={Math.min(miniH, vpHeight)}
                fill="rgba(56, 189, 248, 0.15)"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                rx="2"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
