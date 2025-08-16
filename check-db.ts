import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Prefer .env.local over .env
try {
  const rootDir = path.resolve(import.meta.dirname);
  const localEnv = path.join(rootDir, '.env.local');
  const defaultEnv = path.join(rootDir, '.env');
  if (fs.existsSync(localEnv)) dotenv.config({ path: localEnv });
  else if (fs.existsSync(defaultEnv)) dotenv.config({ path: defaultEnv });
} catch {}

async function checkDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to database!');
    
    // Check if users table exists
    const tableExists = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );
    
    if (!tableExists.rows[0].exists) {
      console.log('Users table does not exist!');
      return;
    }
    
    // Get users table columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    
    console.log('\nUsers table columns:');
    console.table(columns.rows);
    
    // Get sample users
    try {
      const users = await client.query('SELECT * FROM users LIMIT 5');
      console.log('\nSample users:');
      console.table(users.rows);
    } catch (err: any) {
      console.log('\nError fetching users:', err.message);
    }
    
  } catch (error: any) {
    console.error('Database error:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Connection String:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    if (error.code === '42P01') {
      console.error('\nError: The database table does not exist.');
    } else if (error.code === '28P01') {
      console.error('\nError: Invalid username/password.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('\nError: Could not connect to the database server.');
      console.error('Please check if the database server is running and accessible.');
    }
  } finally {
    await pool.end();
  }
}

checkDb().catch(console.error);
