import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    const sqlContent = fs.readFileSync('create_tables.sql', 'utf8');
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await pool.query(statement);
    }
    
    console.log('✅ All database tables created successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();