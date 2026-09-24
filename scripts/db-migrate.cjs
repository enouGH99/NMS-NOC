/**
 * Standalone Database Auto-Migrator for Production & Docker Containers
 * Runs with 0 external dev dependencies (pure Node.js + postgres driver).
 */
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Simple zero-dependency .env loader for local development
function loadEnvFile(filePath) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.substring(0, idx).trim();
            const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  } catch (e) {
    // Ignore errors
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:Dimas*007@localhost:5432/nms_db';

console.log('🔄 Menghubungkan ke PostgreSQL database...');

const sql = postgres(connectionString, {
  max: 1,
  connect_timeout: 10,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS "locations" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "building" text NOT NULL,
    "floor" text NOT NULL,
    "description" text,
    "device_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "devices" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "type" text NOT NULL,
    "ip_address" text NOT NULL,
    "mac_address" text,
    "model" text,
    "location_id" text REFERENCES "locations"("id") ON DELETE set null,
    "location_name" text,
    "is_priority" boolean DEFAULT false NOT NULL,
    "status" text DEFAULT 'online' NOT NULL,
    "last_seen" timestamp DEFAULT now() NOT NULL,
    "uptime" text DEFAULT '0 menit',
    "cpu_usage" integer DEFAULT 0,
    "ram_usage" integer DEFAULT 0,
    "storage_usage" integer DEFAULT 0,
    "temperature" integer DEFAULT 0,
    "latency" integer DEFAULT 1,
    "packet_loss" integer DEFAULT 0,
    "parent_device_id" text,
    "snmp_version" text DEFAULT 'v2c',
    "snmp_community" text DEFAULT 'public',
    "coord_x" integer DEFAULT 400,
    "coord_y" integer DEFAULT 300,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "device_interfaces" (
    "id" text PRIMARY KEY NOT NULL,
    "device_id" text NOT NULL REFERENCES "devices"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "type" text DEFAULT 'ethernet' NOT NULL,
    "status" text DEFAULT 'up' NOT NULL,
    "mac_address" text,
    "speed_mbps" integer DEFAULT 1000,
    "mtu" integer DEFAULT 1500,
    "rx_bytes" double precision DEFAULT 0,
    "tx_bytes" double precision DEFAULT 0,
    "rx_errors" integer DEFAULT 0,
    "tx_errors" integer DEFAULT 0,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "queue_traffics" (
    "id" text PRIMARY KEY NOT NULL,
    "device_id" text NOT NULL REFERENCES "devices"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "parent" text DEFAULT 'global',
    "packet_mark" text DEFAULT 'no-mark',
    "target_subnet" text DEFAULT '0.0.0.0/0',
    "max_limit_mbps" double precision DEFAULT 40,
    "limit_at_mbps" double precision DEFAULT 10,
    "max_limit_download_mbps" double precision DEFAULT 40 NOT NULL,
    "max_limit_upload_mbps" double precision DEFAULT 40 NOT NULL,
    "current_download_mbps" double precision DEFAULT 0 NOT NULL,
    "current_upload_mbps" double precision DEFAULT 0 NOT NULL,
    "packet_drops_per_sec" integer DEFAULT 0 NOT NULL,
    "queue_type" text DEFAULT 'pcq-download-default' NOT NULL,
    "priority" integer DEFAULT 8 NOT NULL,
    "queue_kind" text DEFAULT 'tree' NOT NULL,
    "bytes" double precision DEFAULT 0,
    "packets" double precision DEFAULT 0,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "vpn_tunnels" (
    "id" text PRIMARY KEY NOT NULL,
    "device_id" text NOT NULL REFERENCES "devices"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "type" text NOT NULL,
    "user" text NOT NULL,
    "remote_ip" text NOT NULL,
    "status" text DEFAULT 'connected' NOT NULL,
    "uptime" text DEFAULT '0s',
    "bytes_in" double precision DEFAULT 0,
    "bytes_out" double precision DEFAULT 0,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "alerts" (
    "id" text PRIMARY KEY NOT NULL,
    "device_id" text NOT NULL REFERENCES "devices"("id") ON DELETE cascade,
    "device_name" text NOT NULL,
    "ip_address" text NOT NULL,
    "message" text NOT NULL,
    "severity" text NOT NULL,
    "triggered_at" timestamp DEFAULT now() NOT NULL,
    "resolved_at" timestamp,
    "acknowledged" boolean DEFAULT false NOT NULL,
    "acknowledged_by" text,
    "resolved_by" text,
    "resolution_notes" text
  );`,

  `CREATE TABLE IF NOT EXISTS "alert_rules" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "device_id" text,
    "metric" text NOT NULL,
    "condition" text NOT NULL,
    "threshold" text NOT NULL,
    "duration_seconds" integer DEFAULT 60 NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "escalation_tier" integer DEFAULT 1 NOT NULL,
    "notify_email" boolean DEFAULT true NOT NULL,
    "notify_sound" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "repair_records" (
    "id" text PRIMARY KEY NOT NULL,
    "ticket_code" text NOT NULL,
    "device_id" text NOT NULL REFERENCES "devices"("id") ON DELETE cascade,
    "device_name" text NOT NULL,
    "ip_address" text NOT NULL,
    "user_id" text NOT NULL,
    "user_name" text NOT NULL,
    "problem" text NOT NULL,
    "action" text NOT NULL,
    "result" text NOT NULL,
    "status" text DEFAULT 'berjalan' NOT NULL,
    "photo_urls" text[] DEFAULT '{}'::text[] NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "report_schedules" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "frequency" text NOT NULL,
    "format" text NOT NULL,
    "recipients" text[] NOT NULL,
    "created_by" text NOT NULL,
    "last_sent_at" timestamp,
    "next_run_at" timestamp NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "user_name" text NOT NULL,
    "user_role" text NOT NULL,
    "action" text NOT NULL,
    "details" text NOT NULL,
    "ip_address" text DEFAULT '127.0.0.1' NOT NULL,
    "timestamp" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "raw_snmp_metrics" (
    "id" text PRIMARY KEY NOT NULL,
    "device_id" text NOT NULL REFERENCES "devices"("id") ON DELETE cascade,
    "oid" text NOT NULL,
    "oid_name" text NOT NULL,
    "category" text NOT NULL,
    "type" text DEFAULT 'string' NOT NULL,
    "raw_value" text NOT NULL,
    "parsed_value" text,
    "unit" text,
    "collected_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE INDEX IF NOT EXISTS "idx_raw_snmp_device_cat" ON "raw_snmp_metrics" ("device_id", "category");`,
  `CREATE INDEX IF NOT EXISTS "idx_raw_snmp_oid" ON "raw_snmp_metrics" ("device_id", "oid");`,
  `CREATE INDEX IF NOT EXISTS "idx_device_metrics_lookup" ON "device_metrics" ("device_id", "metric_name", "collected_at" DESC);`,
  `CREATE INDEX IF NOT EXISTS "idx_device_metrics_time" ON "device_metrics" ("collected_at" DESC);`,

  `CREATE TABLE IF NOT EXISTS "auto_discovered_devices" (
    "id" text PRIMARY KEY NOT NULL,
    "ip" text NOT NULL,
    "mac" text NOT NULL,
    "vendor" text NOT NULL,
    "type" text NOT NULL,
    "suggested_name" text NOT NULL,
    "subnet" text NOT NULL,
    "response_time" integer NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "discovered_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "email_verified" boolean DEFAULT false NOT NULL,
    "image" text,
    "role" text DEFAULT 'admin' NOT NULL,
    "status" text DEFAULT 'active' NOT NULL,
    "last_login" text DEFAULT 'Belum pernah login',
    "phone" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade
  );`,

  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" timestamp,
    "refresh_token_expires_at" timestamp,
    "scope" text,
    "password" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  `ALTER TABLE "queue_traffics" ADD COLUMN IF NOT EXISTS "parent" text DEFAULT 'global';`,
  `ALTER TABLE "queue_traffics" ADD COLUMN IF NOT EXISTS "packet_mark" text DEFAULT 'no-mark';`,
  `ALTER TABLE "queue_traffics" ADD COLUMN IF NOT EXISTS "max_limit_mbps" double precision DEFAULT 40;`,
  `ALTER TABLE "queue_traffics" ADD COLUMN IF NOT EXISTS "limit_at_mbps" double precision DEFAULT 10;`,
  `ALTER TABLE "queue_traffics" ADD COLUMN IF NOT EXISTS "queue_kind" text DEFAULT 'tree';`,
  `ALTER TABLE "queue_traffics" ADD COLUMN IF NOT EXISTS "bytes" double precision DEFAULT 0;`,
  `ALTER TABLE "queue_traffics" ADD COLUMN IF NOT EXISTS "packets" double precision DEFAULT 0;`,
  `DELETE FROM "queue_traffics" WHERE "queue_kind" = 'simple' OR "name" LIKE '%Laptop%' OR "name" LIKE '%Total Bandwith%';`
];

async function runMigrations() {
  try {
    console.log('📦 Menjalankan inisialisasi skema tabel NMS NOC...');

    for (const statement of statements) {
      await sql.unsafe(statement);
    }

    console.log('✅ Seluruh tabel database NMS NOC berhasil diverifikasi & siap digunakan!');
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi database:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
