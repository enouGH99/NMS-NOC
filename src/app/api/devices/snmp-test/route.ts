import { NextRequest, NextResponse } from 'next/server';
import { pollDeviceSnmp } from '@/lib/snmp-poller';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, version, community, snmpV3 } = body;

    if (!ipAddress) {
      return NextResponse.json(
        { success: false, error: 'Alamat IP target wajib diisi' },
        { status: 400 }
      );
    }

    let pollResult = await pollDeviceSnmp('test-device', {
      ipAddress,
      version: version || 'v2c',
      community: community || 'public_nms',
      snmpV3,
      timeoutMs: 2500,
      retries: 1,
    });

    if (!pollResult.success && (!version || version === 'v2c')) {
      const fallbackCommunity = community === 'public' ? 'public_nms' : 'public';
      const fallbackResult = await pollDeviceSnmp('test-device', {
        ipAddress,
        version: 'v2c',
        community: fallbackCommunity,
        timeoutMs: 2500,
        retries: 1,
      });
      if (fallbackResult.success) {
        pollResult = fallbackResult;
      }
    }

    if (pollResult.success && pollResult.system) {
      return NextResponse.json({
        success: true,
        message: `Koneksi SNMP Berhasil! Terhubung ke ${pollResult.system.sysDescr} (${pollResult.latencyMs} ms)`,
        data: {
          latencyMs: pollResult.latencyMs,
          system: pollResult.system,
          interfaceCount: pollResult.interfaces.length,
          interfaces: pollResult.interfaces.slice(0, 8),
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: pollResult.error || 'SNMP Port 161 tidak merespon.',
      cliHelp: pollResult.cliHelp,
      data: {
        latencyMs: pollResult.latencyMs,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
