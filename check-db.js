const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkAndFixDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if users table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ Users table does not exist. Creating...');
      
      // Create users table
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'editor',
          email TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Users table created');
    } else {
      console.log('✅ Users table exists');
    }

    // Get table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Users table structure:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Create admin user
    const adminUsername = 'admin';
    const adminPassword = 'udnews2025secure';
    const adminEmail = 'kenginol.ar@gmail.com';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin exists
    const adminExists = await client.query('SELECT * FROM users WHERE username = $1', [adminUsername]);
    
    if (adminExists.rows.length === 0) {
      // Create admin user
      await client.query(`
        INSERT INTO users (username, password, role, email, is_active, created_at, updated_at)
        VALUES ($1, $2, 'admin', $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [adminUsername, hashedPassword, adminEmail]);
      console.log('✅ Admin user created');
    } else {
      // Update admin user
      await client.query(`
        UPDATE users SET 
        password = $1, 
        role = 'admin', 
        email = $2, 
        is_active = true, 
        updated_at = CURRENT_TIMESTAMP 
        WHERE username = $3
      `, [hashedPassword, adminEmail, adminUsername]);
      console.log('✅ Admin user updated');
    }

    // Verify admin user
    const admin = await client.query('SELECT username, role, is_active, email FROM users WHERE username = $1', [adminUsername]);
    console.log('🔍 Admin user:', admin.rows[0]);

    console.log('\n🔐 Login credentials:');
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkAndFixDatabase().catch(console.error);
