const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkAndCreateAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist. Running migration...');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP
        );
      `);
      console.log('✅ Users table created');
    }

    // Check existing users
    const users = await client.query('SELECT username, role, is_active FROM users');
    console.log('📋 Existing users:', users.rows);

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'udnews2025secure';
    const adminEmail = process.env.ADMIN_EMAIL || 'kenginol.ar@gmail.com';

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin exists
    const adminCheck = await client.query('SELECT * FROM users WHERE username = $1', [adminUsername]);

    if (adminCheck.rows.length > 0) {
      // Update existing admin
      await client.query(`
        UPDATE users SET 
        password = $1, 
        email = $2, 
        role = 'admin', 
        is_active = true, 
        updated_at = CURRENT_TIMESTAMP 
        WHERE username = $3
      `, [hashedPassword, adminEmail, adminUsername]);
      console.log('✅ Admin user updated');
    } else {
      // Create new admin
      await client.query(`
        INSERT INTO users (username, password, email, role, is_active, created_at, updated_at) 
        VALUES ($1, $2, $3, 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [adminUsername, hashedPassword, adminEmail]);
      console.log('✅ Admin user created');
    }

    // Verify admin user
    const verifyAdmin = await client.query('SELECT username, role, is_active FROM users WHERE username = $1', [adminUsername]);
    console.log('🔍 Admin user verification:', verifyAdmin.rows[0]);

    // Test password
    const testPassword = await bcrypt.compare(adminPassword, hashedPassword);
    console.log('🔐 Password test:', testPassword ? 'PASS' : 'FAIL');

    console.log('\n📝 Login credentials:');
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Email: ${adminEmail}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkAndCreateAdmin();
