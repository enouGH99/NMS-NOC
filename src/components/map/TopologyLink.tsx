'use client';

import React from 'react';
import { Device } from '@/lib/types';
import { formatMbps } from '@/lib/utils';

interface TopologyLinkProps {
  sourceCoords: { x: number; y: number };
  targetCoords: { x: number; y: number };
  sourceDevice: Device;
  targetDevice: Device;
  inboundMbps?: number;
  outboundMbps?: number;
  sourcePort?: string;
  targetPort?: string;
  showThroughputBadge?: boolean;
}

export const TopologyLink: React.FC<TopologyLinkProps> = ({
  sourceCoords,
  targetCoords,
  sourceDevice,
  targetDevice,
  inboundMbps = 0,
  outboundMbps = 0,
  sourcePort,
  targetPort,
  showThroughputBadge = true,
}) => {
  const isHealthy = sourceDevice.status === 'online' && targetDevice.status === 'online';
  const isWarning = sourceDevice.status === 'warning' || targetDevice.status === 'warning';
  const isDown =
    sourceDevice.status === 'offline' ||
    targetDevice.status === 'offline' ||
    sourceDevice.status === 'unreachable' ||
    targetDevice.status === 'unreachable';

  // Dynamic stroke styling based on status
  let strokeColor = '#10b981'; // Emerald
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  if (isWarning) {
    strokeColor = '#f59e0b'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
  } else if (isDown) {
    strokeColor = '#f43f5e'; // Rose
    glowColor = 'rgba(244, 63, 94, 0.4)';
  }

  // Midpoint calculation for floating throughput pill
  const midX = (sourceCoords.x + targetCoords.x) / 2;
  const midY = (sourceCoords.y + targetCoords.y) / 2;

  // Total traffic on this link
  const totalMbps = inboundMbps + outboundMbps;

  // Animation duration: higher Mbps = faster moving particles
  const animDuration = isDown ? '0s' : totalMbps > 50 ? '0.7s' : totalMbps > 15 ? '1.3s' : '2.4s';

  return (
    <g className="transition-all duration-300 select-none">
      {/* 1. Base Glow Outer Line */}
      <line
        x1={sourceCoords.x}
        y1={sourceCoords.y}
        x2={targetCoords.x}
        y2={targetCoords.y}
        stroke={glowColor}
        strokeWidth={isDown ? '2' : '6'}
        strokeLinecap="round"
      />

      {/* 2. Main Cable Core Line */}
      <line
        x1={sourceCoords.x}
        y1={sourceCoords.y}
        x2={targetCoords.x}
        y2={targetCoords.y}
        stroke={strokeColor}
        strokeWidth={isDown ? '1.5' : '2.5'}
        strokeOpacity={isDown ? '0.6' : '0.9'}
        strokeLinecap="round"
      />

      {/* 3. Dynamic Animated Traffic Flow Particles (Only when link is UP) */}
      {!isDown && (
        <line
          x1={sourceCoords.x}
          y1={sourceCoords.y}
          x2={targetCoords.x}
          y2={targetCoords.y}
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray="6 8"
          strokeLinecap="round"
          style={{
            animation: `flowDash ${animDuration} linear infinite`,
          }}
        />
      )}

      {/* 4. Port Labels at Endpoints (if available) */}
      {sourcePort && (
        <text
          x={sourceCoords.x + (targetCoords.x - sourceCoords.x) * 0.15}
          y={sourceCoords.y + (targetCoords.y - sourceCoords.y) * 0.15 - 8}
          textAnchor="middle"
          className="text-[9px] font-mono fill-m3-on-surface-variant/80 select-none font-bold"
        >
          {sourcePort}
        </text>
      )}

      {targetPort && (
        <text
          x={targetCoords.x - (targetCoords.x - sourceCoords.x) * 0.15}
          y={targetCoords.y - (targetCoords.y - sourceCoords.y) * 0.15 - 8}
          textAnchor="middle"
          className="text-[9px] font-mono fill-m3-on-surface-variant/80 select-none font-bold"
        >
          {targetPort}
        </text>
      )}

      {/* 5. Floating Live Mbps Badge at Midpoint */}
      {showThroughputBadge && !isDown && (
        <g transform={`translate(${midX}, ${midY})`} className="cursor-default pointer-events-none">
          {/* Badge Background Pill */}
          <rect
            x="-42"
            y="-10"
            width="84"
            height="20"
            rx="10"
            fill="currentColor"
            className="text-m3-surface-container-high/95 dark:text-m3-surface-container-highest/95 stroke-m3-outline-variant/40"
            strokeWidth="1"
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
          />

          {/* Traffic Text */}
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            className="text-[9px] font-mono font-bold fill-m3-on-surface"
          >
            {inboundMbps > 0 || outboundMbps > 0
              ? `${formatMbps(inboundMbps)}`
              : 'Link Active'}
          </text>
        </g>
      )}

      {/* Down indicator badge if offline */}
      {isDown && (
        <g transform={`translate(${midX}, ${midY})`} className="cursor-default pointer-events-none">
          <rect
            x="-30"
            y="-9"
            width="60"
            height="18"
            rx="9"
            className="fill-rose-900/90 stroke-rose-500/60"
            strokeWidth="1"
          />
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            className="text-[8px] font-mono font-bold fill-rose-200"
          >
            DISCONNECTED
          </text>
        </g>
      )}

      <style jsx>{`
        @keyframes flowDash {
          from {
            stroke-dashoffset: 28;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </g>
  );
};
