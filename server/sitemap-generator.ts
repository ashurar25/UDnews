
import { storage } from "./storage";

export class SitemapGenerator {
  static async generateSitemap(): Promise<string> {
    const baseUrl = process.env.BASE_URL || "https://udnewsupdate.sbs"; // Prefer env BASE_URL when available
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    // Homepage
    sitemap += `  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
`;

    // Static pages
    const staticPages = [
      { path: '/contact', priority: '0.8' },
      { path: '/donate', priority: '0.7' },
      { path: '/news/all', priority: '0.9' },
      { path: '/news/breaking', priority: '0.9' },
      { path: '/news/local', priority: '0.8' },
      { path: '/news/politics', priority: '0.8' },
      { path: '/news/sports', priority: '0.8' },
      { path: '/news/entertainment', priority: '0.8' },
      { path: '/news/crime', priority: '0.8' }
    ];

    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <changefreq>daily</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
`;
    });

    try {
      // Get all news articles
      const news = await storage.getAllNews();
      
      news.forEach(article => {
        const isRecent = new Date(article.createdAt).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        sitemap += `  <url>
    <loc>${baseUrl}/news/${article.id}</loc>
    <changefreq>${isRecent ? 'daily' : 'weekly'}</changefreq>
    <priority>${isRecent ? '0.9' : '0.7'}</priority>
    <lastmod>${new Date(article.createdAt).toISOString()}</lastmod>
`;

        // Add Google News sitemap for recent articles
        if (isRecent) {
          sitemap += `    <news:news>
      <news:publication>
        <news:name>UD News</news:name>
        <news:language>th</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.createdAt).toISOString()}</news:publication_date>
      <news:title>${article.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</news:title>
    </news:news>
`;
        }

        sitemap += `  </url>
`;
      });
    } catch (error) {
      console.error('Error generating sitemap:', error);
    }

    sitemap += `</urlset>`;
    return sitemap;
  }

  static async generateRobotsTxt(): Promise<string> {
    const baseUrl = process.env.BASE_URL || "https://udnewsupdate.sbs"; // Prefer env BASE_URL when available
    return `User-agent: *\nDisallow:\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  }
}
