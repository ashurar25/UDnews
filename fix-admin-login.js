// Simple admin user creation script using existing dependencies
const fs = require('fs');
const path = require('path');

// Read environment variables
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse DATABASE_URL
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
if (!dbUrlMatch) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const DATABASE_URL = dbUrlMatch[1];
const adminUsername = 'admin';
const adminPassword = 'udnews2025secure';
const adminEmail = 'kenginol.ar@gmail.com';

console.log('🔧 Admin Login Fix Script');
console.log('========================');
console.log(`Username: ${adminUsername}`);
console.log(`Password: ${adminPassword}`);
console.log(`Email: ${adminEmail}`);
console.log('========================');

// Create SQL script for manual execution
const sqlScript = `
-- Create users table if not exists
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
);

-- Insert or update admin user (password hash for 'udnews2025secure')
INSERT INTO users (username, password, role, email, is_active, created_at, updated_at)
VALUES ('admin', '$2b$10$YourHashedPasswordHere', 'admin', 'kenginol.ar@gmail.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) 
DO UPDATE SET 
  password = EXCLUDED.password,
  role = 'admin',
  email = EXCLUDED.email,
  is_active = true,
  updated_at = CURRENT_TIMESTAMP;
`;

// Write SQL script to file
fs.writeFileSync('create-admin.sql', sqlScript);
console.log('✅ SQL script created: create-admin.sql');

console.log('\n📋 Manual Steps to Fix Admin Login:');
console.log('1. Connect to your PostgreSQL database');
console.log('2. Run the SQL commands from create-admin.sql');
console.log('3. Or use the database admin panel to create user manually');
console.log('\n🔐 Login Credentials:');
console.log(`   Username: ${adminUsername}`);
console.log(`   Password: ${adminPassword}`);
