import fs from 'fs';
import path from 'path';

// Configure source API and site origin
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://udnewsupdate.sbs';
const API_URL = process.env.SITEMAP_SOURCE || `${SITE_ORIGIN}/api/news`;

async function fetchJSONWithRetry(url: string, opts: RequestInit = {}, attempts = 3, timeoutMs = 8000): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      // brief backoff
      await new Promise(r => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

function buildXML(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

async function main() {
  try {
    const items = await fetchJSONWithRetry(API_URL, { headers: { 'Accept': 'application/json' } }, 3, 8000);

    const urls: string[] = [];

    // Home
    urls.push(urlEntry(`${SITE_ORIGIN}/`, undefined, 'daily', '1.0'));

    // News list
    if (Array.isArray(items)) {
      for (const it of items) {
        const id = it?.id ?? it?.newsId;
        if (!id) continue;
        const lastmod = it?.updatedAt || it?.createdAt;
        urls.push(urlEntry(`${SITE_ORIGIN}/news/${id}`, lastmod));
      }
    }

    const xml = buildXML(urls);

    const outFile = path.resolve('client', 'public', 'sitemap.xml');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, xml, 'utf8');
    console.log(`Sitemap generated: ${outFile} with ${urls.length} urls`);
  } catch (err) {
    console.warn('Sitemap: API unavailable, generating minimal sitemap. Reason:', err instanceof Error ? err.message : String(err));
    try {
      const urls: string[] = [];
      // Minimal set of important pages
      const staticPaths = ['/', '/news', '/thai-calendar', '/contact', '/about'];
      for (const p of staticPaths) urls.push(urlEntry(`${SITE_ORIGIN}${p}`, undefined, 'weekly', '0.6'));
      const xml = buildXML(urls);
      const outFile = path.resolve('client', 'public', 'sitemap.xml');
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, xml, 'utf8');
      console.log(`Sitemap (fallback) generated: ${outFile} with ${urls.length} urls`);
      process.exitCode = 0; // ensure success
    } catch (e) {
      console.error('Failed to write fallback sitemap:', e);
      process.exitCode = 1;
    }
  }
}

function urlEntry(loc: string, lastmod?: string, changefreq = 'daily', priority = '0.8') {
  const last = lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${last}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

main();
