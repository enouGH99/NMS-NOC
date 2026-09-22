import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { queueTraffics, devices } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { buildQueueHierarchy } from '@/lib/utils';

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
        rows = await db.select().from(queueTraffics);
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

              let maxLimitStr = q.max_limit || '40M';
              let limitAtStr = q.limit_at || '10M';
              let priority = q.priority || 8;
              let queueType = q.queue_type || 'pcq-download-default';

              let maxDl = 40;
              let maxUl = 40;

              if (existingRecord) {
                if (existingRecord.maxLimitDownloadMbps) maxDl = existingRecord.maxLimitDownloadMbps;
                if (existingRecord.maxLimitUploadMbps) maxUl = existingRecord.maxLimitUploadMbps;
                if (existingRecord.priority) priority = existingRecord.priority;
                if (existingRecord.queueType) queueType = existingRecord.queueType;
              } else if (q.max_limit) {
                const parts = q.max_limit.split('/');
                maxUl = parseInt(parts[0], 10) || 40;
                maxDl = parseInt(parts[1] || parts[0], 10) || 40;
              }

              const maxLimitNum = parseInt(maxLimitStr.replace(/[^0-9]/g, ''), 10) || 40;
              const limitAtNum = parseInt(limitAtStr.replace(/[^0-9]/g, ''), 10) || 10;

              await db.insert(queueTraffics).values({
                id: q.id,
                deviceId: targetRouter.id,
                name: q.name,
                parent: q.parent || existingRecord?.parent || 'global',
                packetMark: q.packet_mark || existingRecord?.packetMark || 'no-mark',
                targetSubnet: q.target || existingRecord?.targetSubnet || '0.0.0.0/0',
                maxLimitMbps: maxLimitNum,
                limitAtMbps: limitAtNum,
                maxLimitDownloadMbps: maxDl,
                maxLimitUploadMbps: maxUl,
                currentDownloadMbps: q.current_rate.download,
                currentUploadMbps: q.current_rate.upload,
                packetDropsPerSec: q.dropped,
                queueType,
                priority,
                queueKind: q.kind || 'tree',
                bytes: q.bytes || 0,
                packets: q.packets || 0,
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

    const mapped = rows.map((q: any) => {
      const maxLimit = q.maxLimitMbps ? `${q.maxLimitMbps}M` : `${q.maxLimitUploadMbps || 40}M/${q.maxLimitDownloadMbps || 40}M`;
      const limitAt = q.limitAtMbps ? `${q.limitAtMbps}M` : '10M';
      return {
        id: q.id,
        device_id: q.deviceId || q.device_id,
        name: q.name,
        parent: q.parent || 'global',
        packet_mark: q.packetMark || q.packet_mark || 'no-mark',
        target: q.parent || q.targetSubnet || q.target || 'global',
        max_limit: maxLimit,
        limit_at: limitAt,
        current_rate: {
          upload: Number(q.currentUploadMbps || 0),
          download: Number(q.currentDownloadMbps || 0),
        },
        packet_rate: q.packets > 0 ? (q.packets % 1500) : 120,
        dropped: Number(q.packetDropsPerSec || 0),
        priority: q.priority || 8,
        queue_type: q.queueType || 'pcq-download-default',
        bytes: Number(q.bytes || 0),
        packets: Number(q.packets || 0),
        kind: (q.queueKind || 'tree') as 'tree' | 'simple',
      };
    });

    // Hierarchy DFS tree sort
    const hierarchicalMapped = buildQueueHierarchy(mapped);

    return NextResponse.json({ success: true, count: hierarchicalMapped.length, data: hierarchicalMapped });
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

    const newId = body.id || `qt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let maxDl = 40;
    let maxUl = 40;
    let maxLimitNum = 40;
    let limitAtNum = 10;

    if (body.max_limit) {
      const parts = String(body.max_limit).split('/');
      maxUl = parseInt(parts[0], 10) || 40;
      maxDl = parseInt(parts[1] || parts[0], 10) || 40;
      maxLimitNum = maxDl;
    } else {
      maxDl = body.max_limit_download_mbps || body.maxLimitDownloadMbps || 40;
      maxUl = body.max_limit_upload_mbps || body.maxLimitUploadMbps || 40;
      maxLimitNum = maxDl;
    }

    if (body.limit_at) {
      limitAtNum = parseInt(String(body.limit_at).replace(/[^0-9]/g, ''), 10) || 10;
    } else if (body.limitAtMbps) {
      limitAtNum = Number(body.limitAtMbps) || 10;
    }

    const newQueue = {
      id: newId,
      deviceId: targetDeviceId,
      name: body.name || 'Queue Tree Baru',
      parent: body.parent || body.parent_name || 'global',
      packetMark: body.packet_mark || body.packetMark || body.flow || 'no-mark',
      targetSubnet: body.target || body.target_subnet || body.parent || 'global',
      maxLimitMbps: maxLimitNum,
      limitAtMbps: limitAtNum,
      maxLimitDownloadMbps: maxDl,
      maxLimitUploadMbps: maxUl,
      currentDownloadMbps: body.current_rate?.download || body.currentDownloadMbps || 0,
      currentUploadMbps: body.current_rate?.upload || body.currentUploadMbps || 0,
      packetDropsPerSec: body.dropped !== undefined ? body.dropped : (body.packetDropsPerSec || 0),
      queueType: body.queue_type || body.queueType || 'pcq-download-default',
      priority: body.priority || 8,
      queueKind: body.kind || 'tree',
      bytes: body.bytes || 0,
      packets: body.packets || 0,
      updatedAt: new Date(),
    };

    await db.insert(queueTraffics).values(newQueue);

    const mapped = {
      id: newQueue.id,
      device_id: newQueue.deviceId,
      name: newQueue.name,
      parent: newQueue.parent,
      packet_mark: newQueue.packetMark,
      target: newQueue.parent,
      max_limit: `${newQueue.maxLimitMbps}M`,
      limit_at: `${newQueue.limitAtMbps}M`,
      current_rate: {
        upload: newQueue.currentUploadMbps,
        download: newQueue.currentDownloadMbps,
      },
      packet_rate: 120,
      dropped: newQueue.packetDropsPerSec,
      priority: newQueue.priority,
      queue_type: newQueue.queueType,
      kind: newQueue.queueKind,
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

    const updateValues: any = {
      updatedAt: new Date(),
    };

    if (body.name) updateValues.name = body.name.trim();
    if (body.parent) updateValues.parent = body.parent.trim();
    if (body.packet_mark || body.packetMark) {
      updateValues.packetMark = (body.packet_mark || body.packetMark).trim();
    }
    if (body.target || body.targetSubnet || body.target_subnet) {
      updateValues.targetSubnet = (body.target || body.targetSubnet || body.target_subnet).trim();
    }
    if (body.priority !== undefined) {
      updateValues.priority = Number(body.priority) || 8;
    }
    if (body.queue_type || body.queueType) {
      updateValues.queueType = (body.queue_type || body.queueType).trim();
    }

    if (body.max_limit) {
      const val = parseInt(String(body.max_limit).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(val)) {
        updateValues.maxLimitMbps = val;
        updateValues.maxLimitDownloadMbps = val;
        updateValues.maxLimitUploadMbps = val;
      }
    } else {
      if (body.maxLimitMbps !== undefined) updateValues.maxLimitMbps = Number(body.maxLimitMbps);
      if (body.maxLimitDownloadMbps !== undefined) updateValues.maxLimitDownloadMbps = Number(body.maxLimitDownloadMbps);
      if (body.maxLimitUploadMbps !== undefined) updateValues.maxLimitUploadMbps = Number(body.maxLimitUploadMbps);
    }

    if (body.limit_at) {
      const val = parseInt(String(body.limit_at).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(val)) updateValues.limitAtMbps = val;
    } else if (body.limitAtMbps !== undefined) {
      updateValues.limitAtMbps = Number(body.limitAtMbps);
    }

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
      parent: q.parent || 'global',
      packet_mark: q.packetMark || 'no-mark',
      target: q.parent || q.targetSubnet || 'global',
      max_limit: `${q.maxLimitMbps || q.maxLimitDownloadMbps || 40}M`,
      limit_at: `${q.limitAtMbps || 10}M`,
      current_rate: {
        upload: Number(q.currentUploadMbps || 0),
        download: Number(q.currentDownloadMbps || 0),
      },
      packet_rate: 120,
      dropped: Number(q.packetDropsPerSec || 0),
      priority: q.priority || 8,
      queue_type: q.queueType || 'pcq-download-default',
      kind: q.queueKind || 'tree',
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
    return NextResponse.json({ success: true, message: 'Queue Tree berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

