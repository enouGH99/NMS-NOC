import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devices, rawSnmpMetrics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { exportMikrotikHexSMetrics, getDeviceRawMetricsFromDb } from '@/lib/mikrotik-exporter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const refresh = searchParams.get('refresh') === 'true';

    // Find device
    const deviceRows = await db.select().from(devices).where(eq(devices.id, id));
    if (deviceRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }
    const device = deviceRows[0];

    // Check if live export requested or if no raw metrics exist in DB yet
    let existingCount = 0;
    try {
      const existing = await db.select().from(rawSnmpMetrics).where(eq(rawSnmpMetrics.deviceId, id));
      existingCount = existing.length;
    } catch {}

    if (refresh || existingCount === 0) {
      await exportMikrotikHexSMetrics(id, {
        ipAddress: device.ipAddress,
        community: device.snmpCommunity || 'public_nms',
        version: (device.snmpVersion as any) || 'v2c',
        timeoutMs: 3500,
        retries: 1,
      });
    }

    const data = await getDeviceRawMetricsFromDb(id, { category, search, limit });

    // Group count by category
    const allRows = await db.select().from(rawSnmpMetrics).where(eq(rawSnmpMetrics.deviceId, id));
    const categoryCounts: Record<string, number> = {};
    for (const r of allRows) {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      deviceId: id,
      totalCount: allRows.length,
      filteredCount: data.length,
      categoryCounts,
      data: data.map(r => ({
        id: r.id,
        device_id: r.deviceId,
        oid: r.oid,
        oid_name: r.oidName,
        category: r.category,
        type: r.type,
        raw_value: r.rawValue,
        parsed_value: r.parsedValue || r.rawValue,
        unit: r.unit,
        collected_at: r.collectedAt?.toISOString ? r.collectedAt.toISOString() : String(r.collectedAt),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Find device
    const deviceRows = await db.select().from(devices).where(eq(devices.id, id));
    if (deviceRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }
    const device = deviceRows[0];

    const ipAddress = body.ip_address || device.ipAddress;
    const community = body.snmp_community || device.snmpCommunity || 'public_nms';
    const version = body.snmp_version || device.snmpVersion || 'v2c';

    const result = await exportMikrotikHexSMetrics(id, {
      ipAddress,
      community,
      version: version as any,
      timeoutMs: 4000,
      retries: 2,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'SNMP Export failed' }, { status: 500 });
    }

    const exportedMetrics = await getDeviceRawMetricsFromDb(id);

    return NextResponse.json({
      success: true,
      deviceId: id,
      totalExported: result.totalMetricsExported,
      categories: result.categories,
      systemSummary: result.systemSummary,
      data: exportedMetrics.map(r => ({
        id: r.id,
        device_id: r.deviceId,
        oid: r.oid,
        oid_name: r.oidName,
        category: r.category,
        type: r.type,
        raw_value: r.rawValue,
        parsed_value: r.parsedValue || r.rawValue,
        unit: r.unit,
        collected_at: r.collectedAt?.toISOString ? r.collectedAt.toISOString() : String(r.collectedAt),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
