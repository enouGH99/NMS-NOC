import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { db } from '@/db';
import { devices, locations, alerts, user } from '@/db/schema';

const execAsync = util.promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), 'backups', 'postgres');

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * GET /api/backup
 * Lists available backup files or downloads a requested backup file
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const downloadFile = url.searchParams.get('download');

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Handle direct file download
    if (downloadFile) {
      const safeName = path.basename(downloadFile);
      const targetPath = path.join(BACKUP_DIR, safeName);

      if (!fs.existsSync(targetPath)) {
        return NextResponse.json({ success: false, message: 'File backup tidak ditemukan.' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(targetPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Disposition': `attachment; filename="${safeName}"`,
          'Content-Type': 'application/octet-stream',
        },
      });
    }

    // List all files
    const files = fs.readdirSync(BACKUP_DIR);
    const backupList: BackupFileInfo[] = [];

    for (const f of files) {
      if (f.startsWith('nms_db_backup_') || f.endsWith('.sql.gz') || f.endsWith('.sql') || f.endsWith('.json')) {
        const fullPath = path.join(BACKUP_DIR, f);
        try {
          const stats = fs.statSync(fullPath);
          backupList.push({
            fileName: f,
            filePath: `/api/backup?download=${encodeURIComponent(f)}`,
            sizeBytes: stats.size,
            sizeFormatted: formatBytes(stats.size),
            createdAt: stats.mtime.toISOString(),
          });
        } catch {
          // Ignore
        }
      }
    }

    // Sort descending by created date
    backupList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      backupDir: BACKUP_DIR,
      retentionDays: 14,
      schedule: '0 2 * * * (Setiap Hari Pukul 02:00 WIB)',
      backups: backupList,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/backup
 * Triggers an on-demand database backup
 */
export async function POST(request: NextRequest) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 15);
    const backupFileName = `nms_db_backup_${dateStr}.sql`;
    const fullPath = path.join(BACKUP_DIR, backupFileName);

    let executedViaDocker = false;

    // Try executing pg_dump via docker exec if available
    try {
      const containerName = 'nms-noc-postgres';
      const dbUser = process.env.POSTGRES_USER || 'postgres';
      const dbName = process.env.POSTGRES_DB || 'nms_db';
      await execAsync(`docker exec -t ${containerName} pg_dump -U ${dbUser} -d ${dbName} --clean --if-exists --no-owner > "${fullPath}"`);
      executedViaDocker = true;
    } catch {
      // If docker exec fails (e.g. running outside docker socket or direct node), fallback to JSON snapshot
      const devList = await db.select().from(devices);
      const locList = await db.select().from(locations);
      const altList = await db.select().from(alerts);
      const usrList = await db.select().from(user);

      const snapshot = {
        metadata: {
          database: 'nms_db',
          createdAt: now.toISOString(),
          appVersion: '2.0.0',
          engine: 'drizzle-orm-snapshot',
        },
        data: {
          locations: locList,
          devices: devList,
          alerts: altList,
          users: usrList.map((u: any) => ({ ...u, password: '[REDACTED]' })),
        },
      };

      const jsonFileName = `nms_db_backup_${dateStr}.json`;
      const jsonFullPath = path.join(BACKUP_DIR, jsonFileName);
      fs.writeFileSync(jsonFullPath, JSON.stringify(snapshot, null, 2), 'utf-8');

      const stats = fs.statSync(jsonFullPath);
      return NextResponse.json({
        success: true,
        message: 'Snapshot backup database berhasil dibuat (JSON Format).',
        backupFile: {
          fileName: jsonFileName,
          filePath: `/api/backup?download=${encodeURIComponent(jsonFileName)}`,
          sizeBytes: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: now.toISOString(),
          type: 'json_snapshot',
        },
      });
    }

    const stats = fs.statSync(fullPath);
    return NextResponse.json({
      success: true,
      message: 'Backup database PostgreSQL berhasil dibuat via pg_dump.',
      backupFile: {
        fileName: backupFileName,
        filePath: `/api/backup?download=${encodeURIComponent(backupFileName)}`,
        sizeBytes: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: now.toISOString(),
        type: 'sql_dump',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/backup?file=<filename>
 * Deletes a specific backup file
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');

    if (!fileName) {
      return NextResponse.json({ success: false, message: 'Parameter file wajib diisi.' }, { status: 400 });
    }

    const safeName = path.basename(fileName);
    const targetPath = path.join(BACKUP_DIR, safeName);

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return NextResponse.json({ success: true, message: `File backup '${safeName}' berhasil dihapus.` });
    }

    return NextResponse.json({ success: false, message: 'File tidak ditemukan.' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
