import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devices, deviceInterfaces } from '@/db/schema';
import { pollDeviceSnmp } from '@/lib/snmp-poller';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Find device in database
    let targetDevice: any = null;
    try {
      const rows = await db.select().from(devices).where(eq(devices.id, id));
      if (rows.length > 0) targetDevice = rows[0];
    } catch {
      // Fallback
    }

    const ipAddress = body.ip_address || targetDevice?.ipAddress || targetDevice?.ip_address || '127.0.0.1';
    const snmpVersion = body.snmp_version || targetDevice?.snmpVersion || targetDevice?.snmp_version || 'v2c';
    let snmpCommunity = body.snmp_community || targetDevice?.snmpCommunity || targetDevice?.snmp_community || 'public_nms';
    const snmpV3 = body.snmp_v3 || (targetDevice?.snmpV3 ? JSON.parse(targetDevice.snmpV3) : undefined);

    // Execute direct SNMP polling
    let pollResult = await pollDeviceSnmp(id, {
      ipAddress,
      version: snmpVersion,
      community: snmpCommunity,
      snmpV3,
      timeoutMs: 2500,
      retries: 1,
    });

    // Smart Community Fallback: If 'public' failed, try 'public_nms' (or vice versa)
    if (!pollResult.success && snmpVersion === 'v2c') {
      const fallbackCommunity = snmpCommunity === 'public' ? 'public_nms' : 'public';
      const fallbackResult = await pollDeviceSnmp(id, {
        ipAddress,
        version: snmpVersion,
        community: fallbackCommunity,
        timeoutMs: 2500,
        retries: 1,
      });

      if (fallbackResult.success) {
        pollResult = fallbackResult;
        snmpCommunity = fallbackCommunity;
        // Update community string in db
        try {
          await db.update(devices).set({ snmpCommunity: fallbackCommunity }).where(eq(devices.id, id));
        } catch {}
      }
    }

    if (pollResult.success && pollResult.system) {
      // Update device telemetry in PostgreSQL database
      const updateData: any = {
        uptime: pollResult.system.sysUpTime,
        cpuUsage: pollResult.system.cpuUsage,
        ramUsage: pollResult.system.ramUsage,
        storageUsage: pollResult.system.storageUsage,
        temperature: pollResult.system.temperature,
        latency: pollResult.latencyMs,
        packetLoss: 0,
        status: 'online',
        lastSeen: new Date(),
        updatedAt: new Date(),
      };

      try {
        await db.update(devices).set(updateData).where(eq(devices.id, id));
      } catch {
        // Fallback
      }

      // Sync physical interfaces if found
      if (pollResult.interfaces.length > 0) {
        try {
          await db.delete(deviceInterfaces).where(eq(deviceInterfaces.deviceId, id));
          for (const iface of pollResult.interfaces) {
            const mbps = iface.speed.includes('Gbps')
              ? parseInt(iface.speed) * 1000
              : parseInt(iface.speed) || 1000;
            await db.insert(deviceInterfaces).values({
              id: iface.id,
              deviceId: id,
              name: iface.name,
              type: iface.type,
              status: iface.status,
              macAddress: iface.mac_address,
              speedMbps: mbps,
              rxBytes: iface.rx_bytes,
              txBytes: iface.tx_bytes,
              rxErrors: iface.error_rate,
              txErrors: 0,
              updatedAt: new Date(),
            });
          }
        } catch {
          // Fallback
        }
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil menarik metrik asli dari MikroTik via SNMP (${pollResult.latencyMs} ms)`,
        data: {
          deviceId: id,
          ipAddress,
          system: pollResult.system,
          interfaces: pollResult.interfaces,
          queues: pollResult.queues,
          latencyMs: pollResult.latencyMs,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: pollResult.error || 'Gagal menghubungi perangkat via SNMP UDP 161.',
      cliHelp: pollResult.cliHelp,
      data: {
        deviceId: id,
        ipAddress,
        latencyMs: pollResult.latencyMs,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
