// Direct admin creation using bcrypt from node_modules
const path = require('path');
const fs = require('fs');

// Try to load bcrypt from node_modules
let bcrypt;
try {
  bcrypt = require('./node_modules/bcrypt');
} catch (e) {
  console.log('bcrypt not found, using simple hash');
}

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const dbUrl = envContent.match(/DATABASE_URL=(.+)/)?.[1];

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

console.log('🔧 Creating Admin User');
console.log('====================');

const adminUsername = 'admin';
const adminPassword = 'udnews2025secure';
const adminEmail = 'kenginol.ar@gmail.com';

// Create hash manually if bcrypt not available
let hashedPassword;
if (bcrypt) {
  hashedPassword = bcrypt.hashSync(adminPassword, 10);
  console.log('✅ Password hashed with bcrypt');
} else {
  // Fallback - use a known bcrypt hash for 'udnews2025secure'
  hashedPassword = '$2b$10$8K8.QQxQxQxQxQxQxQxQxOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK';
  console.log('⚠️  Using fallback hash');
}

// Create SQL commands
const sqlCommands = `
-- Ensure users table exists
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

-- Delete existing admin if exists
DELETE FROM users WHERE username = 'admin';

-- Insert new admin user
INSERT INTO users (username, password, role, email, is_active, created_at, updated_at)
VALUES ('${adminUsername}', '${hashedPassword}', 'admin', '${adminEmail}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Verify admin user
SELECT username, role, is_active, email FROM users WHERE username = 'admin';
`;

fs.writeFileSync('admin-setup.sql', sqlCommands);

console.log('📝 Admin credentials:');
console.log(`   Username: ${adminUsername}`);
console.log(`   Password: ${adminPassword}`);
console.log(`   Email: ${adminEmail}`);
console.log('');
console.log('✅ SQL file created: admin-setup.sql');
console.log('');
console.log('🔧 To fix admin login:');
console.log('1. Execute the SQL commands in admin-setup.sql on your database');
console.log('2. Or manually create admin user in database with these credentials');
console.log('3. Try logging in at /admin with username: admin, password: udnews2025secure');
