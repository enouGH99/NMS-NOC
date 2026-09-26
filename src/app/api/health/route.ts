import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * GET /api/health
 * Comprehensive production healthcheck endpoint for Docker containers, LB probes, and uptime monitors.
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbStatus = 'unhealthy';
    dbError = err.message;
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const isOverallHealthy = dbStatus === 'healthy';
  const statusCode = isOverallHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isOverallHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      uptimeHuman: `${Math.floor(uptimeSeconds / 3600)}j ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
      responseTimeMs: Date.now() - startTime,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          error: dbError,
        },
        snmpWorker: {
          status: 'running',
          mode: 'event-driven-sse',
        },
        observability: {
          loki: process.env.LOKI_URL ? 'configured' : 'standalone-mock',
          prometheus: process.env.PROMETHEUS_URL ? 'configured' : 'standalone-mock',
        },
      },
      system: {
        nodeVersion: process.version,
        memory: {
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
      },
    },
    { status: statusCode }
  );
}
