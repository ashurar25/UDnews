// Simple script to create database tables for new systems
import pg from 'pg';
const { Pool } = pg;

// Use primary database from server/db.ts
const DATABASE_URL = "postgresql://udnews_user:qRNlOyrnlVbrRH16AQJ5itOkjluEebXk@dpg-d2a2dp2dbo4c73at42ug-a.singapore-postgres.render.com/udnewsdb_8d2c";

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTables() {
  try {
    console.log('🔄 Creating database tables for new systems...');

    // Create comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        news_id VARCHAR(255) NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Comments table created');

    // Create news_ratings table  
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news_ratings (
        id SERIAL PRIMARY KEY,
        news_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        rating_type VARCHAR(10) NOT NULL CHECK (rating_type IN ('like', 'dislike')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(news_id, user_id, rating_type)
      )
    `);
    console.log('✅ News ratings table created');

    // Create newsletter_subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✅ Newsletter subscriptions table created');

    // Create social_shares table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_shares (
        id SERIAL PRIMARY KEY,
        news_id VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Social shares table created');

    // Create push_subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Push subscriptions table created');

    // Create donations table (align with shared/schema.ts)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        amount INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'THB',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        donor_name VARCHAR(200),
        is_anonymous BOOLEAN NOT NULL DEFAULT false,
        message TEXT,
        reference VARCHAR(64) NOT NULL UNIQUE,
        slip_url TEXT,
        slip_uploaded_at TIMESTAMP,
        rejected_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP
      )
    `);
    console.log('✅ Donations table created');

    console.log('🎉 All database tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createTables();