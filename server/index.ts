// Load environment variables as early as possible (prefer .env.local over .env)
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
try {
  const rootDir = path.resolve(import.meta.dirname, '..');
  const localEnv = path.join(rootDir, '.env.local');
  const defaultEnv = path.join(rootDir, '.env');
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else if (fs.existsSync(defaultEnv)) {
    dotenv.config({ path: defaultEnv });
  }
} catch {}

import express, { type Request, Response, NextFunction } from "express";
import compression from 'compression';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { rssService } from "./rss-service";
import { logMemoryUsage } from './utils/memoryMonitor';

const app = express();

// Log initial memory usage
logMemoryUsage('Server startup');

// Log memory usage on interval in production (default 60s, configurable via MEM_CHECK_INTERVAL_SEC)
if (process.env.NODE_ENV === 'production') {
  const intervalSec = Number.parseInt(process.env.MEM_CHECK_INTERVAL_SEC || '60', 10);
  const intervalMs = Math.max(10, isFinite(intervalSec) ? intervalSec : 60) * 1000;
  setInterval(() => logMemoryUsage('Production Memory Check'), intervalMs);
}

// Trust proxy if behind a reverse proxy/CDN
app.set('trust proxy', 1);

// Force HTTPS behind proxy/CDN using x-forwarded-proto
// Safer: only enforce in production, allow opt-out via FORCE_HTTPS=false,
// and only redirect when the header exists and is not https to avoid loops locally.
app.use((req, res, next) => {
  const forceHttps = (process.env.FORCE_HTTPS ?? 'true') !== 'false';
  const isProd = process.env.NODE_ENV === 'production';
  const xfProto = req.headers['x-forwarded-proto'] as string | undefined;

  if (forceHttps && isProd && xfProto && xfProto !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Robust CORS (configure with FRONTEND_ORIGINS="https://udnewsupdate.sbs,http://localhost:5173")
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin as string | undefined;
  const originsEnv = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || 'https://udnewsupdate.sbs,http://localhost:5173';
  const allowed = originsEnv.split(',').map(s => s.trim()).filter(Boolean);
  const allowWildcard = allowed.includes('*');
  const allowCredentials = (process.env.CORS_CREDENTIALS ?? 'true') !== 'false';

  if (requestOrigin && (allowWildcard || allowed.includes(requestOrigin))) {
    res.header('Access-Control-Allow-Origin', allowWildcard ? '*' : requestOrigin);
    // Credentials cannot be used with wildcard origin
    if (!allowWildcard && allowCredentials) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  }

  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Enable gzip compression (safe default)
app.use(compression({ threshold: 1024 }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded/optimized images
app.use(
  "/uploads",
  express.static(path.resolve(import.meta.dirname, "./public/uploads"), {
    maxAge: '7d',
    immutable: false,
    setHeaders: (res, filePath) => {
      // Allow CDN/proxy caching
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  })
);

// Dynamic sitemap.xml
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const origin = `${req.protocol}://${req.get('host')}`;
    const apiUrl = `${origin}/api/news`;
    const r = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`Fetch failed ${r.status}`);
    const items: any[] = await r.json();

    const entries: string[] = [];
    // Home
    entries.push(urlEntry(`${origin}/`, undefined, 'daily', '1.0'));
    // Key static pages
    entries.push(urlEntry(`${origin}/thai-calendar`, undefined, 'weekly', '0.6'));
    entries.push(urlEntry(`${origin}/lottery`, undefined, 'weekly', '0.6'));
    // News items
    if (Array.isArray(items)) {
      for (const it of items) {
        const id = it?.id ?? it?.newsId;
        if (!id) continue;
        const lastmod = it?.updatedAt || it?.createdAt;
        entries.push(urlEntry(`${origin}/news/${id}`, lastmod));
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    res.send(xml);
  } catch (err) {
    try {
      // Fallback to static sitemap file to avoid 5xx for bots
      const filePath = path.resolve(import.meta.dirname, './public/sitemap.xml');
      res.setHeader('Content-Type', 'application/xml');
      return res.sendFile(filePath);
    } catch {
      res.status(500).send('Failed to generate sitemap');
    }
  }
});

function urlEntry(loc: string, lastmod?: string, changefreq = 'daily', priority = '0.8') {
  const last = lastmod ? `\n  <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
  return `  <url>\n  <loc>${loc}</loc>${last}\n  <changefreq>${changefreq}</changefreq>\n  <priority>${priority}</priority>\n  </url>`;
}

// RSS feed for latest news
app.get('/feed.xml', async (req: Request, res: Response) => {
  try {
    const origin = `${req.protocol}://${req.get('host')}`;
    const siteUrl = `${origin}`;
    const apiUrl = `${origin}/api/news?limit=50&offset=0`;
    const r = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`Fetch failed ${r.status}`);
    const items: any[] = await r.json();

    const now = new Date().toUTCString();
    const rssItems = (Array.isArray(items) ? items : []).slice(0, 50).map((it) => {
      const id = it?.id ?? it?.newsId;
      const title = escapeXml(it?.title || `ข่าว #${id}`);
      const description = escapeXml(it?.summary || it?.description || '');
      const link = `${siteUrl}/news/${id}`;
      const pubDate = new Date(it?.createdAt || Date.now()).toUTCString();
      const guid = `${siteUrl}/news/${id}`;
      return `    <item>\n      <title>${title}</title>\n      <link>${link}</link>\n      <guid isPermaLink="true">${guid}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description><![CDATA[${it?.summary || it?.description || ''}]]></description>\n    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0">\n` +
      `  <channel>\n` +
      `    <title>UD News Update - ข่าวล่าสุด</title>\n` +
      `    <link>${siteUrl}</link>\n` +
      `    <description>ฟีดข่าวล่าสุดจาก UD News Update</description>\n` +
      `    <language>th-TH</language>\n` +
      `    <lastBuildDate>${now}</lastBuildDate>\n` +
      rssItems + '\n' +
      `  </channel>\n` +
      `</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes
    res.send(xml);
  } catch (e) {
    res.status(500).send('Failed to generate feed');
  }
});

function escapeXml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // In development, use Vite middlewares to serve client without prebuild
  // In production, serve prebuilt static files from dist/public
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
  } else {
    // Serve built client
    serveStatic(app);
  }

  // Use environment port or default to 5000
  // this serves both the API and the client.
  const host = "0.0.0.0"; // Bind to all interfaces
  // Force port 5000 in development for Replit workflow compatibility
  const basePort = process.env.NODE_ENV === 'development' ? 5000 : parseInt(process.env.PORT || "5000", 10) || 5000;

  const startServer = (p: number, retries = 10) => {
    const onError = (e: any) => {
      if ((e?.code === 'EADDRINUSE' || e?.code === 'EACCES') && retries > 0) {
        console.warn(`Port ${p} unavailable (${e?.code}). Retrying on port ${p + 1}...`);
        try { server.close?.(); } catch {}
        // Try the next port
        startServer(p + 1, retries - 1);
      } else {
        console.error('Failed to start server:', e);
        process.exit(1);
      }
    };

    server.once('error', onError);
    server.listen(p, host, () => {
      // Remove the once error handler on successful listen
      try { (server as any).off?.('error', onError); } catch {}

      log(`serving on port ${p}`);

      // Start automatic RSS processing after server is ready
      // Kick off schema preflight and then RSS processing in background
      (async () => {
        try {
          // Ensure critical columns exist (idempotent)
          await db.execute(sql`
            ALTER TABLE IF EXISTS news_articles
            ADD COLUMN IF NOT EXISTS image_urls TEXT[]
          `);
          log('DB schema preflight complete');
        } catch (e) {
          console.warn('DB schema preflight failed:', e);
        }
        // Start automatic RSS processing after schema preflight
        try {
          rssService.startAutoProcessing();
          log('RSS automatic processing started');
        } catch (e) {
          console.warn('Failed to start RSS processing:', e);
        }
      })();
    });
  };

  startServer(basePort);
})();
