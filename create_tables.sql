-- Create missing tables for new systems

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  news_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News ratings table  
CREATE TABLE IF NOT EXISTS news_ratings (
  id SERIAL PRIMARY KEY,
  news_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  rating_type VARCHAR(10) NOT NULL CHECK (rating_type IN ('like', 'dislike')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(news_id, user_id, rating_type)
);

-- Newsletter subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Social shares table
CREATE TABLE IF NOT EXISTS social_shares (
  id SERIAL PRIMARY KEY,
  news_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);