import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:Dimas*007@localhost:5432/nms_db';

async function clearData() {
  console.log('🧹 Menghapus semua data dummy dari database PostgreSQL (nms_db)...');
  const sql = postgres(DB_URL, { max: 1 });

  try {
    await sql.unsafe(`
      TRUNCATE TABLE 
        "device_interfaces",
        "queue_traffics",
        "vpn_tunnels",
        "device_metrics",
        "device_status_history",
        "snmp_configs",
        "notifications",
        "alerts",
        "repair_records",
        "report_schedules",
        "audit_logs",
        "auto_discovered_devices",
        "devices"
      CASCADE;
    `);

    console.log('✅ Semua data dummy perangkat, interface, queue, vpn, alert, tiket, log berhasil dikosongkan!');

    await sql`
      INSERT INTO "locations" ("id", "name", "building", "floor", "description", "device_count")
      VALUES ('loc-1', 'Data Center & Server Room', 'Gedung Utama', 'Lantai 1', 'Rak Server & Core Network Gateway', 0)
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "device_count" = 0;
    `;

    console.log('✅ Lokasi default siap.');
    console.log('🎉 Database NMS kini 100% bersih dan siap dihubungkan langsung ke Gateway MikroTik Anda!');
  } catch (err: any) {
    console.error('❌ Terjadi kesalahan saat menghapus data:', err.message);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

clearData();
