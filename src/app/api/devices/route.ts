import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devices } from '@/db/schema';
import { initialDevices } from '@/lib/mock-data';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');

    let allDevices: any[] = [];
    try {
      allDevices = await db.select().from(devices).orderBy(desc(devices.createdAt));
    } catch {
      allDevices = initialDevices;
    }

    if (allDevices.length === 0) {
      allDevices = initialDevices;
    }

    let filtered = allDevices;
    if (locationId) {
      filtered = filtered.filter((d) => (d.locationId || d.location_id) === locationId);
    }
    if (status) {
      filtered = filtered.filter((d) => d.status === status);
    }

    return NextResponse.json({ success: true, count: filtered.length, data: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newId = `dev-${Date.now()}`;

    const newDevice = {
      id: newId,
      name: body.name,
      type: body.type || 'switch',
      ipAddress: body.ip_address || body.ipAddress,
      macAddress: body.mac_address || body.macAddress || '00:00:00:00:00:00',
      model: body.model || 'Generic Network Device',
      locationId: body.location_id || body.locationId || 'loc-1',
      locationName: body.location_name || body.locationName || 'Gedung A - Lantai 1',
      isPriority: body.is_priority || body.isPriority || false,
      status: body.status || 'online',
      lastSeen: new Date(),
      uptime: '1 hari 0 jam',
      cpuUsage: 12,
      ramUsage: 35,
      storageUsage: 20,
      temperature: 32,
      latency: 2,
      packetLoss: 0,
      parentDeviceId: body.parent_device_id || body.parentDeviceId || 'dev-1',
      snmpVersion: body.snmp_version || body.snmpVersion || 'v2c',
      snmpCommunity: body.snmp_community || body.snmpCommunity || 'public',
      coordX: body.coordinates?.x || body.coordX || 400,
      coordY: body.coordinates?.y || body.coordY || 300,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await db.insert(devices).values(newDevice);
    } catch {
      // In fallback mode, echo back the generated object
    }

    return NextResponse.json({ success: true, data: newDevice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
