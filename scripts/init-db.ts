import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  console.log('🔍 Checking PostgreSQL server and creating nms_db if not exists...');

  // Connect to the default 'postgres' database
  const defaultSql = postgres('postgres://postgres:Dimas*007@localhost:5432/postgres', {
    max: 1,
    connect_timeout: 5,
  });

  try {
    const dbs = await defaultSql`SELECT datname FROM pg_database WHERE datname = 'nms_db'`;
    if (dbs.length === 0) {
      console.log('🔨 Database nms_db does not exist. Creating nms_db...');
      await defaultSql`CREATE DATABASE nms_db`;
      console.log('✅ Database nms_db successfully created!');
    } else {
      console.log('✅ Database nms_db already exists!');
    }
  } catch (err: any) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
  } finally {
    await defaultSql.end();
  }
}

main();
