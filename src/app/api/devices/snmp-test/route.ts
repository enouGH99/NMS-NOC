import { NextRequest, NextResponse } from 'next/server';
import { pollDeviceSnmp } from '@/lib/snmp-poller';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, ip_address, version, community, snmp_community, snmpV3, snmp_v3 } = body;
    const cleanIp = (ipAddress || ip_address || '').trim();
    const cleanCommunity = (community || snmp_community || 'public_nms').trim();
    const cleanVersion = version || 'v2c';
    const cleanV3 = snmpV3 || snmp_v3;

    if (!cleanIp) {
      return NextResponse.json(
        { success: false, error: 'Alamat IP target wajib diisi' },
        { status: 400 }
      );
    }

    let pollResult = await pollDeviceSnmp('test-device', {
      ipAddress: cleanIp,
      version: cleanVersion,
      community: cleanCommunity,
      snmpV3: cleanV3,
      timeoutMs: 4000,
      retries: 2,
    });

    if (!pollResult.success && (!version || version === 'v2c')) {
      const fallbackCommunity = cleanCommunity === 'public' ? 'public_nms' : 'public';
      const fallbackResult = await pollDeviceSnmp('test-device', {
        ipAddress: cleanIp,
        version: 'v2c',
        community: fallbackCommunity,
        timeoutMs: 4000,
        retries: 2,
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
