// Ping Google to fetch the latest sitemap
// Usage:
//   cross-env SITEMAP_URL=https://udnewsupdate.sbs/sitemap.xml tsx scripts/ping-google.ts

const SITEMAP_URL = process.env.SITEMAP_URL || 'https://udnewsupdate.sbs/sitemap.xml';

async function main() {
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
  try {
    const res = await fetch(pingUrl, { method: 'GET' });
    console.log(`Google ping status: ${res.status} ${res.statusText}`);
    if (!res.ok) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Failed to ping Google:', err);
    process.exitCode = 1;
  }
}

main();
