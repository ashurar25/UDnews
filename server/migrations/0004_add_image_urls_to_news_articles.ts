import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Add image_urls TEXT[] column for storing multiple images per article
// Safe to run multiple times due to IF NOT EXISTS

type DbType = NodePgDatabase<any>;

export async function up(db: DbType) {
  await db.execute(sql`
    ALTER TABLE news_articles
    ADD COLUMN IF NOT EXISTS image_urls TEXT[]
  `);
}

export async function down(db: DbType) {
  // Non-destructive down to avoid data loss; comment out if explicit drop is desired
  // await db.execute(sql`ALTER TABLE news_articles DROP COLUMN IF EXISTS image_urls`);
}
