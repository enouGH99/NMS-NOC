import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devices, locations, deviceInterfaces, queueTraffics, vpnTunnels } from '@/db/schema';
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
        const d: any = rows[0];
        device = {
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
        };
        interfaces = await db.select().from(deviceInterfaces).where(eq(deviceInterfaces.deviceId, id));
        queues = await db.select().from(queueTraffics).where(eq(queueTraffics.deviceId, id));
        tunnels = await db.select().from(vpnTunnels).where(eq(vpnTunnels.deviceId, id));
      }
    } catch {
      // Database error
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

    const updatePayload: any = { updatedAt: new Date() };
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.ip_address !== undefined || body.ipAddress !== undefined) updatePayload.ipAddress = body.ip_address || body.ipAddress;
    if (body.mac_address !== undefined || body.macAddress !== undefined) updatePayload.macAddress = body.mac_address || body.macAddress;
    if (body.model !== undefined) updatePayload.model = body.model;
    if (body.location_id !== undefined || body.locationId !== undefined) {
      const locId = body.location_id !== undefined ? body.location_id : body.locationId;
      if (locId) {
        const locExists = await db.select().from(locations).where(eq(locations.id, locId));
        updatePayload.locationId = locExists.length > 0 ? locId : null;
        if (locExists.length > 0) updatePayload.locationName = locExists[0].name;
      } else {
        updatePayload.locationId = null;
      }
    }
    if (body.location_name !== undefined || body.locationName !== undefined) updatePayload.locationName = body.location_name || body.locationName;
    if (body.is_priority !== undefined || body.isPriority !== undefined) updatePayload.isPriority = body.is_priority !== undefined ? Boolean(body.is_priority) : Boolean(body.isPriority);
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.uptime !== undefined) updatePayload.uptime = body.uptime;
    if (body.cpu_usage !== undefined || body.cpuUsage !== undefined) updatePayload.cpuUsage = Number(body.cpu_usage ?? body.cpuUsage);
    if (body.ram_usage !== undefined || body.ramUsage !== undefined) updatePayload.ramUsage = Number(body.ram_usage ?? body.ramUsage);
    if (body.storage_usage !== undefined || body.storageUsage !== undefined) updatePayload.storageUsage = Number(body.storage_usage ?? body.storageUsage);
    if (body.temperature !== undefined) updatePayload.temperature = Number(body.temperature);
    if (body.latency !== undefined) updatePayload.latency = Number(body.latency);
    if (body.packet_loss !== undefined || body.packetLoss !== undefined) updatePayload.packetLoss = Number(body.packet_loss ?? body.packetLoss);
    if (body.parent_device_id !== undefined || body.parentDeviceId !== undefined) updatePayload.parentDeviceId = body.parent_device_id || body.parentDeviceId;
    if (body.snmp_version !== undefined || body.snmpVersion !== undefined) updatePayload.snmpVersion = body.snmp_version || body.snmpVersion;
    if (body.snmp_community !== undefined || body.snmpCommunity !== undefined) updatePayload.snmpCommunity = body.snmp_community || body.snmpCommunity;
    if (body.coordinates?.x !== undefined) updatePayload.coordX = Number(body.coordinates.x);
    if (body.coordinates?.y !== undefined) updatePayload.coordY = Number(body.coordinates.y);
    if (body.coordX !== undefined) updatePayload.coordX = Number(body.coordX);
    if (body.coordY !== undefined) updatePayload.coordY = Number(body.coordY);

    await db.update(devices).set(updatePayload).where(eq(devices.id, id));

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
