import fs from 'fs';
import path from 'path';

// Configure source API and site origin
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://udnewsupdate.sbs';
const API_URL = process.env.SITEMAP_SOURCE || `${SITE_ORIGIN}/api/news`;

async function main() {
  try {
    const res = await fetch(API_URL, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    const items = await res.json();

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

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

    const outFile = path.resolve('client', 'public', 'sitemap.xml');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, xml, 'utf8');
    console.log(`Sitemap generated: ${outFile} with ${urls.length} urls`);
  } catch (err) {
    console.error('Failed to generate sitemap:', err);
    process.exitCode = 1;
  }
}

function urlEntry(loc: string, lastmod?: string, changefreq = 'daily', priority = '0.8') {
  const last = lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${last}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

main();
