import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devices } from '@/db/schema';
import { initialDevices } from '@/lib/mock-data';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let targetDevice: any = null;

    try {
      const rows = await db.select().from(devices).where(eq(devices.id, id));
      if (rows.length > 0) targetDevice = rows[0];
    } catch {
      // Fallback
    }

    if (!targetDevice) {
      targetDevice = initialDevices.find((d) => d.id === id);
    }

    const isOffline = targetDevice?.status === 'offline' || targetDevice?.status === 'unreachable';
    const packets: number[] = [];
    let lossCount = 0;

    for (let i = 0; i < 4; i++) {
      if (isOffline) {
        lossCount++;
        packets.push(999);
      } else {
        const baseLatency = targetDevice?.latency || 4;
        const jitter = (Math.random() - 0.5) * 4;
        const lat = Math.max(1, Math.round(baseLatency + jitter));
        packets.push(lat);
      }
    }

    const lossPercent = (lossCount / 4) * 100;
    const validPackets = packets.filter((p) => p !== 999);
    const avgLatency = validPackets.length
      ? Math.round(validPackets.reduce((a, b) => a + b, 0) / validPackets.length)
      : 999;

    return NextResponse.json({
      success: lossPercent < 100,
      deviceId: id,
      ipAddress: targetDevice?.ipAddress || targetDevice?.ip_address || '127.0.0.1',
      latency: avgLatency,
      packetLoss: lossPercent,
      packets,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
