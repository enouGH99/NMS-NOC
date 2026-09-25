import { NextRequest, NextResponse } from 'next/server';
import { queryPrometheusRange } from '@/lib/prometheus-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) * 100';
    const start = searchParams.get('start') ? parseInt(searchParams.get('start')!, 10) : undefined;
    const end = searchParams.get('end') ? parseInt(searchParams.get('end')!, 10) : undefined;
    const step = searchParams.get('step') || '15m';
    const metricName = searchParams.get('metricName') || 'CPU Usage (%)';

    const result = await queryPrometheusRange({
      query,
      start,
      end,
      step,
      metricName,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        query: '',
        series: [],
        error: error.message || 'Gagal memproses query Prometheus',
      },
      { status: 500 }
    );
  }
}
