import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type DbType = NodePgDatabase<any>;

// This migration fills any remaining schema gaps observed on Neon:
// - Ensure news_articles has required columns (title, summary, content, category, etc.)
// - Create rss_processing_history table if missing
// - Ensure rss_feeds, news_views exist (no-ops if already created)
// - Create helpful indexes idempotently
export async function up(db: DbType) {
  // 1) Ensure news_articles exists and has required columns
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS news_articles (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      source_url TEXT,
      rss_feed_id INTEGER,
      is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS title TEXT`);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS summary TEXT`);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content TEXT`);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS category TEXT`);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS image_url TEXT`);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS source_url TEXT`);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS rss_feed_id INTEGER`);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN NOT NULL DEFAULT FALSE`);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`);
  await db.execute(sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`);

  // Backfill minimal defaults for newly added nullable columns where needed
  await db.execute(sql`UPDATE news_articles SET title = COALESCE(title, 'Untitled')`);
  await db.execute(sql`UPDATE news_articles SET summary = COALESCE(summary, '')`);
  await db.execute(sql`UPDATE news_articles SET content = COALESCE(content, '')`);
  await db.execute(sql`UPDATE news_articles SET category = COALESCE(category, 'general')`);

  // 2) Ensure rss_processing_history table exists
  await db.execute(sql`
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

  // 3) Ensure rss_feeds exists (no-op if already)
  await db.execute(sql`
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

  // 4) Ensure news_views exists (no-op if already)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS news_views (
      id SERIAL PRIMARY KEY,
      news_id INTEGER NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      referrer TEXT,
      viewed_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // 5) Helpful indexes (idempotent)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_news_views_news_id ON news_views(news_id)`);
}

export async function down(db: DbType) {
  // Non-destructive
}
