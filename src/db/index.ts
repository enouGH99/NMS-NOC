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
