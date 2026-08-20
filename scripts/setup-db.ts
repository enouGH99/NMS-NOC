import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:Dimas*007@localhost:5432/nms_db';

async function main() {
  console.log('🚀 Running Complete NMS Database Setup...');

  // 1. Ensure database exists
  const serverSql = postgres('postgres://postgres:Dimas*007@localhost:5432/postgres', { max: 1 });
  try {
    const res = await serverSql`SELECT 1 FROM pg_database WHERE datname = 'nms_db'`;
    if (res.length === 0) {
      console.log('📦 Creating database nms_db...');
      await serverSql`CREATE DATABASE nms_db`;
    } else {
      console.log('✅ Database nms_db exists.');
    }
  } catch (err: any) {
    console.warn('⚠️ Server check warning:', err.message);
  } finally {
    await serverSql.end();
  }

  // 2. Connect to nms_db and apply migrations
  const appSql = postgres(DB_URL, { max: 1 });
  try {
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_fluffy_mach_iv.sql');
    if (fs.existsSync(migrationPath)) {
      console.log('📄 Applying schema migration from 0000_fluffy_mach_iv.sql...');
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      const statements = sqlContent.split('--> statement-breakpoint');

      for (const stmt of statements) {
        const clean = stmt.trim();
        if (clean.length > 0) {
          try {
            await appSql.unsafe(clean);
          } catch (stmtErr: any) {
            // Ignore "relation already exists" errors
            if (!stmtErr.message.includes('already exists') && !stmtErr.message.includes('duplicate')) {
              console.warn('⚠️ Statement execution note:', stmtErr.message);
            }
          }
        }
      }
      console.log('✅ Schema migration applied successfully!');
    }

    // 3. Seed Users
    console.log('🌱 Seeding initial records...');
    await appSql`
      INSERT INTO "user" ("id", "name", "email", "email_verified", "role", "phone", "status", "image")
      VALUES
        ('usr-1', 'Budi Santoso', 'admin@kantor.go.id', true, 'admin', '+62 812-3456-7890', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60'),
        ('usr-2', 'Dimas Prakoso', 'dimas@kantor.go.id', true, 'petugas', '+62 813-9876-5432', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60'),
        ('usr-3', 'Siti Rahma', 'siti@kantor.go.id', true, 'petugas', '+62 811-2345-6789', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60')
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "email" = EXCLUDED."email",
        "role" = EXCLUDED."role";
    `;

    // 4. Seed Locations
    await appSql`
      INSERT INTO "locations" ("id", "name", "building", "floor", "description", "device_count")
      VALUES
        ('loc-1', 'Gedung A - Lantai 1', 'Gedung A', 'Lantai 1', 'Ruang Pelayanan, Lobby, dan Area Kerja Utama', 5),
        ('loc-2', 'Gedung A - Lantai 2', 'Gedung A', 'Lantai 2', 'Ruang Direksi, Ruang Rapat, dan Finance', 4),
        ('loc-3', 'Data Center & Server Room', 'Gedung A', 'Basement', 'Rak Server Utama, Core Switch, Router Gateway, UPS', 6),
        ('loc-4', 'Gedung B - Lantai 1', 'Gedung B', 'Lantai 1', 'Gudang & Divisi Operasional Logistik', 3),
        ('loc-5', 'Area Outdoor & Pos Jaga', 'Outdoor', 'Ground', 'Access Point Luar & CCTV perimeter', 2)
      ON CONFLICT ("id") DO NOTHING;
    `;

    // 5. Seed Devices
    await appSql`
      INSERT INTO "devices" ("id", "name", "type", "ip_address", "mac_address", "model", "location_id", "location_name", "is_priority", "status", "uptime", "cpu_usage", "ram_usage", "storage_usage", "temperature", "latency", "packet_loss", "parent_device_id", "snmp_version", "snmp_community", "coord_x", "coord_y")
      VALUES
        ('dev-1', 'MikroTik CCR2004 (Core Gateway)', 'router', '192.168.1.1', '48:8F:5A:11:22:33', 'MikroTik CCR2004-16G-2S+', 'loc-3', 'Data Center & Server Room', true, 'online', '45 hari 12 jam', 28, 45, 30, 41, 1, 0, NULL, 'v2c', 'public_nms', 400, 80),
        ('dev-2', 'Cisco CBS350 Core Switch 24-Port', 'switch', '192.168.1.2', '00:26:0B:AA:BB:CC', 'Cisco Business 350 Managed 24G', 'loc-3', 'Data Center & Server Room', true, 'online', '45 hari 11 jam', 15, 38, 22, 38, 1, 0, 'dev-1', 'v2c', 'public_nms', 400, 200),
        ('dev-6', 'UniFi AP Lobby & Pelayanan (Lt.1)', 'access_point', '192.168.10.15', '70:A7:41:44:55:66', 'UniFi U6 Pro Enterprise', 'loc-1', 'Gedung A - Lantai 1', true, 'warning', '12 hari 4 jam', 78, 82, 40, 49, 28, 2, 'dev-2', 'v2c', 'public_nms', 180, 500),
        ('dev-9', 'Switch Distribusi Gedung B', 'switch', '192.168.1.30', '00:1E:13:EE:90:77', 'Cisco Catalyst 2960-24TT', 'loc-4', 'Gedung B - Lantai 1', false, 'offline', '0 menit (Down)', 0, 0, 0, 0, 999, 100, 'dev-2', 'v2c', 'public_nms', 700, 340)
      ON CONFLICT ("id") DO NOTHING;
    `;

    // 6. Seed AI Config
    await appSql`
      INSERT INTO "ai_configs" ("id", "provider", "model", "api_key", "temperature", "max_tokens", "auto_scan_enabled", "auto_scan_interval_minutes", "auto_generate_scripts", "notify_on_anomaly", "connection_status")
      VALUES ('default_config', 'google_gemini', 'gemini-2.5-flash', 'AIzaSyD-NOC-NMS-DEMO-SECURE-KEY-9948271', 0.2, 4096, true, 15, true, true, 'connected')
      ON CONFLICT ("id") DO NOTHING;
    `;

    console.log('🎉 Setup and Seeding Complete!');
  } catch (err: any) {
    console.error('❌ Migration / Seed error:', err);
  } finally {
    await appSql.end();
  }
}

main();
