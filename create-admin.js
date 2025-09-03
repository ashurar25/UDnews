const bcrypt = require('bcrypt');
const { Client } = require('pg');
require('dotenv').config();

async function createAdminUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'udnews2025secure';
    const adminEmail = process.env.ADMIN_EMAIL || 'kenginol.ar@gmail.com';

    console.log(`Creating admin user: ${adminUsername}`);

    // Check if admin user already exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE username = $1',
      [adminUsername]
    );

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    if (existingUser.rows.length > 0) {
      // Update existing admin
      await client.query(
        `UPDATE users SET 
         password = $1, 
         email = $2, 
         role = $3, 
         is_active = $4, 
         updated_at = $5 
         WHERE username = $6`,
        [hashedPassword, adminEmail, 'admin', true, new Date(), adminUsername]
      );
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin user
      await client.query(
        `INSERT INTO users (username, password, email, role, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [adminUsername, hashedPassword, adminEmail, 'admin', true, new Date(), new Date()]
      );
      console.log('✅ Admin user created successfully');
    }

    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Email: ${adminEmail}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createAdminUser();
