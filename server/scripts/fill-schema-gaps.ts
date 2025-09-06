import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env from CWD: .env then .env.local
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
    console.error('DATABASE_URL is not set. CWD =', process.cwd());
  }
  const client = await pool.connect();
  try {
    console.log('Filling schema gaps (news_articles, rss_processing_history, news_views)...');

    // Ensure news_articles exists and columns present
    await client.query(`
      CREATE TABLE IF NOT EXISTS news_articles (
        id SERIAL PRIMARY KEY,
        title TEXT,
        summary TEXT,
        content TEXT,
        category TEXT,
        image_url TEXT,
        source_url TEXT,
        rss_feed_id INTEGER,
        is_breaking BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS title TEXT`);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS summary TEXT`);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content TEXT`);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS category TEXT`);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS source_url TEXT`);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS rss_feed_id INTEGER`);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
    await client.query(`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);

    await client.query(`UPDATE news_articles SET title = COALESCE(title, 'Untitled')`);
    await client.query(`UPDATE news_articles SET summary = COALESCE(summary, '')`);
    await client.query(`UPDATE news_articles SET content = COALESCE(content, '')`);
    await client.query(`UPDATE news_articles SET category = COALESCE(category, 'general')`);

    // Ensure rss_processing_history exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS rss_processing_history (
        id SERIAL PRIMARY KEY,
        rss_feed_id INTEGER NOT NULL,
        processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        articles_processed INTEGER NOT NULL DEFAULT 0,
        articles_added INTEGER NOT NULL DEFAULT 0,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        error_message TEXT
      )
    `);

    // Ensure news_views exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS news_views (
        id SERIAL PRIMARY KEY,
        news_id INTEGER NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        referrer TEXT,
        viewed_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_news_views_news_id ON news_views(news_id)`);

    console.log('Schema gaps filled successfully.');
  } catch (e: any) {
    console.error('Schema fill failed:', e?.message || e);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
