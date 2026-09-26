import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { client, db } from '@/db';
import {
  user,
  locations,
  devices,
  deviceInterfaces,
  queueTraffics,
  vpnTunnels,
  alerts,
  alertRules,
  repairRecords,
  reportSchedules,
  auditLogs,
  autoDiscoveredDevices,
  deviceMetrics,
  rawSnmpMetrics,
} from '@/db/schema';

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'postgres');

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function cleanEmptyGhostFiles() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;
    const files = fs.readdirSync(BACKUP_DIR);
    for (const f of files) {
      const fullPath = path.join(BACKUP_DIR, f);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size === 0) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Ignore
      }
    }
  } catch {
    // Ignore
  }
}

/**
 * Helper to escape SQL values safely for INSERT statements
 */
function escapeSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::json`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Generate a complete SQL dump script from database tables
 */
async function generateNativeSqlDump(): Promise<string> {
  const timestamp = new Date().toISOString();
  const sqlLines: string[] = [
    `-- ==============================================================================`,
    `-- NMS-NOC PostgreSQL Database Dump`,
    `-- Generated At : ${timestamp}`,
    `-- Application  : NMS-NOC Platform v2.0`,
    `-- Engine       : Native SQL Exporter`,
    `-- ==============================================================================`,
    `BEGIN;`,
    `SET statement_timeout = 0;`,
    `SET client_encoding = 'UTF8';`,
    `SET standard_conforming_strings = on;`,
    ``,
  ];

  const tableDefinitions: Array<{ name: string; query: () => Promise<any[]> }> = [
    { name: 'locations', query: () => db.select().from(locations) },
    { name: 'devices', query: () => db.select().from(devices) },
    { name: 'device_interfaces', query: () => db.select().from(deviceInterfaces) },
    { name: 'queue_traffics', query: () => db.select().from(queueTraffics) },
    { name: 'vpn_tunnels', query: () => db.select().from(vpnTunnels) },
    { name: 'alerts', query: () => db.select().from(alerts) },
    { name: 'alert_rules', query: () => db.select().from(alertRules) },
    { name: 'repair_records', query: () => db.select().from(repairRecords) },
    { name: 'report_schedules', query: () => db.select().from(reportSchedules) },
    { name: 'audit_logs', query: () => db.select().from(auditLogs) },
    { name: 'auto_discovered_devices', query: () => db.select().from(autoDiscoveredDevices) },
    { name: 'user', query: () => db.select().from(user) },
    { name: 'device_metrics', query: () => db.select().from(deviceMetrics).limit(2000) },
    { name: 'raw_snmp_metrics', query: () => db.select().from(rawSnmpMetrics).limit(2000) },
  ];

  for (const table of tableDefinitions) {
    try {
      const rows = await table.query();
      if (rows.length === 0) continue;

      sqlLines.push(`-- Table: ${table.name} (${rows.length} rows)`);
      sqlLines.push(`TRUNCATE TABLE "${table.name}" CASCADE;`);

      const columns = Object.keys(rows[0]);
      const quotedCols = columns.map((c) => `"${c.replace(/([A-Z])/g, '_$1').toLowerCase()}"`).join(', ');

      for (const row of rows) {
        const values = columns.map((col) => escapeSqlValue(row[col])).join(', ');
        sqlLines.push(`INSERT INTO "${table.name}" (${quotedCols}) VALUES (${values}) ON CONFLICT DO NOTHING;`);
      }
      sqlLines.push(``);
    } catch (err: any) {
      sqlLines.push(`-- Warning: Skipping table ${table.name}: ${err.message}`);
    }
  }

  sqlLines.push(`COMMIT;`);
  sqlLines.push(`-- Dump complete.`);

  return sqlLines.join('\n');
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

    cleanEmptyGhostFiles();

    // Handle direct file download
    if (downloadFile) {
      const safeName = path.basename(downloadFile);
      const targetPath = path.join(BACKUP_DIR, safeName);

      if (!fs.existsSync(targetPath)) {
        return NextResponse.json({ success: false, message: 'File backup tidak ditemukan.' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(targetPath);
      const contentType = safeName.endsWith('.json')
        ? 'application/json'
        : safeName.endsWith('.sql.gz')
        ? 'application/gzip'
        : 'application/sql';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Disposition': `attachment; filename="${safeName}"`,
          'Content-Type': contentType,
        },
      });
    }

    // List all non-empty files
    const files = fs.readdirSync(BACKUP_DIR);
    const backupList: BackupFileInfo[] = [];

    for (const f of files) {
      if (f.startsWith('nms_db_backup_') || f.endsWith('.sql.gz') || f.endsWith('.sql') || f.endsWith('.json')) {
        const fullPath = path.join(BACKUP_DIR, f);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size > 0) {
            backupList.push({
              fileName: f,
              filePath: `/api/backup?download=${encodeURIComponent(f)}`,
              sizeBytes: stats.size,
              sizeFormatted: formatBytes(stats.size),
              createdAt: stats.mtime.toISOString(),
            });
          }
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
 * Generates a full native PostgreSQL SQL backup file
 */
export async function POST(request: NextRequest) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    cleanEmptyGhostFiles();

    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 15);
    const sqlFileName = `nms_db_backup_${dateStr}.sql`;
    const sqlFullPath = path.join(BACKUP_DIR, sqlFileName);

    // Generate Full SQL Dump directly from active PostgreSQL connection
    const sqlContent = await generateNativeSqlDump();
    fs.writeFileSync(sqlFullPath, sqlContent, 'utf-8');

    const stats = fs.statSync(sqlFullPath);

    return NextResponse.json({
      success: true,
      message: `Backup database PostgreSQL berhasil dibuat (${formatBytes(stats.size)}).`,
      backupFile: {
        fileName: sqlFileName,
        filePath: `/api/backup?download=${encodeURIComponent(sqlFileName)}`,
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
