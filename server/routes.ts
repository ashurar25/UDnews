import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertRssFeedSchema, 
  insertNewsSchema, 
  insertSponsorBannerSchema, 
  insertSiteSettingSchema, 
  insertContactMessageSchema,
  insertCommentSchema,
  insertNewsletterSubscriberSchema,
  insertPushSubscriptionSchema,
  insertNewsRatingSchema
} from "@shared/schema";
import { rssService } from "./rss-service";
import { authMiddleware, generateToken } from "./middleware/auth";
import rateLimit from "express-rate-limit";

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 API requests per windowMs
  message: 'Too many API requests from this IP, please try again later.',
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 admin requests per windowMs
  message: 'Too many admin requests from this IP, please try again later.',
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting
  app.use('/api/', apiLimiter);
  app.use('/admin', adminLimiter);

  // Admin Login Route
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple hardcoded admin credentials (แนะนำให้เปลี่ยนใน production)
      const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'udnews2025secure';
      
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateToken({ id: 1, username: ADMIN_USERNAME });
        res.json({ 
          success: true, 
          token,
          message: 'Login successful' 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  });
  // Public RSS Feeds routes (read-only)
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

  // Protected RSS Feeds routes (admin only)
  app.post("/api/rss-feeds", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertRssFeedSchema.parse(req.body);
      const feed = await storage.insertRssFeed(validatedData);
      res.status(201).json(feed);
    } catch (error) {
      res.status(400).json({ error: "Invalid RSS feed data" });
    }
  });

  app.put("/api/rss-feeds/:id", authMiddleware, async (req, res) => {
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

  app.delete("/api/rss-feeds/:id", authMiddleware, async (req, res) => {
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

  // Health Check Endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // ตรวจสอบการเชื่อมต่อฐานข้อมูล
      const dbCheck = await storage.getDatabaseStats();
      
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: dbCheck ? "connected" : "disconnected",
          api: "running",
          cache: "active"
        },
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.toString()
      });
    }
  });

  // Comments API - New System 1
  app.get("/api/comments/:newsId", async (req, res) => {
    try {
      const newsId = parseInt(req.params.newsId);
      const comments = await storage.getCommentsByNewsId(newsId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  const commentLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: { message: "คุณแสดงความคิดเห็นเร็วเกินไป กรุณารอ 5 นาที" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post("/api/comments", commentLimiter, async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validatedData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  // Newsletter API - New System 2
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const validatedData = insertNewsletterSubscriberSchema.parse(req.body);
      const subscriber = await storage.createNewsletterSubscriber(validatedData);
      res.json(subscriber);
    } catch (error) {
      console.error("Error creating newsletter subscription:", error);
      if (error.message && error.message.includes('unique')) {
        res.status(400).json({ message: "อีเมลนี้ได้สมัครรับข่าวสารแล้ว" });
      } else {
        res.status(500).json({ message: "ไม่สามารถสมัครรับข่าวสารได้" });
      }
    }
  });

  // Push Notifications API - New System 3
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const validatedData = insertPushSubscriptionSchema.parse(req.body);
      const subscription = await storage.createPushSubscription(validatedData);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating push subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // News Rating API - New System 4
  app.get("/api/news/:id/ratings", async (req, res) => {
    try {
      const newsId = parseInt(req.params.id);
      const ratings = await storage.getNewsRatings(newsId);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Disaster Alert API - New System 6
  app.get("/api/disaster-alerts/active", async (req, res) => {
    try {
      const { disasterAlertService } = await import("./disaster-alert-service");
      const activeAlerts = disasterAlertService.getActiveAlerts();
      res.json(activeAlerts);
    } catch (error) {
      console.error("Error fetching disaster alerts:", error);
      res.status(500).json({ message: "Failed to fetch disaster alerts" });
    }
  });

  app.get("/api/disaster-alerts/:id", async (req, res) => {
    try {
      const { disasterAlertService } = await import("./disaster-alert-service");
      const alertId = req.params.id;
      const alerts = disasterAlertService.getActiveAlerts();
      const alert = alerts.find(a => a.id === alertId);
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Error fetching disaster alert:", error);
      res.status(500).json({ message: "Failed to fetch disaster alert" });
    }
  });

  app.post("/api/disaster-alerts/:id/dismiss", async (req, res) => {
    try {
      const { disasterAlertService } = await import("./disaster-alert-service");
      const alertId = req.params.id;
      disasterAlertService.deactivateAlert(alertId);
      res.json({ message: "Alert dismissed" });
    } catch (error) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ message: "Failed to dismiss alert" });
    }
  });

  // Manual disaster alert creation (admin only)
  app.post("/api/disaster-alerts/manual", authMiddleware, async (req, res) => {
    try {
      const { disasterAlertService } = await import("./disaster-alert-service");
      const alertData = req.body;
      
      const alert = {
        id: `manual-${Date.now()}`,
        ...alertData,
        startTime: new Date().toISOString(),
        source: 'Admin Manual',
        isActive: true
      };

      await disasterAlertService.processNewAlert(alert);
      res.json({ message: "Manual disaster alert created", alert });
    } catch (error) {
      console.error("Error creating manual alert:", error);
      res.status(500).json({ message: "Failed to create manual alert" });
    }
  });

  const ratingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: "คุณให้คะแนนเร็วเกินไป กรุณารอสักครู่" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post("/api/news/:id/rate", ratingLimiter, async (req, res) => {
    try {
      const newsId = parseInt(req.params.id);
      const { rating } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      
      const existingRating = await storage.getUserRating(newsId, ipAddress);
      if (existingRating) {
        return res.status(400).json({ message: "คุณได้ให้คะแนนข่าวนี้แล้ว" });
      }

      const validatedData = insertNewsRatingSchema.parse({
        newsId,
        rating,
        ipAddress
      });
      
      const newRating = await storage.createNewsRating(validatedData);
      res.json(newRating);
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  // Advanced Search API - New System 5
  app.get("/api/news/search", async (req, res) => {
    try {
      const { q, category, dateFrom, dateTo, sortBy, limit = 20, offset = 0 } = req.query;
      
      const searchParams = {
        query: q as string,
        category: category as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        sortBy: (sortBy as string) || 'date',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const results = await storage.searchNews(searchParams);
      res.json(results);
    } catch (error) {
      console.error("Error searching news:", error);
      res.status(500).json({ message: "Failed to search news" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}