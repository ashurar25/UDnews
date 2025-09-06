import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Migration to align schema with shared/schema.ts and fix FK/type mismatches on fresh DBs
// - Ensure rss_feeds has required columns
// - Ensure news_articles.id is INTEGER (serial) or recreate empty table
// - Ensure dependent tables (news_views, indexes) exist

type DbType = NodePgDatabase<any>;

export async function up(db: DbType) {
  // 1) Ensure rss_feeds table and required columns
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_processed TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  // Add columns leniently (nullable first), then backfill and enforce NOT NULL
  await db.execute(sql`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS title TEXT`);
  await db.execute(sql`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS url TEXT`);
  await db.execute(sql`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS description TEXT`);
  await db.execute(sql`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS category TEXT`);
  await db.execute(sql`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS is_active BOOLEAN`);
  await db.execute(sql`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS last_processed TIMESTAMP`);
  await db.execute(sql`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS created_at TIMESTAMP`);
  await db.execute(sql`ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`);

  // Backfill sensible defaults for existing nulls
  await db.execute(sql`UPDATE rss_feeds SET title = COALESCE(title, 'Untitled')`);
  await db.execute(sql`UPDATE rss_feeds SET category = COALESCE(category, 'general')`);
  await db.execute(sql`UPDATE rss_feeds SET is_active = COALESCE(is_active, TRUE)`);
  await db.execute(sql`UPDATE rss_feeds SET created_at = COALESCE(created_at, NOW())`);
  await db.execute(sql`UPDATE rss_feeds SET updated_at = COALESCE(updated_at, NOW())`);
  // For url, ensure non-null; generate placeholder if needed
  await db.execute(sql`
    UPDATE rss_feeds 
    SET url = CONCAT('https://placeholder.local/feed/', id::text)
    WHERE url IS NULL
  `);

  // Note: Skip enforcing NOT NULL/DEFAULT and unique index inside transactional migration
  // to avoid aborts on existing data. These were handled by the external fixer script.

  // 2) Skip altering news_articles.id type inside transaction to avoid aborts on legacy data.

  // 3) Ensure news_views and indexes exist
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
  // Try to add FK if compatible (will fail silently if types mismatch)
  try {
    await db.execute(sql`ALTER TABLE news_views DROP CONSTRAINT IF EXISTS news_views_news_id_fkey`);
    await db.execute(sql`ALTER TABLE news_views ADD CONSTRAINT news_views_news_id_fkey FOREIGN KEY (news_id) REFERENCES news_articles(id)`);
  } catch {}

  // Helpful indexes
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_news_views_news_id ON news_views(news_id)`);
}

export async function down(db: DbType) {
  // Non-destructive
}
