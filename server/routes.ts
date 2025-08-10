import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRssFeedSchema, insertNewsSchema, insertSponsorBannerSchema } from "@shared/schema";
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

  // News routes
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
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

  // RSS Processing routes
  app.post("/api/rss/process", async (req, res) => {
    try {
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

  // Database stats route
  app.get("/api/database/stats", async (req, res) => {
    try {
      const stats = await storage.getDatabaseStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch database stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
