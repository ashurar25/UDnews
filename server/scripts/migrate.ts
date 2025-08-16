import { db } from '../db';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create migrations table if it doesn't exist
async function ensureMigrationsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS __migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

// Get list of applied migrations
async function getAppliedMigrations() {
  const result = await db.execute<{ name: string }>(
    sql`SELECT name FROM __migrations ORDER BY name`
  );
  return result.rows.map(row => row.name);
}

// Apply a single migration
async function applyMigration(name: string) {
  console.log(`Applying migration: ${name}`);
  
  // Import the migration module
  const migration = await import(path.join('..', 'migrations', name));
  
  // Run the migration in a transaction
  await db.transaction(async (tx) => {
    await migration.up(tx as NodePgDatabase<any>);
    await tx.execute(sql`
      INSERT INTO __migrations (name) VALUES (${name})
    `);
  });
  
  console.log(`Applied migration: ${name}`);
}

// Main function
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get list of applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log('Applied migrations:', appliedMigrations);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts') && file !== 'index.ts')
      .sort();
    
    console.log('Found migration files:', migrationFiles);
    
    // Apply pending migrations
    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        await applyMigration(file);
      }
    }
    
    console.log('All migrations applied successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // No need to close the database connection explicitly
    // as Drizzle uses a connection pool
  }
}

// Run the migrations
runMigrations();
