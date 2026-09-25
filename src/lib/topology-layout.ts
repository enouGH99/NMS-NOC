/**
 * Topology Auto-Layout Algorithm Engine
 * NMS NOC Platform — SUNDAYA IT Infrastructure
 *
 * Provides intelligent layout arrangement algorithms for network devices:
 * 1. Hierarchical (Top-Down Tree: Gateway -> Core -> Distribution -> Endpoints)
 * 2. Radial (Concentric Rings with Core Gateway in the center)
 * 3. Grid Auto-Pack (Clean matrix grouped by type or location)
 */

import { Device } from './types';

export type LayoutMode = 'hierarchical' | 'radial' | 'grid';

/**
 * Hierarchical (Top-Down Tree) Layout
 */
export function calculateHierarchicalLayout(
  devices: Device[],
  canvasWidth = 1100,
  canvasHeight = 700
): Record<string, { x: number; y: number }> {
  const coords: Record<string, { x: number; y: number }> = {};
  if (devices.length === 0) return coords;

  // Determine root devices (no parent_device_id or type router)
  const rootRouter =
    devices.find((d) => d.type === 'router' || d.name.toLowerCase().includes('mikrotik')) ||
    devices[0];

  // Group devices into hierarchy levels
  const levels: Device[][] = [[], [], [], []];

  devices.forEach((d) => {
    if (d.id === rootRouter?.id || (d.type === 'router' && !d.parent_device_id)) {
      levels[0].push(d);
    } else if (d.type === 'switch' && (!d.parent_device_id || d.parent_device_id === rootRouter?.id)) {
      levels[1].push(d);
    } else if (d.type === 'switch' || d.type === 'firewall') {
      levels[2].push(d);
    } else {
      // Access Points, Servers, and other leaf nodes
      levels[3].push(d);
    }
  });

  const levelYPositions = [120, 270, 430, 580];

  levels.forEach((levelDevices, levelIdx) => {
    if (levelDevices.length === 0) return;
    const y = levelYPositions[levelIdx] || (120 + levelIdx * 150);
    const count = levelDevices.length;
    const spacing = Math.min(260, (canvasWidth - 160) / (count + 1));
    const startX = (canvasWidth - (count - 1) * spacing) / 2;

    levelDevices.forEach((dev, i) => {
      coords[dev.id] = {
        x: Math.round(startX + i * spacing),
        y,
      };
    });
  });

  return coords;
}

/**
 * Radial (Concentric Orbit) Layout
 */
export function calculateRadialLayout(
  devices: Device[],
  centerX = 550,
  centerY = 350
): Record<string, { x: number; y: number }> {
  const coords: Record<string, { x: number; y: number }> = {};
  if (devices.length === 0) return coords;

  const rootRouter =
    devices.find((d) => d.type === 'router' || d.name.toLowerCase().includes('mikrotik')) ||
    devices[0];

  // Place core router at exact center
  coords[rootRouter.id] = { x: centerX, y: centerY };

  // Inner ring (Switches)
  const innerDevices = devices.filter(
    (d) => d.id !== rootRouter.id && (d.type === 'switch' || d.type === 'firewall')
  );
  // Outer ring (APs, Servers)
  const outerDevices = devices.filter(
    (d) => d.id !== rootRouter.id && d.type !== 'switch' && d.type !== 'firewall'
  );

  const innerRadius = 180;
  innerDevices.forEach((dev, i) => {
    const angle = (i / (innerDevices.length || 1)) * 2 * Math.PI - Math.PI / 2;
    coords[dev.id] = {
      x: Math.round(centerX + innerRadius * Math.cos(angle)),
      y: Math.round(centerY + innerRadius * Math.sin(angle)),
    };
  });

  const outerRadius = 320;
  outerDevices.forEach((dev, i) => {
    const angle = (i / (outerDevices.length || 1)) * 2 * Math.PI - Math.PI / 2;
    coords[dev.id] = {
      x: Math.round(centerX + outerRadius * Math.cos(angle)),
      y: Math.round(centerY + outerRadius * Math.sin(angle)),
    };
  });

  return coords;
}

/**
 * Grid Layout (Matrix Auto-Pack)
 */
export function calculateGridLayout(
  devices: Device[],
  cols = 3,
  startX = 240,
  startY = 140,
  gapX = 280,
  gapY = 170
): Record<string, { x: number; y: number }> {
  const coords: Record<string, { x: number; y: number }> = {};

  devices.forEach((dev, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    coords[dev.id] = {
      x: startX + col * gapX,
      y: startY + row * gapY,
    };
  });

  return coords;
}
