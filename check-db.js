import { Pool } from 'pg';
import 'dotenv/config';

async function checkDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Checking users table...');
    // Check columns in users table
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    
    console.log('Users table columns:');
    console.table(columnsResult.rows);
    
    // Check if there are any users
    const usersResult = await pool.query('SELECT * FROM users LIMIT 5');
    console.log('\nSample users:');
    console.table(usersResult.rows);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkDb().catch(console.error);
