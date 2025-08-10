import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRssFeedSchema, insertNewsSchema, insertSponsorBannerSchema, insertSiteSettingSchema, insertContactMessageSchema } from "@shared/schema";
import { rssService } from "./rss-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // RSS Feeds routes
  app.get("/api/rss-feeds", async (req, res) => {
    try {
      const feeds = await storage.getAllRssFeeds();
      res.json(feeds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RSS feeds" });
    }
  });

  app.get("/api/rss-feeds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feed = await storage.getRssFeedById(id);
      if (!feed) {
        return res.status(404).json({ error: "RSS feed not found" });
      }
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RSS feed" });
    }
  });

  app.post("/api/rss-feeds", async (req, res) => {
    try {
      const validatedData = insertRssFeedSchema.parse(req.body);
      const feed = await storage.insertRssFeed(validatedData);
      res.status(201).json(feed);
    } catch (error) {
      res.status(400).json({ error: "Invalid RSS feed data" });
    }
  });

  app.put("/api/rss-feeds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRssFeedSchema.partial().parse(req.body);
      const feed = await storage.updateRssFeed(id, validatedData);
      if (!feed) {
        return res.status(404).json({ error: "RSS feed not found" });
      }
      res.json(feed);
    } catch (error) {
      res.status(400).json({ error: "Invalid RSS feed data" });
    }
  });

  app.delete("/api/rss-feeds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRssFeed(id);
      if (!success) {
        return res.status(404).json({ error: "RSS feed not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete RSS feed" });
    }
  });

  // News routes with caching and pagination
  app.get("/api/news", async (req, res) => {
    try {
      // Add cache headers for faster loading
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'ETag': `"news-${Date.now()}"`
      });

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
      // Add aggressive caching for individual news articles
      res.set({
        'Cache-Control': 'public, max-age=1800', // 30 minutes cache
        'ETag': `"news-${req.params.id}-${Date.now()}"`
      });

      const id = parseInt(req.params.id);
      const article = await storage.getNewsById(id);
      if (!article) {
        return res.status(404).json({ error: "News article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news article" });
    }
  });

  app.post("/api/news", async (req, res) => {
    try {
      const validatedData = insertNewsSchema.parse(req.body);
      const article = await storage.insertNews(validatedData);
      res.status(201).json(article);
    } catch (error) {
      res.status(400).json({ error: "Invalid news article data" });
    }
  });

  app.put("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertNewsSchema.partial().parse(req.body);
      const article = await storage.updateNews(id, validatedData);
      if (!article) {
        return res.status(404).json({ error: "News article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(400).json({ error: "Invalid news article data" });
    }
  });

  app.delete("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNews(id);
      if (!success) {
        return res.status(404).json({ error: "News article not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete news article" });
    }
  });

  // Sponsor Banner routes
  app.get("/api/sponsor-banners", async (req, res) => {
    try {
      const position = req.query.position as string;
      const banners = position 
        ? await storage.getSponsorBannersByPosition(position)
        : await storage.getAllSponsorBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sponsor banners" });
    }
  });

  app.get("/api/sponsor-banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const banner = await storage.getSponsorBannerById(id);
      if (!banner) {
        return res.status(404).json({ error: "Sponsor banner not found" });
      }
      res.json(banner);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sponsor banner" });
    }
  });

  app.post("/api/sponsor-banners", async (req, res) => {
    try {
      const validatedData = insertSponsorBannerSchema.parse(req.body);
      const banner = await storage.insertSponsorBanner(validatedData);
      res.status(201).json(banner);
    } catch (error) {
      res.status(400).json({ error: "Invalid sponsor banner data" });
    }
  });

  app.put("/api/sponsor-banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSponsorBannerSchema.partial().parse(req.body);
      const banner = await storage.updateSponsorBanner(id, validatedData);
      if (!banner) {
        return res.status(404).json({ error: "Sponsor banner not found" });
      }
      res.json(banner);
    } catch (error) {
      res.status(400).json({ error: "Invalid sponsor banner data" });
    }
  });

  app.delete("/api/sponsor-banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSponsorBanner(id);
      if (!success) {
        return res.status(404).json({ error: "Sponsor banner not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sponsor banner" });
    }
  });

  app.post("/api/sponsor-banners/:id/click", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementBannerClick(id);
      if (!success) {
        return res.status(404).json({ error: "Sponsor banner not found" });
      }
      res.status(200).json({ message: "Click recorded" });
    } catch (error) {
      res.status(500).json({ error: "Failed to record click" });
    }
  });

  // RSS Processing routes with no-cache headers
  app.post("/api/rss/process", async (req, res) => {
    try {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      await rssService.processAllFeeds();
      res.json({ message: "RSS processing started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start RSS processing" });
    }
  });

  app.post("/api/rss/process/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feed = await storage.getRssFeedById(id);
      if (!feed) {
        return res.status(404).json({ error: "RSS feed not found" });
      }

      const count = await rssService.processFeed(id, feed.url, feed.category);
      res.json({ message: `Processed ${count} articles from ${feed.title}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to process RSS feed" });
    }
  });

  app.get("/api/rss/status", async (req, res) => {
    try {
      const status = rssService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSS status" });
    }
  });

  // Auto-processing status endpoint (fix JSON error)
  app.get("/api/rss/auto-processing/status", async (req, res) => {
    try {
      const status = rssService.getStatus();
      res.json({
        isRunning: status.autoProcessingEnabled || false,
        isProcessing: status.isProcessing || false,
        lastProcessed: status.lastProcessed || {},
        interval: "30 minutes"
      });
    } catch (error) {
      console.error('Error getting RSS status:', error);
      res.status(500).json({ error: 'Failed to get RSS status' });
    }
  });

  app.post("/api/rss/auto/start", async (req, res) => {
    try {
      rssService.startAutoProcessing();
      res.json({ message: "Automatic RSS processing started (every 30 minutes)" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start automatic RSS processing" });
    }
  });

  app.post("/api/rss/auto/stop", async (req, res) => {
    try {
      rssService.stopAutoProcessing();
      res.json({ message: "Automatic RSS processing stopped" });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop automatic RSS processing" });
    }
  });

  // RSS Processing History routes
  app.get("/api/rss/history", async (req, res) => {
    try {
      const history = await storage.getAllRssHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RSS history" });
    }
  });

  app.get("/api/rss/history/:feedId", async (req, res) => {
    try {
      const feedId = parseInt(req.params.feedId);
      const history = await storage.getRssHistoryByFeedId(feedId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RSS history for feed" });
    }
  });

  // System info endpoint (enhanced for admin panel)
  app.get("/api/system-info", async (req, res) => {
    try {
      // Parse database URL to get connection details
      const dbUrl = process.env.DATABASE_URL;
      let dbInfo = {
        provider: "PostgreSQL",
        host: "Unknown",
        port: "5432", 
        database: "Unknown",
        ssl: "Enabled"
      };

      if (dbUrl) {
        try {
          const url = new URL(dbUrl);
          dbInfo = {
            provider: "PostgreSQL",
            host: url.hostname,
            port: url.port || "5432",
            database: url.pathname.slice(1),
            ssl: "Enabled"
          };
        } catch (err) {
          console.log("Could not parse database URL");
        }
      }

      const systemInfo = {
        database: dbInfo,
        environment: process.env.NODE_ENV || "development",
        server: {
          platform: process.platform,
          nodeVersion: process.version,
          uptime: Math.floor(process.uptime())
        }
      };

      res.json(systemInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to get system info" });
    }
  });

  // Database stats route (single, non-duplicate version)
  app.get("/api/database/stats", async (req, res) => {
    try {
      const stats = await storage.getDatabaseStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch database stats" });
    }
  });

  // Site Settings routes for theme management
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getAllSiteSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  app.get("/api/site-settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSiteSettingByKey(key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.post("/api/site-settings", async (req, res) => {
    try {
      const validatedData = insertSiteSettingSchema.parse(req.body);
      const setting = await storage.insertSiteSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ error: "Invalid setting data" });
    }
  });

  app.put("/api/site-settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const { settingValue } = req.body;
      const setting = await storage.updateSiteSetting(key, settingValue);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(400).json({ error: "Invalid setting data" });
    }
  });

  app.delete("/api/site-settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const success = await storage.deleteSiteSetting(key);
      if (!success) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete setting" });
    }
  });

  // Analytics routes
  app.post("/api/analytics/view/:newsId", async (req, res) => {
    try {
      const newsId = parseInt(req.params.newsId);
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      const userAgent = req.get('User-Agent') || '';
      const referrer = req.get('Referer') || '';
      
      const view = await storage.recordNewsView(newsId, ipAddress, userAgent, referrer);
      res.status(201).json(view);
    } catch (error) {
      res.status(500).json({ error: "Failed to record view" });
    }
  });

  app.get("/api/analytics/news/:newsId/views", async (req, res) => {
    try {
      const newsId = parseInt(req.params.newsId);
      const viewCount = await storage.getNewsViewCount(newsId);
      res.json({ viewCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to get view count" });
    }
  });

  app.get("/api/analytics/popular", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const popularNews = await storage.getPopularNews(limit);
      res.json(popularNews);
    } catch (error) {
      res.status(500).json({ error: "Failed to get popular news" });
    }
  });

  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const summary = await storage.getAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to get analytics summary" });
    }
  });

  // Contact Messages routes
  app.get("/api/contact-messages", async (req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact messages" });
    }
  });

  app.get("/api/contact-messages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.getContactMessageById(id);
      if (!message) {
        return res.status(404).json({ error: "Contact message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact message" });
    }
  });

  app.post("/api/contact-messages", async (req, res) => {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      const message = await storage.insertContactMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid contact message data" });
    }
  });

  app.put("/api/contact-messages/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.markContactMessageAsRead(id);
      if (!message) {
        return res.status(404).json({ error: "Contact message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  app.delete("/api/contact-messages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContactMessage(id);
      if (!success) {
        return res.status(404).json({ error: "Contact message not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact message" });
    }
  });

  app.get("/api/contact-messages/unread/count", async (req, res) => {
    try {
      const count = await storage.getUnreadContactMessagesCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread messages count" });
    }
  });

  // SEO Routes - Sitemap and Robots.txt
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const { SitemapGenerator } = await import("./sitemap-generator");
      const sitemap = await SitemapGenerator.generateSitemap();
      
      res.set({
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      });
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get("/robots.txt", async (req, res) => {
    try {
      const { SitemapGenerator } = await import("./sitemap-generator");
      const robotsTxt = await SitemapGenerator.generateRobotsTxt();
      
      res.set({
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      });
      res.send(robotsTxt);
    } catch (error) {
      console.error('Error generating robots.txt:', error);
      res.status(500).send('Error generating robots.txt');
    }
  });

  // Database Backup Management Routes
  app.post("/api/backup/create", async (req, res) => {
    try {
      console.log('🔄 Backup request received from admin');
      const result = await storage.backupToSecondaryDatabase();
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Backup API error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Backup process failed",
        error: error.toString(),
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/backup/status", async (req, res) => {
    try {
      res.json({
        primaryDatabase: "Render PostgreSQL",
        backupDatabase: "Neon PostgreSQL",
        lastBackup: "Manual trigger only",
        status: "Available",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get backup status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}