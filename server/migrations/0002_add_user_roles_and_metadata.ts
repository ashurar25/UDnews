import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type DbType = NodePgDatabase<any>;

export async function up(db: DbType) {
  // Add new columns to users table
  await db.execute(sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'editor',
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  `);

  // Add index for better query performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
  `);
  
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)
  `);
}

export async function down(db: DbType) {
  // Remove indexes first
  await db.execute(sql`
    DROP INDEX IF EXISTS idx_users_is_active
  `);
  
  await db.execute(sql`
    DROP INDEX IF EXISTS idx_users_role
  `);

  // Then remove the columns
  await db.execute(sql`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS role,
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS is_active,
    DROP COLUMN IF EXISTS last_login,
    DROP COLUMN IF EXISTS created_at,
    DROP COLUMN IF EXISTS updated_at
  `);
}
