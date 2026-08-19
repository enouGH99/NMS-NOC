import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { initialAuditLogs } from '@/lib/mock-data';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    let logs: any[] = [];
    try {
      logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
    } catch {
      logs = initialAuditLogs;
    }
    if (logs.length === 0) logs = initialAuditLogs;

    return NextResponse.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newLog = {
      id: `aud-${Date.now()}`,
      userId: body.user_id || body.userId || 'usr-1',
      userName: body.user_name || body.userName || 'Budi Santoso',
      userRole: body.user_role || body.userRole || 'admin',
      action: body.action,
      details: body.details,
      ipAddress: body.ip_address || body.ipAddress || '192.168.1.105',
      timestamp: new Date(),
    };

    try {
      await db.insert(auditLogs).values(newLog);
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, data: newLog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
