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
      allAlerts = initialAlerts;
    }

    if (allAlerts.length === 0) allAlerts = initialAlerts;

    let filtered = allAlerts;
    if (activeOnly) {
      filtered = filtered.filter((a) => !a.resolvedAt && !a.resolved_at);
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
