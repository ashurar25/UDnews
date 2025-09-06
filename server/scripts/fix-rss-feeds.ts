import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Merge .env (project root) then .env.local using current working directory
try {
  const cwd = process.cwd();
  const envPath = path.resolve(cwd, '.env');
  const envLocalPath = path.resolve(cwd, '.env.local');
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
  if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
} catch {}

const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Ensure .env contains it. CWD =', process.cwd());
  }
  const client = await pool.connect();
  try {
    console.log('Connecting and fixing rss_feeds...');

    // Ensure table exists (idempotent)
    await client.query(`
      CREATE TABLE IF NOT EXISTS rss_feeds (
        id SERIAL PRIMARY KEY,
        title TEXT,
        url TEXT,
        description TEXT,
        category TEXT,
        is_active BOOLEAN,
        last_processed TIMESTAMP,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Ensure required columns exist (for pre-existing tables with different schema)
    await client.query(`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS title TEXT`);
    await client.query(`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS url TEXT`);
    await client.query(`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS description TEXT`);
    await client.query(`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS category TEXT`);
    await client.query(`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS is_active BOOLEAN`);
    await client.query(`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS last_processed TIMESTAMP`);
    await client.query(`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS created_at TIMESTAMP`);
    await client.query(`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`);

    // Backfill NULLs with safe defaults
    await client.query(`UPDATE rss_feeds SET title = COALESCE(title, 'Untitled')`);
    await client.query(`UPDATE rss_feeds SET category = COALESCE(category, 'general')`);
    await client.query(`UPDATE rss_feeds SET is_active = COALESCE(is_active, TRUE)`);
    await client.query(`UPDATE rss_feeds SET created_at = COALESCE(created_at, NOW())`);
    await client.query(`UPDATE rss_feeds SET updated_at = COALESCE(updated_at, NOW())`);
    await client.query(`
      UPDATE rss_feeds 
      SET url = CONCAT('https://placeholder.local/feed/', id::text)
      WHERE url IS NULL
    `);

    // Deduplicate URLs by appending id
    await client.query(`
      WITH dupes AS (
        SELECT url FROM rss_feeds WHERE url IS NOT NULL GROUP BY url HAVING COUNT(*) > 1
      )
      UPDATE rss_feeds r
      SET url = r.url || '-' || r.id::text
      FROM dupes d
      WHERE r.url = d.url
    `);

    // Enforce constraints afterwards
    await client.query(`ALTER TABLE rss_feeds ALTER COLUMN title SET NOT NULL`);
    await client.query(`ALTER TABLE rss_feeds ALTER COLUMN url SET NOT NULL`);
    await client.query(`ALTER TABLE rss_feeds ALTER COLUMN category SET NOT NULL`);
    await client.query(`ALTER TABLE rss_feeds ALTER COLUMN is_active SET DEFAULT TRUE`);
    await client.query(`ALTER TABLE rss_feeds ALTER COLUMN created_at SET DEFAULT NOW()`);
    await client.query(`ALTER TABLE rss_feeds ALTER COLUMN updated_at SET DEFAULT NOW()`);

    // Create unique index if not exists
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS rss_feeds_url_key ON rss_feeds(url)`);

    console.log('rss_feeds fixed successfully');
  } catch (e: any) {
    console.error('Fix failed:', e.message || e);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
