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
      records = [];
    }

    const mapped = records.map((r: any) => ({
      id: r.id,
      ticket_code: r.ticketCode || r.ticket_code,
      device_id: r.deviceId || r.device_id,
      device_name: r.deviceName || r.device_name,
      ip_address: r.ipAddress || r.ip_address,
      user_id: r.userId || r.user_id,
      user_name: r.userName || r.user_name,
      problem: r.problem,
      action: r.action,
      result: r.result,
      status: r.status,
      photo_urls: r.photoUrls || r.photo_urls || [],
      created_at: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updated_at: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, count: mapped.length, data: mapped });
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
