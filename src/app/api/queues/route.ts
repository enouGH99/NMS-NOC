import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { queueTraffics, devices } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const refresh = searchParams.get('refresh') === 'true';

    let rows: any[] = [];
    try {
      if (deviceId) {
        rows = await db.select().from(queueTraffics).where(eq(queueTraffics.deviceId, deviceId));
      } else {
        rows = await db.select().from(queueTraffics).orderBy(desc(queueTraffics.priority));
      }

      // If refresh requested OR database empty, poll live queues directly from MikroTik via SNMP
      if (refresh || rows.length === 0) {
        const routerRows = await db.select().from(devices);
        const targetRouter = deviceId 
          ? routerRows.find(d => d.id === deviceId) 
          : routerRows.find(d => d.type === 'router') || routerRows[0];

        if (targetRouter && targetRouter.ipAddress) {
          const { pollDeviceSnmp } = await import('@/lib/snmp-poller');
          const pollRes = await pollDeviceSnmp(targetRouter.id, {
            ipAddress: targetRouter.ipAddress,
            community: targetRouter.snmpCommunity || 'public_nms',
            version: (targetRouter.snmpVersion as any) || 'v2c',
            timeoutMs: 3500,
            retries: 1,
          });

          if (pollRes.success && pollRes.queues.length > 0) {
            // Index existing queues in PostgreSQL by normalized name to preserve user-customized limits
            const existingDbRows = await db.select().from(queueTraffics).where(eq(queueTraffics.deviceId, targetRouter.id));
            const existingMap = new Map<string, any>();
            for (const row of existingDbRows) {
              existingMap.set(row.name.trim().toLowerCase(), row);
              existingMap.set(row.id, row);
            }

            // Delete old queues for this device
            await db.delete(queueTraffics).where(eq(queueTraffics.deviceId, targetRouter.id));

            for (let i = 0; i < pollRes.queues.length; i++) {
              const q = pollRes.queues[i];
              const normalizedName = q.name.trim().toLowerCase();
              const existingRecord = existingMap.get(normalizedName) || existingMap.get(q.id);

              let maxDl = 40;
              let maxUl = 40;

              // Priority 1: User's customized limit saved in Database
              if (existingRecord && existingRecord.maxLimitDownloadMbps && existingRecord.maxLimitUploadMbps) {
                maxDl = existingRecord.maxLimitDownloadMbps;
                maxUl = existingRecord.maxLimitUploadMbps;
              } else if (q.max_limit) {
                // Priority 2: Poller limit
                const parts = q.max_limit.split('/');
                maxUl = parseInt(parts[0], 10) || 40;
                maxDl = parseInt(parts[1] || parts[0], 10) || 40;
              }

              // Target string (preserve DB target if customized or use live target)
              const target = (existingRecord && existingRecord.targetSubnet && existingRecord.targetSubnet.includes('bridge-Server'))
                ? existingRecord.targetSubnet
                : q.target;

              await db.insert(queueTraffics).values({
                id: q.id,
                deviceId: targetRouter.id,
                name: q.name,
                targetSubnet: target,
                maxLimitDownloadMbps: maxDl,
                maxLimitUploadMbps: maxUl,
                currentDownloadMbps: q.current_rate.download,
                currentUploadMbps: q.current_rate.upload,
                packetDropsPerSec: q.dropped,
                queueType: 'default-small',
                priority: i + 1,
                updatedAt: new Date(),
              });
            }

            rows = await db.select().from(queueTraffics).where(eq(queueTraffics.deviceId, targetRouter.id));
          }
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
      max_limit: `${q.maxLimitUploadMbps || 40}M/${q.maxLimitDownloadMbps || 40}M`,
      current_rate: {
        upload: Number(q.currentUploadMbps || 0),
        download: Number(q.currentDownloadMbps || 0),
      },
      packet_rate: 120,
      dropped: Number(q.packetDropsPerSec || 0),
    }));

    // Natural sort: 1. Total Bandwith, 2. Laptop Mr M, 3. DEV, 4. Kantor, 5. Server
    mapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

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

    let maxDl = 40;
    let maxUl = 40;
    if (body.max_limit) {
      const parts = String(body.max_limit).split('/');
      maxUl = parseInt(parts[0], 10) || 40;
      maxDl = parseInt(parts[1] || parts[0], 10) || 40;
    } else {
      maxDl = body.max_limit_download_mbps || body.maxLimitDownloadMbps || 40;
      maxUl = body.max_limit_upload_mbps || body.maxLimitUploadMbps || 40;
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Queue ID wajib diisi' }, { status: 400 });
    }

    let maxDl: number | undefined;
    let maxUl: number | undefined;
    if (body.max_limit) {
      const parts = String(body.max_limit).split('/');
      maxUl = parseInt(parts[0], 10);
      maxDl = parseInt(parts[1] || parts[0], 10);
    } else {
      if (body.max_limit_download_mbps !== undefined) maxDl = Number(body.max_limit_download_mbps);
      else if (body.maxLimitDownloadMbps !== undefined) maxDl = Number(body.maxLimitDownloadMbps);
      
      if (body.max_limit_upload_mbps !== undefined) maxUl = Number(body.max_limit_upload_mbps);
      else if (body.maxLimitUploadMbps !== undefined) maxUl = Number(body.maxLimitUploadMbps);
    }

    const updateValues: any = {
      updatedAt: new Date(),
    };

    if (body.name) updateValues.name = body.name.trim();
    if (body.target || body.targetSubnet || body.target_subnet) {
      updateValues.targetSubnet = (body.target || body.targetSubnet || body.target_subnet).trim();
    }
    if (maxDl !== undefined && !isNaN(maxDl)) updateValues.maxLimitDownloadMbps = maxDl;
    if (maxUl !== undefined && !isNaN(maxUl)) updateValues.maxLimitUploadMbps = maxUl;

    await db.update(queueTraffics).set(updateValues).where(eq(queueTraffics.id, id));

    const updated = await db.select().from(queueTraffics).where(eq(queueTraffics.id, id));
    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: 'Queue tidak ditemukan di database' }, { status: 404 });
    }

    const q = updated[0];
    const mapped = {
      id: q.id,
      device_id: q.deviceId,
      name: q.name,
      target: q.targetSubnet,
      max_limit: `${q.maxLimitUploadMbps}M/${q.maxLimitDownloadMbps}M`,
      current_rate: {
        upload: Number(q.currentUploadMbps || 0),
        download: Number(q.currentDownloadMbps || 0),
      },
      packet_rate: 120,
      dropped: Number(q.packetDropsPerSec || 0),
    };

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Queue ID is required' }, { status: 400 });
    }

    await db.delete(queueTraffics).where(eq(queueTraffics.id, id));
    return NextResponse.json({ success: true, message: 'Queue berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

