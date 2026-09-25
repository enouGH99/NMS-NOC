import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devices } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Support single: { id, coordinates: { x, y } } or batch: { coordinates: Record<string, { x, y }> }
    if (body.id && body.coordinates) {
      await db
        .update(devices)
        .set({
          coordX: Number(body.coordinates.x),
          coordY: Number(body.coordinates.y),
          updatedAt: new Date(),
        })
        .where(eq(devices.id, body.id));

      return NextResponse.json({ success: true, message: `Coordinates saved for device ${body.id}` });
    }

    if (body.coordinates && typeof body.coordinates === 'object') {
      const updates = Object.entries(body.coordinates as Record<string, { x: number; y: number }>);
      for (const [devId, coords] of updates) {
        if (coords && coords.x !== undefined && coords.y !== undefined) {
          try {
            await db
              .update(devices)
              .set({
                coordX: Number(coords.x),
                coordY: Number(coords.y),
                updatedAt: new Date(),
              })
              .where(eq(devices.id, devId));
          } catch {}
        }
      }

      return NextResponse.json({
        success: true,
        message: `Batch coordinates updated for ${updates.length} devices`,
      });
    }

    return NextResponse.json({ success: false, error: 'Format koordinat tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
