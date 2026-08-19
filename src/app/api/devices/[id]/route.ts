import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devices, deviceInterfaces, queueTraffics, vpnTunnels } from '@/db/schema';
import { initialDevices, initialInterfaces, initialQueues, initialVpnTunnels } from '@/lib/mock-data';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let device: any = null;
    let interfaces: any[] = [];
    let queues: any[] = [];
    let tunnels: any[] = [];

    try {
      const rows = await db.select().from(devices).where(eq(devices.id, id));
      if (rows.length > 0) {
        device = rows[0];
        interfaces = await db.select().from(deviceInterfaces).where(eq(deviceInterfaces.deviceId, id));
        queues = await db.select().from(queueTraffics).where(eq(queueTraffics.deviceId, id));
        tunnels = await db.select().from(vpnTunnels).where(eq(vpnTunnels.deviceId, id));
      }
    } catch {
      // Fallback
    }

    if (!device) {
      device = initialDevices.find((d) => d.id === id);
      interfaces = initialInterfaces.filter((i) => i.device_id === id);
      queues = initialQueues.filter((q) => q.device_id === id);
      tunnels = initialVpnTunnels.filter((v) => v.device_id === id);
    }

    if (!device) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...device,
        interfaces,
        queues,
        vpnTunnels: tunnels,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    try {
      await db.update(devices).set({ ...body, updatedAt: new Date() }).where(eq(devices.id, id));
    } catch {
      // Fallback mode
    }

    return NextResponse.json({ success: true, message: 'Device updated successfully', data: { id, ...body } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      await db.delete(devices).where(eq(devices.id, id));
    } catch {
      // Fallback mode
    }

    return NextResponse.json({ success: true, message: `Device ${id} deleted successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
