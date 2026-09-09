import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vpnTunnels, devices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { VpnTunnel } from '@/lib/types';
import { pollDeviceSnmp } from '@/lib/snmp-poller';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Fetch target router info
    let targetRouter: any = null;
    try {
      const routerRows = await db.select().from(devices);
      targetRouter = deviceId
        ? routerRows.find((d) => d.id === deviceId)
        : routerRows.find((d) => d.type === 'router' || d.ipAddress === '192.168.3.1') || routerRows[0];
    } catch {
      targetRouter = null;
    }

    let rows: any[] = [];
    try {
      if (deviceId) {
        rows = await db.select().from(vpnTunnels).where(eq(vpnTunnels.deviceId, deviceId));
      } else {
        rows = await db.select().from(vpnTunnels);
      }
    } catch {
      rows = [];
    }

    // 2. If force refresh requested OR database empty OR rows has 0 connected tunnels, poll live MikroTik via SNMP
    if (forceRefresh || rows.length === 0 || rows.filter((r) => r.status === 'connected').length === 0) {
      if (targetRouter && targetRouter.ipAddress) {
        try {
          const pollRes = await pollDeviceSnmp(targetRouter.id, {
            ipAddress: targetRouter.ipAddress,
            community: targetRouter.snmpCommunity || 'public_nms',
            version: (targetRouter.snmpVersion as any) || 'v2c',
            timeoutMs: 3000,
            retries: 1,
          });

          if (pollRes.success && Array.isArray(pollRes.vpnTunnels) && pollRes.vpnTunnels.length > 0) {
            // Delete old stale VPN tunnel records in PostgreSQL
            try {
              await db.delete(vpnTunnels).where(eq(vpnTunnels.deviceId, targetRouter.id));
            } catch {}

            for (const t of pollRes.vpnTunnels) {
              try {
                await db.insert(vpnTunnels).values({
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
              } catch {}
            }

            // Reload fresh rows from database
            rows = await db.select().from(vpnTunnels);
            if (deviceId) {
              rows = rows.filter((r) => r.deviceId === deviceId);
            }
          }
        } catch (pollErr) {
          console.warn('Live SNMP VPN poll error:', pollErr);
        }
      }
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

    // Natural sort: Connected sessions first, then alphabetical
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
