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
      list = initialLocations;
    }

    if (list.length === 0) list = initialLocations;

    return NextResponse.json({ success: true, count: list.length, data: list });
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
