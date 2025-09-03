const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupDatabaseAndAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'editor',
        email TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');

    // Create admin user
    const adminUsername = 'admin';
    const adminPassword = 'udnews2025secure';
    const adminEmail = 'kenginol.ar@gmail.com';
    
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Delete existing admin and create new one
    await client.query('DELETE FROM users WHERE username = $1', [adminUsername]);
    
    await client.query(`
      INSERT INTO users (username, password, role, email, is_active, created_at, updated_at)
      VALUES ($1, $2, 'admin', $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [adminUsername, hashedPassword, adminEmail]);
    
    console.log('✅ Admin user created successfully');
    
    // Verify admin user
    const admin = await client.query('SELECT username, role, is_active FROM users WHERE username = $1', [adminUsername]);
    console.log('🔍 Admin verification:', admin.rows[0]);
    
    console.log('\n🔐 Login credentials:');
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n📱 Try logging in at: http://localhost:5000/admin');

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

setupDatabaseAndAdmin().catch(console.error);
