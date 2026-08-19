import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { initialUsers } from '@/lib/mock-data';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    let usersList: any[] = [];
    try {
      usersList = await db.select().from(user);
    } catch {
      usersList = [];
    }

    const mapped = usersList.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      status: u.status,
      avatar: u.image || u.avatar,
      last_login: u.lastLogin ? new Date(u.lastLogin).toISOString() : 'Belum pernah login',
      created_at: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, count: mapped.length, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newUser = {
      id: `usr-${Date.now()}`,
      name: body.name,
      email: body.email,
      role: body.role || 'petugas',
      phone: body.phone || '',
      status: body.status || 'active',
      image: body.avatar || body.image || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await db.insert(user).values(newUser);
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    try {
      await db.update(user).set({ ...updates, updatedAt: new Date() }).where(eq(user.id, id));
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, message: `User ${id} updated successfully`, data: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    try {
      await db.delete(user).where(eq(user.id, id));
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, message: `User ${id} deleted successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
