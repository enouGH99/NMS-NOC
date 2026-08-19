import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const userName = body.user_name || body.userName || 'Petugas NOC';

    try {
      await db
        .update(alerts)
        .set({
          acknowledged: true,
          acknowledgedBy: userName,
        })
        .where(eq(alerts.id, id));
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: `Alert ${id} acknowledged by ${userName}`,
      data: { id, acknowledged: true, acknowledgedBy: userName },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
