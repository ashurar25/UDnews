const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://udnews_user:qRNlOyrnlVbrRH16AQJ5itOkjluEebXk@dpg-d2a2dp2dbo4c73at42ug-a.singapore-postgres.render.com/udnewsdb_8d2c',
  ssl: { rejectUnauthorized: false }
});

async function createAdminUser() {
  const username = 'admin';
  const email = 'admin@udon-news.com';
  const password = 'udnews2025secure';
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Check if admin user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists. Updating password...');
      await client.query(
        `UPDATE users 
         SET password = $1, 
             email = $2,
             role = 'admin',
             is_active = true,
             updated_at = NOW()
         WHERE username = $3`,
        [hashedPassword, email, username]
      );
      console.log('Admin user updated successfully!');
    } else {
      // Create new admin user
      await client.query(
        `INSERT INTO users (username, password, email, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'admin', true, NOW(), NOW())`,
        [username, hashedPassword, email]
      );
      console.log('Admin user created successfully!');
    }
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    if (error.code === '42P01') {
      console.error('Error: The users table does not exist. Please run the database migrations first.');
    }
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

createAdminUser();
