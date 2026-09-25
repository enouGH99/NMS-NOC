import { NextResponse } from 'next/server';
import { checkLokiHealth } from '@/lib/loki-client';
import { checkPrometheusHealth } from '@/lib/prometheus-client';
import { ObservabilityHealth } from '@/lib/types';

export async function GET() {
  const grafanaUrl = process.env.GRAFANA_URL || 'http://192.168.100.8:3000';

  // Test Grafana health
  let grafanaHealth = { available: false, url: grafanaUrl, latencyMs: 0, error: undefined as string | undefined };
  const gStart = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${grafanaUrl.replace(/\/$/, '')}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);
    grafanaHealth = {
      available: res.ok,
      url: grafanaUrl,
      latencyMs: Date.now() - gStart,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    grafanaHealth = {
      available: false,
      url: grafanaUrl,
      latencyMs: Date.now() - gStart,
      error: err.message,
    };
  }

  const [lokiRes, promRes] = await Promise.all([
    checkLokiHealth(),
    checkPrometheusHealth(),
  ]);

  const healthData: ObservabilityHealth = {
    loki: lokiRes,
    prometheus: promRes,
    grafana: grafanaHealth,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({
    success: true,
    data: healthData,
  });
}
