import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { queueTraffics, devices } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    let rows: any[] = [];
    try {
      if (deviceId) {
        rows = await db.select().from(queueTraffics).where(eq(queueTraffics.deviceId, deviceId));
      } else {
        rows = await db.select().from(queueTraffics).orderBy(desc(queueTraffics.priority));
      }

      // If empty and there is at least one router device registered, auto-seed standard MikroTik queues
      if (rows.length === 0) {
        const routerRows = await db.select().from(devices);
        const targetRouter = deviceId 
          ? routerRows.find(d => d.id === deviceId) 
          : routerRows.find(d => d.type === 'router') || routerRows[0];

        if (targetRouter) {
          const defaultQueues = [
            {
              id: `q-${Date.now()}-1`,
              deviceId: targetRouter.id,
              name: 'TOTAL-BANDWIDTH',
              targetSubnet: '0.0.0.0/0',
              maxLimitDownloadMbps: 100,
              maxLimitUploadMbps: 100,
              currentDownloadMbps: 28.5,
              currentUploadMbps: 4.2,
              packetDropsPerSec: 0,
              queueType: 'default-small',
              priority: 1,
            },
            {
              id: `q-${Date.now()}-2`,
              deviceId: targetRouter.id,
              name: 'Admin-LAN (ether2)',
              targetSubnet: 'ether2',
              maxLimitDownloadMbps: 100,
              maxLimitUploadMbps: 100,
              currentDownloadMbps: 14.2,
              currentUploadMbps: 2.1,
              packetDropsPerSec: 0,
              queueType: 'default-small',
              priority: 2,
            },
            {
              id: `q-${Date.now()}-3`,
              deviceId: targetRouter.id,
              name: 'WiFi-Utama (wlan1)',
              targetSubnet: 'wlan1',
              maxLimitDownloadMbps: 20,
              maxLimitUploadMbps: 20,
              currentDownloadMbps: 8.6,
              currentUploadMbps: 1.4,
              packetDropsPerSec: 0,
              queueType: 'default-small',
              priority: 3,
            },
            {
              id: `q-${Date.now()}-4`,
              deviceId: targetRouter.id,
              name: 'WiFi-Game (Legend)',
              targetSubnet: 'wlan1 (Legend)',
              maxLimitDownloadMbps: 5,
              maxLimitUploadMbps: 5,
              currentDownloadMbps: 2.1,
              currentUploadMbps: 0.4,
              packetDropsPerSec: 0,
              queueType: 'default-small',
              priority: 4,
            },
            {
              id: `q-${Date.now()}-5`,
              deviceId: targetRouter.id,
              name: 'WiFi-Umum (Selain-Legend)',
              targetSubnet: 'wlan1',
              maxLimitDownloadMbps: 15,
              maxLimitUploadMbps: 15,
              currentDownloadMbps: 6.5,
              currentUploadMbps: 1.0,
              packetDropsPerSec: 0,
              queueType: 'default-small',
              priority: 5,
            },
            {
              id: `q-${Date.now()}-6`,
              deviceId: targetRouter.id,
              name: 'Staff-LAN (ether4)',
              targetSubnet: 'ether4',
              maxLimitDownloadMbps: 20,
              maxLimitUploadMbps: 20,
              currentDownloadMbps: 5.7,
              currentUploadMbps: 0.8,
              packetDropsPerSec: 0,
              queueType: 'default-small',
              priority: 6,
            },
            {
              id: `q-${Date.now()}-7`,
              deviceId: targetRouter.id,
              name: 'Staff-Umum',
              targetSubnet: 'ether4',
              maxLimitDownloadMbps: 10,
              maxLimitUploadMbps: 10,
              currentDownloadMbps: 3.2,
              currentUploadMbps: 0.5,
              packetDropsPerSec: 0,
              queueType: 'default-small',
              priority: 7,
            },
            {
              id: `q-${Date.now()}-8`,
              deviceId: targetRouter.id,
              name: 'Staff-VIP (Legend)',
              targetSubnet: 'ether4 (Legend)',
              maxLimitDownloadMbps: 5,
              maxLimitUploadMbps: 5,
              currentDownloadMbps: 2.5,
              currentUploadMbps: 0.3,
              packetDropsPerSec: 0,
              queueType: 'default-small',
              priority: 8,
            },
          ];

          for (const q of defaultQueues) {
            await db.insert(queueTraffics).values({ ...q, updatedAt: new Date() }).onConflictDoNothing();
          }

          rows = await db.select().from(queueTraffics).orderBy(desc(queueTraffics.priority));
        }
      }
    } catch {
      rows = [];
    }

    const mapped = rows.map((q: any) => ({
      id: q.id,
      device_id: q.deviceId || q.device_id,
      name: q.name,
      target: q.targetSubnet || q.target || '0.0.0.0/0',
      max_limit: `${q.maxLimitUploadMbps || 20}M/${q.maxLimitDownloadMbps || 20}M`,
      current_rate: {
        upload: Number(q.currentUploadMbps || 0),
        download: Number(q.currentDownloadMbps || 0),
      },
      packet_rate: 120,
      dropped: Number(q.packetDropsPerSec || 0),
    }));

    return NextResponse.json({ success: true, count: mapped.length, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let targetDeviceId = body.device_id || body.deviceId;
    if (!targetDeviceId) {
      const devRows = await db.select().from(devices);
      if (devRows.length > 0) {
        targetDeviceId = devRows[0].id;
      } else {
        return NextResponse.json({ success: false, error: 'Belum ada perangkat terdaftar.' }, { status: 400 });
      }
    }

    const newId = body.id || `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let maxDl = 20;
    let maxUl = 20;
    if (body.max_limit) {
      const parts = String(body.max_limit).split('/');
      maxUl = parseInt(parts[0], 10) || 20;
      maxDl = parseInt(parts[1] || parts[0], 10) || 20;
    } else {
      maxDl = body.max_limit_download_mbps || body.maxLimitDownloadMbps || 20;
      maxUl = body.max_limit_upload_mbps || body.maxLimitUploadMbps || 20;
    }

    const newQueue = {
      id: newId,
      deviceId: targetDeviceId,
      name: body.name || 'Queue Baru',
      targetSubnet: body.target || body.target_subnet || body.targetSubnet || '0.0.0.0/0',
      maxLimitDownloadMbps: maxDl,
      maxLimitUploadMbps: maxUl,
      currentDownloadMbps: body.current_rate?.download || body.currentDownloadMbps || 0,
      currentUploadMbps: body.current_rate?.upload || body.currentUploadMbps || 0,
      packetDropsPerSec: body.dropped !== undefined ? body.dropped : (body.packetDropsPerSec || 0),
      queueType: body.queue_type || body.queueType || 'default-small',
      priority: body.priority || 8,
      updatedAt: new Date(),
    };

    await db.insert(queueTraffics).values(newQueue);

    const mapped = {
      id: newQueue.id,
      device_id: newQueue.deviceId,
      name: newQueue.name,
      target: newQueue.targetSubnet,
      max_limit: `${newQueue.maxLimitUploadMbps}M/${newQueue.maxLimitDownloadMbps}M`,
      current_rate: {
        upload: newQueue.currentUploadMbps,
        download: newQueue.currentDownloadMbps,
      },
      packet_rate: 120,
      dropped: newQueue.packetDropsPerSec,
    };

    return NextResponse.json({ success: true, data: mapped }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
