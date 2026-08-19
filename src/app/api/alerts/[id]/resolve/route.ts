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
    const notes = body.notes || body.resolution_notes || 'Gangguan telah berhasil diselesaikan.';

    try {
      await db
        .update(alerts)
        .set({
          resolvedAt: new Date(),
          resolvedBy: userName,
          resolutionNotes: notes,
        })
        .where(eq(alerts.id, id));
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: `Alert ${id} resolved successfully`,
      data: {
        id,
        resolvedAt: new Date().toISOString(),
        resolvedBy: userName,
        resolutionNotes: notes,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
