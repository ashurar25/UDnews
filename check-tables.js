const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://udnews_user:qRNlOyrnlVbrRH16AQJ5itOkjluEebXk@dpg-d2a2dp2dbo4c73at42ug-a.singapore-postgres.render.com/udnewsdb_8d2c',
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  const client = await pool.connect();
  try {
    // List all tables in the database
    const result = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`
    );
    
    console.log('Tables in database:');
    console.table(result.rows);
    
    // Check if users table exists
    const usersTableExists = result.rows.some(row => row.table_name === 'users');
    
    if (usersTableExists) {
      console.log('\nUsers table structure:');
      const columns = await client.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'users'`
      );
      console.table(columns.rows);
    } else {
      console.log('\nUsers table does not exist in the database.');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
