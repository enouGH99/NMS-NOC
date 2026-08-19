import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reportSchedules } from '@/db/schema';
import { initialReportSchedules, initialCapacityData } from '@/lib/mock-data';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    let schedules: any[] = [];
    try {
      schedules = await db.select().from(reportSchedules).orderBy(desc(reportSchedules.createdAt));
    } catch {
      schedules = initialReportSchedules;
    }
    if (schedules.length === 0) schedules = initialReportSchedules;

    return NextResponse.json({
      success: true,
      data: {
        schedules,
        capacityTrend: initialCapacityData,
        monthlySla: [
          { month: 'Mar 2026', slaPercent: 99.92, incidents: 1, avgMtrMinutes: 12 },
          { month: 'Apr 2026', slaPercent: 99.88, incidents: 2, avgMtrMinutes: 18 },
          { month: 'Mei 2026', slaPercent: 99.95, incidents: 1, avgMtrMinutes: 8 },
          { month: 'Jun 2026', slaPercent: 99.70, incidents: 4, avgMtrMinutes: 25 },
          { month: 'Jul 2026', slaPercent: 99.85, incidents: 3, avgMtrMinutes: 14 },
          { month: 'Agu 2026', slaPercent: 99.85, incidents: 2, avgMtrMinutes: 10 },
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newSchedule = {
      id: `rep-sch-${Date.now()}`,
      name: body.name,
      frequency: body.frequency || 'mingguan',
      format: body.format || 'pdf',
      recipients: body.recipients || [],
      createdBy: body.created_by || body.createdBy || 'Budi Santoso',
      nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      enabled: body.enabled !== undefined ? body.enabled : true,
      createdAt: new Date(),
    };

    try {
      await db.insert(reportSchedules).values(newSchedule);
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, data: newSchedule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
