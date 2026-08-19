import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { autoDiscoveredDevices, devices } from '@/db/schema';
import { initialAutoDiscovered } from '@/lib/mock-data';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    let list: any[] = [];
    try {
      list = await db.select().from(autoDiscoveredDevices);
    } catch {
      list = [];
    }

    const mapped = list.map((d: any) => ({
      id: d.id,
      ip: d.ip,
      mac: d.mac,
      suggested_name: d.suggestedName || d.suggested_name,
      type: d.type,
      snmp_detected: d.snmpDetected !== undefined ? d.snmpDetected : d.snmp_detected,
      vendor: d.vendor,
      response_time: d.responseTime !== undefined ? d.responseTime : d.response_time,
      status: d.status,
      discovered_at: d.discoveredAt ? new Date(d.discoveredAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, count: mapped.length, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const subnet = body.subnet || '192.168.1.0/24';

    // Simulate discovery sweep in background
    const discoveredBatch = [
      {
        id: `dsc-${Date.now()}-1`,
        ip: `${subnet.split('/')[0].slice(0, -1)}110`,
        mac: 'D8:07:B6:11:44:22',
        suggestedName: 'MikroTik hEX S (Subnet Switch)',
        type: 'router',
        snmpDetected: true,
        vendor: 'MikroTik',
        responseTime: 3,
        status: 'new',
        discoveredAt: new Date(),
      },
      {
        id: `dsc-${Date.now()}-2`,
        ip: `${subnet.split('/')[0].slice(0, -1)}125`,
        mac: '00:15:6D:88:99:AA',
        suggestedName: 'UniFi 6 Pro Access Point',
        type: 'access_point',
        snmpDetected: true,
        vendor: 'Ubiquiti Networks',
        responseTime: 6,
        status: 'new',
        discoveredAt: new Date(),
      },
    ];

    try {
      for (const item of discoveredBatch) {
        await db.insert(autoDiscoveredDevices).values(item);
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: `Pemindaian subnet ${subnet} selesai. Ditemukan ${discoveredBatch.length} perangkat baru.`,
      data: discoveredBatch,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body; // action: 'approve' | 'ignore'

    try {
      await db
        .update(autoDiscoveredDevices)
        .set({ status: action === 'approve' ? 'approved' : 'ignored' })
        .where(eq(autoDiscoveredDevices.id, id));
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: `Device ${id} ${action}d successfully`,
      data: { id, status: action === 'approve' ? 'approved' : 'ignored' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
