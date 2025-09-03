const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute the users table SQL
    const usersSql = fs.readFileSync('create-users-table.sql', 'utf8');
    await client.query(usersSql);
    
    console.log('✅ All tables created successfully');
    
    // List existing tables to verify
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Database tables:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await client.end();
  }
}

setupDatabase();
