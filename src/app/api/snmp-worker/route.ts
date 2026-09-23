import { NextRequest, NextResponse } from 'next/server';
import { getSnmpWorkerStatus, runSnmpPollCycle, startSnmpBackgroundWorker } from '@/lib/snmp-worker';

export async function GET() {
  try {
    const status = getSnmpWorkerStatus();
    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'start') {
      startSnmpBackgroundWorker(body.interval);
    } else {
      // Force trigger immediate poll cycle
      await runSnmpPollCycle();
    }
    const status = getSnmpWorkerStatus();
    return NextResponse.json({ success: true, message: 'SNMP Poll cycle triggered', status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
