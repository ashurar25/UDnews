
-- Clear all sample sponsor banners
DELETE FROM sponsor_banners WHERE title LIKE 'Sample%';

-- Clear sample news if any
DELETE FROM news WHERE title LIKE '%ตัวอย่าง%' OR content LIKE '%ตัวอย่าง%';

-- Show remaining data
SELECT COUNT(*) as news_count FROM news;
SELECT COUNT(*) as banner_count FROM sponsor_banners;
SELECT COUNT(*) as rss_count FROM rss_feeds;
