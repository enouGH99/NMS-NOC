import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vpnTunnels, devices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { VpnTunnel } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const refresh = searchParams.get('refresh') === 'true';

    let rows: any[] = [];
    try {
      if (deviceId) {
        rows = await db.select().from(vpnTunnels).where(eq(vpnTunnels.deviceId, deviceId));
      } else {
        rows = await db.select().from(vpnTunnels);
      }

      // If refresh requested OR database empty, poll live VPN tunnels directly from MikroTik via SNMP
      if (refresh || rows.length === 0) {
        const routerRows = await db.select().from(devices);
        const targetRouter = deviceId
          ? routerRows.find((d) => d.id === deviceId)
          : routerRows.find((d) => d.type === 'router') || routerRows[0];

        if (targetRouter && targetRouter.ipAddress) {
          const { pollDeviceSnmp } = await import('@/lib/snmp-poller');
          const pollRes = await pollDeviceSnmp(targetRouter.id, {
            ipAddress: targetRouter.ipAddress,
            community: targetRouter.snmpCommunity || 'public_nms',
            version: (targetRouter.snmpVersion as any) || 'v2c',
            timeoutMs: 3500,
            retries: 1,
          });

          if (pollRes.success && pollRes.vpnTunnels.length > 0) {
            // Delete old/stale VPN tunnels for this device in PostgreSQL
            await db.delete(vpnTunnels).where(eq(vpnTunnels.deviceId, targetRouter.id));

            for (const t of pollRes.vpnTunnels) {
              await db
                .insert(vpnTunnels)
                .values({
                  id: t.id,
                  deviceId: targetRouter.id,
                  name: t.name,
                  type: t.type,
                  user: t.user,
                  remoteIp: t.remote_ip,
                  status: t.status,
                  uptime: t.uptime,
                  bytesIn: t.bytes_in,
                  bytesOut: t.bytes_out,
                  updatedAt: new Date(),
                });
            }

            rows = await db.select().from(vpnTunnels).where(eq(vpnTunnels.deviceId, targetRouter.id));
          }
        }
      }
    } catch {
      rows = [];
    }

    const mapped: VpnTunnel[] = rows.map((v: any) => ({
      id: v.id,
      device_id: v.deviceId || v.device_id,
      name: v.name,
      type: (v.type as any) || 'openvpn',
      user: v.user || 'user',
      remote_ip: v.remoteIp || v.remote_ip || '0.0.0.0',
      status: (v.status as any) || 'connected',
      uptime: v.uptime || '0 menit',
      bytes_in: Number(v.bytesIn || v.bytes_in || 0),
      bytes_out: Number(v.bytesOut || v.bytes_out || 0),
    }));

    // Connected sessions first
    mapped.sort((a, b) => {
      if (a.status === 'connected' && b.status !== 'connected') return -1;
      if (a.status !== 'connected' && b.status === 'connected') return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ success: true, count: mapped.length, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let targetDeviceId = body.device_id || body.deviceId;
    if (!targetDeviceId) {
      const devRows = await db.select().from(devices);
      if (devRows.length > 0) {
        targetDeviceId = devRows[0].id;
      } else {
        return NextResponse.json({ success: false, error: 'Belum ada perangkat terdaftar.' }, { status: 400 });
      }
    }

    const newTunnel = {
      id: body.id || `vpn-${Date.now()}`,
      deviceId: targetDeviceId,
      name: body.name || 'VPN Tunnel',
      type: body.type || 'openvpn',
      user: body.user || 'user',
      remoteIp: body.remote_ip || body.remoteIp || '10.8.0.2',
      status: body.status || 'connected',
      uptime: body.uptime || '1 jam',
      bytesIn: body.bytes_in || body.bytesIn || 0,
      bytesOut: body.bytes_out || body.bytesOut || 0,
      updatedAt: new Date(),
    };

    try {
      await db.insert(vpnTunnels).values(newTunnel);
    } catch {
      // Fallback
    }

    const mapped: VpnTunnel = {
      id: newTunnel.id,
      device_id: newTunnel.deviceId,
      name: newTunnel.name,
      type: newTunnel.type,
      user: newTunnel.user,
      remote_ip: newTunnel.remoteIp,
      status: newTunnel.status,
      uptime: newTunnel.uptime,
      bytes_in: newTunnel.bytesIn,
      bytes_out: newTunnel.bytesOut,
    };

    return NextResponse.json({ success: true, data: mapped }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
