import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Usage: npx tsx server/scripts/mark-migration.ts <migration-file-name>

try {
  const cwd = process.cwd();
  const envPath = path.resolve(cwd, '.env');
  const envLocalPath = path.resolve(cwd, '.env.local');
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
  if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
} catch {}

const { Pool } = pg;

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error('Provide a migration file name, e.g. 0005_fix_schema_alignments.ts');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS __migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const exists = await client.query(
      'SELECT 1 FROM __migrations WHERE name = $1 LIMIT 1',
      [name]
    );

    if (exists.rowCount && exists.rowCount > 0) {
      console.log(`Migration already marked as applied: ${name}`);
    } else {
      await client.query('INSERT INTO __migrations (name) VALUES ($1)', [name]);
      console.log(`Marked migration as applied: ${name}`);
    }
  } catch (e: any) {
    console.error('Failed to mark migration:', e?.message || e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
