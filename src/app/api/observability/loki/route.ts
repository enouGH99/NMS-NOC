import { NextRequest, NextResponse } from 'next/server';
import { queryLokiLogs } from '@/lib/loki-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;
    const topic = searchParams.get('topic') || undefined;
    const level = searchParams.get('level') || undefined;
    const search = searchParams.get('search') || undefined;
    const startMs = searchParams.get('startMs') ? parseInt(searchParams.get('startMs')!, 10) : undefined;
    const endMs = searchParams.get('endMs') ? parseInt(searchParams.get('endMs')!, 10) : undefined;

    const result = await queryLokiLogs({
      query,
      limit,
      topic,
      level,
      search,
      startMs,
      endMs,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        totalLogs: 0,
        logs: [],
        error: error.message || 'Gagal memproses query Loki',
      },
      { status: 500 }
    );
  }
}
