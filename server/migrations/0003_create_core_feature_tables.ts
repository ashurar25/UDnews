import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Create missing tables and columns to align production DB with shared/schema.ts
// Safe to run multiple times due to IF NOT EXISTS and ADD COLUMN IF NOT EXISTS

type DbType = NodePgDatabase<any>;

export async function up(db: DbType) {
  // news_articles (safety - ensure exists)
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

  // news_views
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

  // daily_stats
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      total_views INTEGER NOT NULL DEFAULT 0,
      unique_visitors INTEGER NOT NULL DEFAULT 0,
      popular_news_id INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // comments
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      news_id INTEGER NOT NULL,
      parent_id INTEGER,
      author_name VARCHAR(100) NOT NULL,
      author_email VARCHAR(255),
      content TEXT NOT NULL,
      is_approved BOOLEAN NOT NULL DEFAULT FALSE,
      is_reported BOOLEAN NOT NULL DEFAULT FALSE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Ensure legacy comments table has required columns if it already exists
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS news_id INTEGER`);
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE`);
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`);
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`);

  // newsletter_subscribers
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(100),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      subscription_date TIMESTAMP NOT NULL DEFAULT NOW(),
      preferences TEXT NOT NULL DEFAULT '{"daily": true, "weekly": true}'
    )
  `);

  // push_subscriptions
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_id INTEGER,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  // If table exists but is_active missing
  await db.execute(sql`ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`);

  // news_ratings
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS news_ratings (
      id SERIAL PRIMARY KEY,
      news_id INTEGER NOT NULL,
      rating VARCHAR(10) NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // donations
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS donations (
      id SERIAL PRIMARY KEY,
      amount INTEGER NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'THB',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      donor_name VARCHAR(200),
      is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
      message TEXT,
      reference VARCHAR(64) NOT NULL UNIQUE,
      slip_url TEXT,
      slip_uploaded_at TIMESTAMP,
      rejected_reason TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMP
    )
  `);

  // audit_logs
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      method VARCHAR(10) NOT NULL,
      path TEXT NOT NULL,
      user_id INTEGER,
      ip_address VARCHAR(45),
      user_agent TEXT,
      body_summary TEXT,
      status_code INTEGER,
      latency_ms INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Helpful indexes
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_news_views_news_id ON news_views(news_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_comments_news_id ON comments(news_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date)`);
}

export async function down(db: DbType) {
  // Non-destructive down: keep data, but you can drop tables if necessary.
  // Intentionally left empty to avoid accidental data loss.
}
