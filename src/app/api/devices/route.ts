import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devices, locations } from '@/db/schema';
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
      allDevices = [];
    }

    const mapped = allDevices.map((d: any) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      ip_address: d.ipAddress || d.ip_address,
      mac_address: d.macAddress || d.mac_address,
      model: d.model,
      location_id: d.locationId || d.location_id,
      location_name: d.locationName || d.location_name,
      is_priority: d.isPriority !== undefined ? d.isPriority : d.is_priority,
      status: d.status,
      last_seen: d.lastSeen ? new Date(d.lastSeen).toISOString() : new Date().toISOString(),
      uptime: d.uptime,
      cpu_usage: d.cpuUsage !== undefined ? d.cpuUsage : d.cpu_usage,
      ram_usage: d.ramUsage !== undefined ? d.ramUsage : d.ram_usage,
      storage_usage: d.storageUsage !== undefined ? d.storageUsage : d.storage_usage,
      temperature: d.temperature,
      latency: d.latency,
      packet_loss: d.packetLoss !== undefined ? d.packetLoss : d.packet_loss,
      parent_device_id: d.parentDeviceId || d.parent_device_id,
      snmp_version: d.snmpVersion || d.snmp_version,
      snmp_community: d.snmpCommunity || d.snmp_community,
      coordinates: {
        x: d.coordX !== undefined ? d.coordX : 400,
        y: d.coordY !== undefined ? d.coordY : 300,
      },
      created_at: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    let filtered = mapped;
    if (locationId) {
      filtered = filtered.filter((d) => d.location_id === locationId);
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
    const newId = body.id || `dev-${Date.now()}`;

    // Safely check foreign key for locationId
    let validLocationId: string | null = null;
    let locationName = body.location_name || body.locationName || 'Lokasi Belum Ditentukan';
    const requestedLocId = body.location_id || body.locationId;

    if (requestedLocId) {
      try {
        const locRows = await db.select().from(locations).where(eq(locations.id, requestedLocId));
        if (locRows.length > 0) {
          validLocationId = requestedLocId;
          locationName = locRows[0].name;
        }
      } catch {
        validLocationId = null;
      }
    }

    const newDevice = {
      id: newId,
      name: body.name || 'Perangkat Baru',
      type: body.type || 'router',
      ipAddress: body.ip_address || body.ipAddress || '127.0.0.1',
      macAddress: body.mac_address || body.macAddress || '00:00:00:00:00:00',
      model: body.model || 'Generic Network Device',
      locationId: validLocationId,
      locationName: locationName,
      isPriority: body.is_priority !== undefined ? Boolean(body.is_priority) : Boolean(body.isPriority || false),
      status: body.status || 'online',
      lastSeen: new Date(),
      uptime: body.uptime || 'Baru ditambahkan',
      cpuUsage: body.cpu_usage !== undefined ? Number(body.cpu_usage) : (body.cpuUsage !== undefined ? Number(body.cpuUsage) : 10),
      ramUsage: body.ram_usage !== undefined ? Number(body.ram_usage) : (body.ramUsage !== undefined ? Number(body.ramUsage) : 25),
      storageUsage: body.storage_usage !== undefined ? Number(body.storage_usage) : (body.storageUsage !== undefined ? Number(body.storageUsage) : 15),
      temperature: body.temperature !== undefined ? Number(body.temperature) : 35,
      latency: body.latency !== undefined ? Number(body.latency) : 2,
      packetLoss: body.packet_loss !== undefined ? Number(body.packet_loss) : 0,
      parentDeviceId: body.parent_device_id || body.parentDeviceId || null,
      snmpVersion: body.snmp_version || body.snmpVersion || 'v2c',
      snmpCommunity: body.snmp_community || body.snmpCommunity || 'public',
      coordX: body.coordinates?.x !== undefined ? Number(body.coordinates.x) : (body.coordX !== undefined ? Number(body.coordX) : 400),
      coordY: body.coordinates?.y !== undefined ? Number(body.coordinates.y) : (body.coordY !== undefined ? Number(body.coordY) : 300),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(devices).values(newDevice);

    const mappedResponse = {
      id: newDevice.id,
      name: newDevice.name,
      type: newDevice.type,
      ip_address: newDevice.ipAddress,
      mac_address: newDevice.macAddress,
      model: newDevice.model,
      location_id: newDevice.locationId,
      location_name: newDevice.locationName,
      is_priority: newDevice.isPriority,
      status: newDevice.status,
      last_seen: newDevice.lastSeen.toISOString(),
      uptime: newDevice.uptime,
      cpu_usage: newDevice.cpuUsage,
      ram_usage: newDevice.ramUsage,
      storage_usage: newDevice.storageUsage,
      temperature: newDevice.temperature,
      latency: newDevice.latency,
      packet_loss: newDevice.packetLoss,
      parent_device_id: newDevice.parentDeviceId,
      snmp_version: newDevice.snmpVersion,
      snmp_community: newDevice.snmpCommunity,
      coordinates: {
        x: newDevice.coordX,
        y: newDevice.coordY,
      },
      created_at: newDevice.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: mappedResponse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
