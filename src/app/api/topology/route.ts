import { NextResponse } from 'next/server';
import { db } from '@/db';
import { devices } from '@/db/schema';
import { initialDevices } from '@/lib/mock-data';

export async function GET() {
  try {
    let devList: any[] = [];
    try {
      devList = await db.select().from(devices);
    } catch {
      devList = [];
    }

    const nodes = devList.map((d: any) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      ip: d.ipAddress || d.ip_address,
      status: d.status,
      latency: d.latency,
      packetLoss: d.packetLoss || d.packet_loss,
      parentDeviceId: d.parentDeviceId || d.parent_device_id,
      coordinates: {
        x: d.coordX !== undefined ? d.coordX : d.coordinates?.x || 400,
        y: d.coordY !== undefined ? d.coordY : d.coordinates?.y || 300,
      },
    }));

    const edges = devList
      .filter((d: any) => d.parentDeviceId || d.parent_device_id)
      .map((d: any) => ({
        id: `edge-${d.parentDeviceId || d.parent_device_id}-${d.id}`,
        source: d.parentDeviceId || d.parent_device_id,
        target: d.id,
        status: d.status === 'offline' || d.status === 'unreachable' ? 'broken' : 'healthy',
      }));

    return NextResponse.json({
      success: true,
      data: {
        nodes,
        edges,
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
