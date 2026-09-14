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

    const ipAddress = (body.ip_address || targetDevice?.ipAddress || targetDevice?.ip_address || '127.0.0.1').trim();
    const snmpVersion = body.snmp_version || targetDevice?.snmpVersion || targetDevice?.snmp_version || 'v2c';
    let snmpCommunity = (body.snmp_community || targetDevice?.snmpCommunity || targetDevice?.snmp_community || 'public_nms').trim();
    const snmpV3 = body.snmp_v3 || (targetDevice?.snmpV3 ? JSON.parse(targetDevice.snmpV3) : undefined);

    // Execute direct SNMP polling
    let pollResult = await pollDeviceSnmp(id, {
      ipAddress,
      version: snmpVersion,
      community: snmpCommunity,
      snmpV3,
      timeoutMs: 4000,
      retries: 2,
    });

    // Smart Community Fallback: If 'public' failed, try 'public_nms' (or vice versa)
    if (!pollResult.success && snmpVersion === 'v2c') {
      const fallbackCommunity = snmpCommunity === 'public' ? 'public_nms' : 'public';
      const fallbackResult = await pollDeviceSnmp(id, {
        ipAddress,
        version: snmpVersion,
        community: fallbackCommunity,
        timeoutMs: 4000,
        retries: 2,
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

      // Sync Simple Queues if found
      if (pollResult.queues.length > 0) {
        try {
          const { queueTraffics } = await import('@/db/schema');
          
          // Index existing queues in PostgreSQL by normalized name to preserve user-customized limits
          const existingDbRows = await db.select().from(queueTraffics).where(eq(queueTraffics.deviceId, id));
          const existingMap = new Map<string, any>();
          for (const row of existingDbRows) {
            existingMap.set(row.name.trim().toLowerCase(), row);
            existingMap.set(row.id, row);
          }

          await db.delete(queueTraffics).where(eq(queueTraffics.deviceId, id));
          for (let i = 0; i < pollResult.queues.length; i++) {
            const q = pollResult.queues[i];
            const normalizedName = q.name.trim().toLowerCase();
            const existingRecord = existingMap.get(normalizedName) || existingMap.get(q.id);

            let maxDl = 40;
            let maxUl = 40;

            if (existingRecord && existingRecord.maxLimitDownloadMbps && existingRecord.maxLimitUploadMbps) {
              maxDl = existingRecord.maxLimitDownloadMbps;
              maxUl = existingRecord.maxLimitUploadMbps;
            } else if (q.max_limit) {
              const parts = q.max_limit.split('/');
              maxUl = parseInt(parts[0], 10) || 40;
              maxDl = parseInt(parts[1] || parts[0], 10) || 40;
            }

            const target = (existingRecord && existingRecord.targetSubnet && existingRecord.targetSubnet.includes('bridge-Server'))
              ? existingRecord.targetSubnet
              : q.target;

            await db.insert(queueTraffics).values({
              id: q.id,
              deviceId: id,
              name: q.name,
              targetSubnet: target,
              maxLimitDownloadMbps: maxDl,
              maxLimitUploadMbps: maxUl,
              currentDownloadMbps: q.current_rate.download,
              currentUploadMbps: q.current_rate.upload,
              packetDropsPerSec: q.dropped,
              queueType: 'default-small',
              priority: i + 1,
              updatedAt: new Date(),
            });
          }
        } catch {
          // Fallback
        }
      }

      // Sync VPN Tunnels if found
      if (pollResult.vpnTunnels && pollResult.vpnTunnels.length > 0) {
        try {
          const { vpnTunnels } = await import('@/db/schema');
          await db.delete(vpnTunnels).where(eq(vpnTunnels.deviceId, id));
          for (const tunnel of pollResult.vpnTunnels) {
            await db.insert(vpnTunnels).values({
              id: tunnel.id,
              deviceId: id,
              name: tunnel.name,
              type: tunnel.type,
              user: tunnel.user,
              remoteIp: tunnel.remote_ip,
              status: tunnel.status,
              uptime: tunnel.uptime,
              bytesIn: tunnel.bytes_in,
              bytesOut: tunnel.bytes_out,
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
          vpnTunnels: pollResult.vpnTunnels,
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
