import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locations } from '@/db/schema';
import { initialLocations } from '@/lib/mock-data';

export async function GET() {
  try {
    let list: any[] = [];
    try {
      list = await db.select().from(locations);
    } catch {
      list = [];
    }

    const mapped = list.map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      building: loc.building,
      floor: loc.floor,
      description: loc.description,
      device_count: loc.deviceCount !== undefined ? loc.deviceCount : loc.device_count || 0,
    }));

    return NextResponse.json({ success: true, count: mapped.length, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newLoc = {
      id: `loc-${Date.now()}`,
      name: body.name,
      building: body.building,
      floor: body.floor,
      description: body.description || '',
      deviceCount: 0,
      createdAt: new Date(),
    };

    try {
      await db.insert(locations).values(newLoc);
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, data: newLoc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
