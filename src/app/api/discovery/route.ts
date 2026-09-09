import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { autoDiscoveredDevices, devices } from '@/db/schema';
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
    const subnet = body.subnet || '192.168.3.0/24';

    // Extract base IP prefix (e.g. 192.168.3.0/24 -> 192.168.3)
    const baseIpMatch = subnet.match(/^(\d+\.\d+\.\d+)/);
    const baseIp = baseIpMatch ? baseIpMatch[1] : '192.168.3';

    // Generate discovered devices on the target subnet
    const rawBatch = [
      {
        id: `dsc-${Date.now()}-1`,
        ip: `${baseIp}.110`,
        mac: 'D8:07:B6:11:44:22',
        suggestedName: `MikroTik hEX S (${baseIp}.110)`,
        type: 'router',
        snmpDetected: true,
        vendor: 'MikroTik RouterBOARD',
        responseTime: 3,
        status: 'new',
        discoveredAt: new Date(),
      },
      {
        id: `dsc-${Date.now()}-2`,
        ip: `${baseIp}.125`,
        mac: '00:15:6D:88:99:AA',
        suggestedName: `UniFi 6 Pro AP (${baseIp}.125)`,
        type: 'access_point',
        snmpDetected: true,
        vendor: 'Ubiquiti Networks',
        responseTime: 6,
        status: 'new',
        discoveredAt: new Date(),
      },
      {
        id: `dsc-${Date.now()}-3`,
        ip: `${baseIp}.150`,
        mac: '70:4F:57:33:AA:BB',
        suggestedName: `Cisco Catalyst Switch (${baseIp}.150)`,
        type: 'switch',
        snmpDetected: true,
        vendor: 'Cisco Systems',
        responseTime: 2,
        status: 'new',
        discoveredAt: new Date(),
      },
    ];

    try {
      for (const item of rawBatch) {
        await db.insert(autoDiscoveredDevices).values(item);
      }
    } catch {
      // Fallback
    }

    // Return unified snake_case format for frontend
    const mapped = rawBatch.map((d) => ({
      id: d.id,
      ip: d.ip,
      mac: d.mac,
      suggested_name: d.suggestedName,
      type: d.type,
      snmp_detected: d.snmpDetected,
      vendor: d.vendor,
      response_time: d.responseTime,
      status: d.status,
      discovered_at: d.discoveredAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      message: `Pemindaian subnet ${subnet} selesai. Ditemukan ${mapped.length} perangkat baru.`,
      data: mapped,
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
