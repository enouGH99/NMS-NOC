import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alertRules } from '@/db/schema';
import { eq } from 'drizzle-orm';

const defaultStandardRules = [
  {
    id: 'rule-1',
    name: 'Peringatan Perangkat Down / Putus (Ping Offline)',
    metric: 'offline_status',
    condition: 'offline',
    threshold: '1',
    durationSeconds: 60,
    enabled: true,
    escalationTier: 1,
    notifyEmail: true,
    notifySound: true,
    createdAt: new Date(),
  },
  {
    id: 'rule-2',
    name: 'Ambang Batas Latensi Tinggi (> 75ms)',
    metric: 'latency',
    condition: '>',
    threshold: '75',
    durationSeconds: 120,
    enabled: true,
    escalationTier: 1,
    notifyEmail: false,
    notifySound: true,
    createdAt: new Date(),
  },
  {
    id: 'rule-3',
    name: 'Ambang Batas Beban CPU Kritis (> 85%)',
    metric: 'cpu_usage',
    condition: '>',
    threshold: '85',
    durationSeconds: 300,
    enabled: true,
    escalationTier: 2,
    notifyEmail: true,
    notifySound: true,
    createdAt: new Date(),
  },
  {
    id: 'rule-4',
    name: 'Packet Loss Jaringan Ekstrem (> 5%)',
    metric: 'packet_loss',
    condition: '>',
    threshold: '5',
    durationSeconds: 60,
    enabled: true,
    escalationTier: 1,
    notifyEmail: true,
    notifySound: true,
    createdAt: new Date(),
  },
  {
    id: 'rule-5',
    name: 'Suhu Perangkat Kritis (> 55°C)',
    metric: 'temperature',
    condition: '>',
    threshold: '55',
    durationSeconds: 60,
    enabled: true,
    escalationTier: 2,
    notifyEmail: true,
    notifySound: true,
    createdAt: new Date(),
  },
];

export async function GET() {
  try {
    let rules: any[] = [];
    try {
      rules = await db.select().from(alertRules);
    } catch {
      rules = [];
    }

    // Auto-seed default standard enterprise rules if empty
    if (rules.length === 0) {
      try {
        for (const r of defaultStandardRules) {
          await db.insert(alertRules).values(r);
        }
        rules = defaultStandardRules;
      } catch {
        rules = defaultStandardRules;
      }
    }

    const mapped = rules.map((r: any) => ({
      id: r.id,
      name: r.name,
      device_id: r.deviceId || r.device_id,
      metric: r.metric,
      condition: r.condition,
      threshold: r.threshold,
      duration_seconds: r.durationSeconds !== undefined ? r.durationSeconds : r.duration_seconds || 60,
      enabled: r.enabled,
      escalation_tier: r.escalationTier !== undefined ? r.escalationTier : r.escalation_tier || 1,
      notify_email: r.notifyEmail !== undefined ? r.notifyEmail : r.notify_email,
      notify_sound: r.notifySound !== undefined ? r.notifySound : r.notify_sound,
    }));

    return NextResponse.json({ success: true, count: mapped.length, data: mapped });
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
