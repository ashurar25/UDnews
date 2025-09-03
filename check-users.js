const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://udnews_user:qRNlOyrnlVbrRH16AQJ5itOkjluEebXk@dpg-d2a2dp2dbo4c73at42ug-a.singapore-postgres.render.com/udnewsdb_8d2c',
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Check if users table exists
    const tableCheck = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )`
    );
    
    if (!tableCheck.rows[0].exists) {
      console.error('Error: users table does not exist');
      return;
    }
    
    // Get table structure
    const columns = await client.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'users'`
    );
    
    console.log('\nUsers table structure:');
    console.table(columns.rows);
    
    // Try to get user count
    try {
      const count = await client.query('SELECT COUNT(*) FROM users');
      console.log('\nTotal users:', count.rows[0].count);
      
      // Show first few users if any exist
      if (parseInt(count.rows[0].count) > 0) {
        const users = await client.query('SELECT id, username, email, role, is_active FROM users LIMIT 5');
        console.log('\nSample users:');
        console.table(users.rows);
      }
    } catch (err) {
      console.error('Error querying users:', err.message);
    }
    
  } catch (err) {
    console.error('Database connection error:', err.message);
  } finally {
    await pool.end();
    console.log('\nConnection closed');
  }
}

checkUsers();
