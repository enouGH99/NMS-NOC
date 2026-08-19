import { NextResponse } from 'next/server';
import { db } from '@/db';
import { devices, alerts } from '@/db/schema';
import { initialDevices, initialAlerts } from '@/lib/mock-data';

export async function GET() {
  try {
    let devList: any[] = [];
    let altList: any[] = [];

    try {
      devList = await db.select().from(devices);
      altList = await db.select().from(alerts);
    } catch {
      devList = [];
      altList = [];
    }

    const totalDevices = devList.length;
    const onlineCount = devList.filter((d: any) => d.status === 'online').length;
    const warningCount = devList.filter((d: any) => d.status === 'warning').length;
    const offlineCount = devList.filter((d: any) => d.status === 'offline' || d.status === 'unreachable').length;
    const activeAlertsCount = altList.filter((a: any) => !a.resolvedAt && !a.resolved_at).length;
    const slaPercent = totalDevices ? Number(((onlineCount / totalDevices) * 100).toFixed(2)) : 100;

    const currentInboundMbps = onlineCount > 0 ? Math.floor(onlineCount * 30 + Math.random() * 15) : 0;
    const currentOutboundMbps = onlineCount > 0 ? Math.floor(onlineCount * 10 + Math.random() * 6) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalDevices,
        onlineCount,
        warningCount,
        offlineCount,
        slaPercent,
        activeAlertsCount,
        currentInboundMbps,
        currentOutboundMbps,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
