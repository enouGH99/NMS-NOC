import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nms_db';

// Global singleton client to avoid multiple connection pools during Next.js Hot Reloading
const globalForDb = globalThis as unknown as {
  postgresClient: postgres.Sql | undefined;
};

export const client =
  globalForDb.postgresClient ||
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
export { schema };

// Self-healing: Automatically ensure raw_snmp_metrics table and indexes exist on connection
(async () => {
  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS "raw_snmp_metrics" (
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
      );
      CREATE TABLE IF NOT EXISTS "device_metrics" (
        "id" text PRIMARY KEY NOT NULL,
        "device_id" text NOT NULL REFERENCES "devices"("id") ON DELETE cascade,
        "metric_name" text NOT NULL,
        "metric_label" text,
        "value" double precision NOT NULL,
        "unit" text NOT NULL,
        "collected_at" timestamp DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "idx_raw_snmp_device_cat" ON "raw_snmp_metrics" ("device_id", "category");
      CREATE INDEX IF NOT EXISTS "idx_raw_snmp_oid" ON "raw_snmp_metrics" ("device_id", "oid");
      CREATE INDEX IF NOT EXISTS "idx_device_metrics_lookup" ON "device_metrics" ("device_id", "metric_name", "collected_at" DESC);
      CREATE INDEX IF NOT EXISTS "idx_device_metrics_time" ON "device_metrics" ("collected_at" DESC);
    `);
  } catch (err) {
    // Suppress in build/offline environments
  }
})();
