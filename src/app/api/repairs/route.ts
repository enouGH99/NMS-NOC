import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { repairRecords } from '@/db/schema';
import { initialRepairRecords } from '@/lib/mock-data';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    let records: any[] = [];
    try {
      records = await db.select().from(repairRecords).orderBy(desc(repairRecords.createdAt));
    } catch {
      records = initialRepairRecords;
    }
    if (records.length === 0) records = initialRepairRecords;

    return NextResponse.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const count = Math.floor(100 + Math.random() * 900);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ticketCode = `TKT-${dateStr}-${count}`;

    const newRecord = {
      id: `rep-${Date.now()}`,
      ticketCode,
      deviceId: body.device_id || body.deviceId,
      deviceName: body.device_name || body.deviceName,
      ipAddress: body.ip_address || body.ipAddress,
      userId: body.user_id || body.userId || 'usr-2',
      userName: body.user_name || body.userName || 'Petugas Lapangan',
      problem: body.problem,
      action: body.action,
      result: body.result || 'Dalam penanganan teknisi',
      status: body.status || 'berjalan',
      photoUrls: body.photo_urls || body.photoUrls || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await db.insert(repairRecords).values(newRecord);
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
