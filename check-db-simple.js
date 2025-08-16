const { Pool } = require('pg');
require('dotenv').config();

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
    } catch (err) {
      console.log('\nError fetching users:', err.message);
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDb().catch(console.error);
