import type { Express, Request, Response } from "express";
import { Readable } from 'stream';
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import NodeCache from 'node-cache';
import { 
  insertRssFeedSchema, 
  insertNewsSchema, 
  insertSponsorBannerSchema, 
  insertSiteSettingSchema, 
  insertContactMessageSchema,
  insertCommentSchema,
  insertNewsletterSubscriberSchema,
  insertPushSubscriptionSchema,
  insertNewsRatingSchema,
  newsArticles,
  rssFeeds,
  sponsorBanners,
  contactMessages,
  siteSettings,
  newsViews,
  dailyStats,
  comments,
  newsRatings,
  rssProcessingHistory,
  donations
} from "@shared/schema";
import { eq, desc, and, gte, lte, sql, asc } from "drizzle-orm";
import { rssService } from "./rss-service";
import { authenticateToken as authMiddleware, generateToken } from "./middleware/auth";
import rateLimit from "express-rate-limit";
import path from 'path';
import fs from 'fs';
import databaseRoutes from './database-api';
import userRoutes from './user-api';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import type { InsertDonation } from "@shared/schema";
import { SitemapGenerator } from './sitemap-generator';

// Simple HTML escape for meta tag content
function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Cache configuration for faster news loading
const newsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes
const individualNewsCache = new NodeCache({ stdTTL: 1800, checkperiod: 120 }); // 30 minutes

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
  // Mount database management API routes
  app.use('/api/database', databaseRoutes);


  // Public: donation rankings
  app.get('/api/donations/rank', async (req, res) => {
    try {
      const raw = (req.query.range as string) || 'all';
      const allowed = ['today','week','all'] as const;
      const range = (allowed.includes(raw as any) ? raw : 'all') as 'today'|'week'|'all';
      const ranks = await storage.getDonationRanking(range);
      res.json(Array.isArray(ranks) ? ranks : []);
    } catch (error) {
      console.error('Error fetching donation ranking:', error);
      res.status(500).json([]);
    }
  });

  // Same-origin image endpoint for sharing crawlers
  app.get('/share-image/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).send('Invalid id');
      const news = await storage.getNewsById(id);
      if (!news || !news.imageUrl) return res.status(404).send('Not found');

      const imgUrl = news.imageUrl;
      // If already a local path, redirect to it (static server should serve it)
      if (imgUrl.startsWith('/')) {
        return res.redirect(imgUrl);
      }

      // Otherwise proxy the external image
      const response = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UDNewsBot/1.0)' } });
      if (!response.ok || !response.body) {
        return res.status(502).send('Bad gateway');
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      const contentLength = response.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      // Stream the body (convert Web ReadableStream to Node stream)
      const nodeStream = Readable.fromWeb(response.body as any);
      nodeStream.on('error', () => res.end());
      nodeStream.pipe(res);
    } catch (err) {
      console.error('share-image error', err);
      res.status(500).send('');
    }
  });

  // Public: recent approved donations
  app.get('/api/donations/recent', async (req, res) => {
    try {
      const limit = parseInt((req.query.limit as string) || '10');
      const items = await storage.getRecentDonations(isNaN(limit) ? undefined : limit);
      res.json(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching recent donations:', error);
      res.status(500).json([]);
    }
  });

  // Public: attach slip URL to an existing pending donation by reference
  app.post('/api/donations/attach-slip', async (req, res) => {
    try {
      const { reference, slipUrl } = req.body || {};
      if (!reference || typeof reference !== 'string' || !slipUrl || typeof slipUrl !== 'string') {
        return res.status(400).json({ error: 'reference and slipUrl are required' });
      }

      const ref = (reference as string).trim();
      const now = new Date();

      const result = await db
        .update(donations)
        .set({ slipUrl, slipUploadedAt: now })
        .where(sql`lower(${donations.reference}) = ${ref.toLowerCase()} and ${donations.status} = 'pending'`)
        .returning();

      if (!result?.length) {
        return res.status(404).json({ error: 'Donation not found or not pending' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error attaching slip:', error);
      res.status(500).json({ error: 'Failed to attach slip' });
    }
  });

  // Admin: reject donation with reason
  app.post('/api/donations/reject/:id', authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body || {};
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const now = new Date();

      const updated = await db
        .update(donations)
        .set({ status: 'rejected', rejectedReason: reason || 'rejected by admin', approvedAt: null })
        .where(sql`${donations.id} = ${id} and ${donations.status} = 'pending'`)
        .returning();

      if (!updated?.length) {
        return res.status(404).json({ error: 'Donation not found or not pending' });
      }

      // notify via SSE too (optional)
      const payload = `data: ${JSON.stringify({ type: 'donation_rejected', id })}\n\n`;
      donationSseClients.forEach(({ res }) => { try { res.write(payload); } catch {} });

      res.json({ success: true });
    } catch (error) {
      console.error('Error rejecting donation:', error);
      res.status(500).json({ error: 'Failed to reject donation' });
    }
  });

  // Reconcile donations from bank transactions (admin only)
  // Request body example:
  // {
  //   "transactions": [
  //     { "amount": 500, "time": "2025-08-13T09:15:00Z", "reference": "UDN-ABC123", "note": "PromptPay Bill Payment UDN-ABC123" }
  //   ],
  //   "matchWindowMinutes": 60, // optional, default 120
  //   "dryRun": true // optional
  // }
  app.post('/api/donations/reconcile', authMiddleware, async (req, res) => {
    try {
      const { transactions, matchWindowMinutes, dryRun } = req.body || {};
      if (!Array.isArray(transactions)) {
        return res.status(400).json({ error: 'Invalid transactions array' });
      }

      const windowMin: number = Number.isFinite(matchWindowMinutes) ? Math.max(0, Number(matchWindowMinutes)) : 120;

      // Load pending donations
      const pending = await storage.getDonations({ status: 'pending', limit: 1000 });

      // Build indexes
      const byRef = new Map<string, typeof pending[number]>();
      for (const d of pending) {
        if (d.reference) byRef.set(d.reference.trim().toLowerCase(), d);
      }

      const matched: Array<{ donationId: number; reference: string; amount: number; method: 'reference'|'amount_time'; transaction: any }>[] = [] as any;
      const approvals: Array<{ donationId: number; txIndex: number }>[] = [] as any;

      const results: Array<{ txIndex: number; matchedDonationId?: number; reason?: string; method?: string }> = [];

      const txs = transactions as Array<{ amount: number; time?: string; reference?: string; note?: string }>; 

      for (let i = 0; i < txs.length; i++) {
        const tx = txs[i];
        const txRef = (tx.reference || tx.note || '').trim().toLowerCase();
        const txTime = tx.time ? new Date(tx.time).getTime() : undefined;
        const txAmount = Number(tx.amount);

        if (!Number.isFinite(txAmount)) {
          results.push({ txIndex: i, reason: 'Invalid amount' });
          continue;
        }

        // 1) Exact reference match (best)
        if (txRef) {
          // Find any ref token present in note/reference
          // We try to match the donation reference as a substring within txRef
          let found: typeof pending[number] | undefined;
          for (const [refKey, d] of byRef.entries()) {
            if (txRef.includes(refKey)) { found = d; break; }
          }
          if (found && found.amount === txAmount) {
            results.push({ txIndex: i, matchedDonationId: found.id, method: 'reference' });
            approvals.push({ donationId: found.id, txIndex: i } as any);
            // mark as used
            byRef.delete(found.reference.trim().toLowerCase());
            continue;
          }
        }

        // 2) Amount + time window (fallback)
        if (typeof txTime === 'number') {
          const windowMs = windowMin * 60 * 1000;
          let candidate: typeof pending[number] | undefined;
          let minDelta = Number.POSITIVE_INFINITY;
          for (const d of pending) {
            if (d.status !== 'pending') continue;
            if (d.amount !== txAmount) continue;
            const dTime = new Date(d.createdAt).getTime();
            const delta = Math.abs(dTime - txTime);
            if (delta <= windowMs && delta < minDelta) {
              // ensure not already matched by ref
              const key = d.reference?.trim().toLowerCase();
              if (key && !byRef.has(key)) continue; // already matched before
              candidate = d;
              minDelta = delta;
            }
          }
          if (candidate) {
            results.push({ txIndex: i, matchedDonationId: candidate.id, method: 'amount_time' });
            approvals.push({ donationId: candidate.id, txIndex: i } as any);
            if (candidate.reference) byRef.delete(candidate.reference.trim().toLowerCase());
            continue;
          }
        }

        results.push({ txIndex: i, reason: 'No match' });
      }

      // Apply approvals unless dryRun
      const approvedIds: number[] = [];
      if (!dryRun) {
        for (const ap of approvals as any) {
          try {
            const updated = await storage.approveDonation(ap.donationId);
            if (updated) {
              approvedIds.push(ap.donationId);
              // SSE broadcast
              const payload = `data: ${JSON.stringify({ type: 'donation_approved', id: ap.donationId })}\n\n`;
              donationSseClients.forEach(({ res }) => { try { res.write(payload); } catch {} });
            }
          } catch {}
        }
      }

      res.json({
        dryRun: !!dryRun,
        windowMinutes: windowMin,
        totalTransactions: txs.length,
        matched: results.filter(r => !!r.matchedDonationId).length,
        approvedIds,
        results,
      });
    } catch (error) {
      console.error('Error reconciling donations:', error);
      res.status(500).json({ error: 'Failed to reconcile donations' });
    }
  });

  // Note: /admin is handled by the SPA router via index.html fallback

  // SEO: Dynamic sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const xml = await SitemapGenerator.generateSitemap();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      res.send(xml);
    } catch (err) {
      console.error('sitemap.xml error', err);
      res.status(500).send('');
    }
  });

  // SEO: Dynamic robots.txt (overrides static if present)
  app.get('/robots.txt', async (req, res) => {
    try {
      const txt = await SitemapGenerator.generateRobotsTxt();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(txt);
    } catch (err) {
      console.error('robots.txt error', err);
      res.status(500).send('');
    }
  });

  // SEO: Server-rendered share page for social crawlers
  app.get('/share/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).send('Invalid id');

      const news = await storage.getNewsById(id);
      if (!news) return res.status(404).send('Not found');

      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
      const host = req.get('host');
      const origin = `${proto}://${host}`;
      const pageUrl = `${origin}/news/${news.id}`;
      const shareUrl = `${origin}/share/${news.id}`;
      const title = news.title || 'UD News Update';
      const description = (news.summary || news.content || '').toString().slice(0, 200);
      // Use same-origin image URL so Facebook can fetch reliably
      const image = news.imageUrl ? `${origin}/share-image/${news.id}` : `${origin}/logo.jpg`;
      const secureImage = proto === 'https' ? image : image.replace('http://', 'https://');

      const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${pageUrl}" />
  <meta name="description" content="${escapeHtml(description)}" />
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${secureImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta property="og:site_name" content="UD News Update" />
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />
  <!-- Fallback redirect for users -->
  <meta http-equiv="refresh" content="1;url=${pageUrl}" />
  <script>window.location.replace(${JSON.stringify(pageUrl)});</script>
</head>
<body>
  <p>กำลังเปลี่ยนเส้นทางไปยังข่าว: <a href="${pageUrl}">${escapeHtml(title)}</a></p>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err) {
      console.error('share page error', err);
      res.status(500).send('');
    }
  });

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

  // Admin verification route
  app.get("/api/admin/verify", authMiddleware, async (req, res) => {
    try {
      res.json({ 
        success: true, 
        message: 'Token valid',
        user: (req as any).user
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  });

  // Donations Management API
  // SSE clients for donation updates
  const donationSseClients: Array<{ id: number; res: any }> = [];

  // List donations (admin only)
  app.get("/api/donations", authMiddleware, async (req, res) => {
    try {
      const status = (req.query.status as string | undefined);
      const limit = parseInt((req.query.limit as string) || '50');

      const allowed = [undefined, 'pending', 'approved', 'rejected'] as const;
      if (!allowed.includes(status as any)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const donations = await storage.getDonations({ status: status as any, limit: isNaN(limit) ? undefined : limit });
      res.json(donations);
    } catch (error) {
      console.error('Error fetching donations:', error);
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });

  // Approve donation (admin only)
  app.post("/api/donations/approve/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

      const ok = await storage.approveDonation(id);
      if (!ok) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      // Broadcast SSE event to listeners
      const payload = `data: ${JSON.stringify({ type: 'donation_approved', id })}\n\n`;
      donationSseClients.forEach(({ res }) => {
        try { res.write(payload); } catch {}
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error approving donation:', error);
      res.status(500).json({ error: "Failed to approve donation" });
    }
  });

  // SSE stream for donation updates
  app.get('/api/donations/stream', (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = Date.now();
    donationSseClients.push({ id: clientId, res });

    req.on('close', () => {
      const idx = donationSseClients.findIndex(c => c.id === clientId);
      if (idx !== -1) donationSseClients.splice(idx, 1);
    });
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

      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      // Create cache key
      const cacheKey = `news:all:${limit}:${offset}`;

      // Try to get from cache first
      let news = newsCache.get<any[]>(cacheKey);

      if (!news) {
        // If not in cache, fetch from database
        news = await storage.getAllNews(limit, offset);

        // Store in cache for faster subsequent requests
        newsCache.set(cacheKey, news);
      }

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
      const cacheKey = `news:${id}`;

      // Try to get from cache first
      let article = individualNewsCache.get<any>(cacheKey);

      if (!article) {
        // If not in cache, fetch from database
        article = await storage.getNewsById(id);
        if (!article) {
          return res.status(404).json({ error: "News article not found" });
        }

        // Store in cache for faster subsequent requests
        individualNewsCache.set(cacheKey, article);
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

      // Clear cache when new news is added  
      newsCache.flushAll();
      individualNewsCache.flushAll();

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
      // Use raw SQL query since the table structure doesn't match schema
      const result = await db.execute(sql`SELECT * FROM site_settings ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (error) {
      console.error('Site settings error:', error);
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
      console.error("Error fetching analytics summary:", error);
      // Provide fallback data during error
      res.json({
        totalViews: 0,
        totalNews: 0,
        todayViews: 0,
        popularNews: []
      });
    }
  });

  // Contact Messages routes
  app.get("/api/contact-messages", async (req, res) => {
    try {
      // Use raw SQL query since the table structure may not match schema exactly
      const result = await db.execute(sql`SELECT * FROM contact_messages ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (error) {
      console.error('Contact messages error:', error);
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

  // Analytics Routes
  app.get("/api/analytics/detailed", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get view statistics
      const todayViews = await storage.getTodayViews();
      const yesterdayViews = await storage.getViewsByDate(yesterday);
      const weekViews = await storage.getViewsSince(weekAgo);
      const monthViews = await storage.getViewsSince(monthAgo);

      // Get news statistics
      const newsReadToday = await storage.getNewsReadToday();
      const popularNews = await storage.getMostViewedNews();
      const popularCategory = await storage.getMostPopularCategory();

      res.json({
        todayViews: todayViews || 0,
        yesterdayViews: yesterdayViews || 0,
        weekViews: weekViews || 0,
        monthViews: monthViews || 0,
        newsReadToday: newsReadToday || 0,
        popularNews: popularNews || 'ไม่มีข้อมูล',
        popularCategory: popularCategory || 'ไม่มีข้อมูล'
      });
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Comments Management Routes
  app.get("/api/comments", async (req, res) => {
    try {
      const filter = (req.query.filter as string) || 'all';
      const limit = parseInt((req.query.limit as string) || '50');
      const comments = await storage.getComments(filter, limit);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments/:id/approve", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.approveComment(id);
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error approving comment:', error);
      res.status(500).json({ error: "Failed to approve comment" });
    }
  });

  app.delete("/api/comments/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteComment(id);
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Theme Management Route
  app.post("/api/admin/theme", authMiddleware, async (req, res) => {
    try {
      const { theme } = req.body;
      if (!['light', 'dark', 'thai'].includes(theme)) {
        return res.status(400).json({ error: "Invalid theme" });
      }
      
      // Store theme setting in database or config
      await storage.updateGlobalSetting('theme', theme);
      
      res.json({ success: true, theme });
    } catch (error) {
      console.error('Error setting theme:', error);
      res.status(500).json({ error: "Failed to set theme" });
    }
  });

  app.get("/api/admin/theme", async (req, res) => {
    try {
      const theme = await storage.getGlobalSetting('theme') || 'light';
      res.json({ theme });
    } catch (error) {
      console.error('Error getting theme:', error);
      res.json({ theme: 'light' });
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
        error: error instanceof Error ? error.message : String(error),
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
        error: error instanceof Error ? error.message : String(error)
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
      res.status(400).json({ 
        message: "Failed to create comment",
        error: error instanceof Error ? error.message : String(error)
      });
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('unique')) {
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

  // Database management routes
  app.use('/api/database', databaseRoutes);
  
  // User management routes
  app.use('/api/users', userRoutes);

  // =========================
  // Donations (Phase 1)
  // =========================
  // PromptPay config (Phase 1 - can later move to env)
  const PROMPTPAY_ID = '0968058732';
  const PROMPTPAY_DISPLAY = 'อัพเดทข่าวอุดร - UD News Update';

  // SSE clients for realtime updates
  const donationClients = new Set<import('express').Response>();
  function broadcastDonationEvent(event: any) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of donationClients) {
      try { res.write(data); } catch {}
    }
  }

  app.get('/api/donations/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    donationClients.add(res);
    // Send hello
    res.write(`data: ${JSON.stringify({ type: 'hello' })}\n\n`);

    req.on('close', () => {
      donationClients.delete(res);
    });
  });

  // Helper: build EMVCo PromptPay payload for mobile number
  function buildPromptPayPayload(mobileOrId: string, amount?: number) {
    const formatId = (id: string) => {
      // If phone, ensure it's 10 digits mobile in Thailand, strip non-digits
      const digits = id.replace(/\D/g, '');
      if (digits.length === 10 && digits.startsWith('0')) {
        // Convert to 13-digit national mobile format: add country code 66 and drop leading 0
        return `0066${digits.substring(1)}`;
      }
      // If citizen ID or tax ID, return as is
      return digits;
    };

    const id = formatId(mobileOrId);

    // TLV builder
    const tlv = (id: string, value: string) => id + String(value.length).padStart(2, '0') + value;

    // Merchant account info (PromptPay - GUID A000000677010111)
    const guid = 'A000000677010111';
    const acc = tlv('00', guid) + tlv('01', id);
    const mai = tlv('29', acc);

    const payloadFormat = tlv('00', '01');
    const poi = tlv('01', amount ? '11' : '12'); // 11 dynamic (amount fixed), 12 static
    const country = tlv('58', 'TH');
    const currency = tlv('53', '764');
    const amountTlv = amount ? tlv('54', amount.toFixed(2)) : '';
    const name = PROMPTPAY_DISPLAY ? tlv('59', PROMPTPAY_DISPLAY.substring(0, 25)) : '';
    const city = tlv('60', 'Bangkok');

    let payload = payloadFormat + poi + mai + country + currency + amountTlv + name + city + '6304';
    const crc = crc16ccitt(payload);
    payload += crc;
    return payload;
  }

  // CRC16-CCITT (0x1021, initial 0xFFFF) uppercase hex
  function crc16ccitt(str: string) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021; else crc <<= 1;
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  app.post('/api/donations/create', async (req, res) => {
    try {
      const { amount, donorName, isAnonymous, message } = req.body as {
        amount: number; donorName?: string; isAnonymous?: boolean; message?: string;
      };

      if (!amount || amount < 1) return res.status(400).json({ error: 'Invalid amount' });

      const reference = nanoid(12);
      const payload = buildPromptPayPayload(PROMPTPAY_ID, amount);
      const qrDataUrl = await QRCode.toDataURL(payload, { margin: 2, width: 320 });

      const donation = await storage.createDonation({
        amount: Math.round(amount),
        currency: 'THB',
        donorName: donorName?.trim() || null as any,
        isAnonymous: !!isAnonymous,
        message: message?.trim() || null as any,
        reference,
        status: 'pending',
      } as InsertDonation);

      res.json({
        id: donation.id,
        reference,
        amount: donation.amount,
        currency: donation.currency,
        qrDataUrl,
        promptPayDisplay: PROMPTPAY_DISPLAY,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to create donation' });
    }
  });

  app.post('/api/donations/approve/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await storage.approveDonation(id);
      if (!updated) return res.status(404).json({ error: 'Donation not found' });

      // Broadcast update
      broadcastDonationEvent({ type: 'donation_approved', donation: updated });
      // Also broadcast new ranks
      const ranks = await storage.getDonationRanking('all');
      broadcastDonationEvent({ type: 'ranks', ranks });

      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to approve donation' });
    }
  });

  app.get('/api/donations/rank', async (req, res) => {
    try {
      const range = (req.query.range as 'today'|'week'|'all') || 'all';
      const ranks = await storage.getDonationRanking(range);
      res.json(ranks);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to get ranking' });
    }
  });

  app.get('/api/donations/recent', async (_req, res) => {
    try {
      const recent = await storage.getRecentDonations(10);
      res.json(recent);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to get recent donations' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}