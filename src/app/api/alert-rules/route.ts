import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alertRules } from '@/db/schema';
import { initialAlertRules } from '@/lib/mock-data';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    let rules: any[] = [];
    try {
      rules = await db.select().from(alertRules);
    } catch {
      rules = initialAlertRules;
    }
    if (rules.length === 0) rules = initialAlertRules;

    return NextResponse.json({ success: true, count: rules.length, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newRule = {
      id: `rule-${Date.now()}`,
      name: body.name,
      deviceId: body.device_id || body.deviceId || null,
      metric: body.metric,
      condition: body.condition,
      threshold: String(body.threshold),
      durationSeconds: body.duration_seconds || body.durationSeconds || 60,
      enabled: body.enabled !== undefined ? body.enabled : true,
      escalationTier: body.escalation_tier || body.escalationTier || 1,
      notifyEmail: body.notify_email !== undefined ? body.notify_email : true,
      notifySound: body.notify_sound !== undefined ? body.notify_sound : true,
      createdAt: new Date(),
    };

    try {
      await db.insert(alertRules).values(newRule);
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, data: newRule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
