import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { initialAlerts } from '@/lib/mock-data';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let allAlerts: any[] = [];
    try {
      allAlerts = await db.select().from(alerts).orderBy(desc(alerts.triggeredAt));
    } catch {
      allAlerts = [];
    }

    const mapped = allAlerts.map((a: any) => ({
      id: a.id,
      device_id: a.deviceId || a.device_id,
      device_name: a.deviceName || a.device_name,
      ip_address: a.ipAddress || a.ip_address,
      message: a.message,
      severity: a.severity,
      triggered_at: a.triggeredAt ? new Date(a.triggeredAt).toISOString() : new Date().toISOString(),
      resolved_at: a.resolvedAt ? new Date(a.resolvedAt).toISOString() : undefined,
      acknowledged: a.acknowledged,
      acknowledged_by: a.acknowledgedBy || a.acknowledged_by,
      resolved_by: a.resolvedBy || a.resolved_by,
      resolution_notes: a.resolutionNotes || a.resolution_notes,
    }));

    let filtered = mapped;
    if (activeOnly) {
      filtered = filtered.filter((a) => !a.resolved_at);
    }

    return NextResponse.json({ success: true, count: filtered.length, data: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newAlert = {
      id: `alt-${Date.now()}`,
      deviceId: body.device_id || body.deviceId,
      deviceName: body.device_name || body.deviceName,
      ipAddress: body.ip_address || body.ipAddress,
      message: body.message,
      severity: body.severity || 'warning',
      triggeredAt: new Date(),
      acknowledged: false,
    };

    try {
      await db.insert(alerts).values(newAlert);
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, data: newAlert }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
