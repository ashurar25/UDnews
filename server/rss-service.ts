import Parser from 'rss-parser';
import { parse } from 'node-html-parser';
import { storage } from './storage';
import { type InsertNews } from '@shared/schema';
import { ImageOptimizer } from './image-optimizer';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; UD News RSS Reader/1.0)',
    'Accept': 'application/rss+xml, application/xml, text/xml',
    'Accept-Language': 'th,en;q=0.9'
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded'],
      ['media:thumbnail', 'mediaThumbnail']
    ]
  }
});

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  categories?: string[];
  isoDate?: string;
  mediaContent?: any;
  contentEncoded?: string;
  mediaThumbnail?: any;
  enclosure?: { url: string }; // Added for enclosure URL
  summary?: string; // Added for summary
}

// Define feed status interface
interface FeedStatus {
  isProcessing: boolean;
  lastError: string | null;
  lastProcessed?: Date;
  itemsProcessed?: number;
}

export class RSSService {
  private isProcessing = false;
  private lastProcessed = new Map<number, Date>();
  private intervalId: NodeJS.Timeout | null = null;
  private feedStatus: Record<number, FeedStatus> = {}; // Store status for each feed
  private storage = storage; // Alias storage for easier access

  // Generic fetch with retry and backoff for transient network errors
  private async fetchWithRetry(url: string, init: RequestInit, attempts = 3, baseTimeoutMs = 20000): Promise<Response> {
    let lastError: unknown = null;
    for (let i = 1; i <= attempts; i++) {
      const controller = new AbortController();
      const timeout = baseTimeoutMs + (i - 1) * 15000; // 20s, 35s, 50s
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timer);
        // Retry on 5xx
        if (res.status >= 500) {
          lastError = new Error(`HTTP ${res.status}`);
          throw lastError;
        }
        return res;
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
        const code = err?.code || err?.cause?.code;
        const isAbort = err?.name === 'AbortError';
        const retriable = isAbort || code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ENOTFOUND' || code === 'EAI_AGAIN';
        const isLast = i === attempts;
        console.warn(`Fetch attempt ${i}/${attempts} failed for ${url}${code ? ` [${code}]` : ''}${isAbort ? ' [AbortError]' : ''}:`, err?.message || err);
        if (isLast || !retriable) {
          break;
        }
        // Exponential backoff before next attempt
        const backoff = 500 * Math.pow(2, i - 1); // 500ms, 1s, 2s
        await new Promise(r => setTimeout(r, backoff));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Fetch failed');
  }

  // Extract up to 5 image URLs from various RSS fields and HTML content
  private extractImageUrls(content: string | undefined, mediaContent?: any, mediaThumbnail?: any): string[] {
    const results: string[] = [];

    // Helper to push normalized http(s) URLs
    const pushUrl = (u?: string) => {
      if (!u) return;
      const url = u.startsWith('//') ? `https:${u}` : u;
      if (/^https?:\/\//i.test(url) && !results.includes(url)) results.push(url);
    };

    // media:content can be array or single
    if (mediaContent) {
      const items = Array.isArray(mediaContent) ? mediaContent : [mediaContent];
      for (const it of items) {
        // rss-parser shapes vary: it.url or it.$.url
        if (it?.url) pushUrl(it.url);
        if (it?.$?.url) pushUrl(it.$.url);
        if (typeof it === 'string') pushUrl(it);
      }
    }

    // media:thumbnail
    if (mediaThumbnail) {
      const items = Array.isArray(mediaThumbnail) ? mediaThumbnail : [mediaThumbnail];
      for (const it of items) {
        if (it?.url) pushUrl(it.url);
        if (it?.$?.url) pushUrl(it.$.url);
        if (typeof it === 'string') pushUrl(it);
      }
    }

    // Parse HTML content for up to 5 <img>
    if (content) {
      try {
        const root = parse(content);
        const imgs = root.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src');
          const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-original');
          const srcset = img.getAttribute('srcset');
          if (srcset) {
            const first = srcset.split(',')[0]?.trim().split(' ')[0];
            pushUrl(first);
          }
          pushUrl(src || dataSrc || undefined);
          if (results.length >= 5) break;
        }
      } catch (error) {
        console.error('Error parsing HTML content for images:', error);
      }
    }

    // Cap to 5
    return results.slice(0, 5);
  }

  // Fallback: fetch article page and scrape og:image
  private async fetchOgImageUrl(pageUrl?: string): Promise<string | null> {
    if (!pageUrl) return null;
    try {
      const res = await this.fetchWithRetry(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UD News Crawler/1.0)'
        }
      }, 2, 12000);
      if (!res.ok) return null;
      const html = await res.text();
      const root = parse(html);
      const og = root.querySelector('meta[property="og:image"], meta[name="og:image"]');
      const twitter = root.querySelector('meta[name="twitter:image"], meta[property="twitter:image"]');
      const href = og?.getAttribute('content') || twitter?.getAttribute('content');
      return href ? (href.startsWith('//') ? `https:${href}` : href) : null;
    } catch {
      return null;
    }
  }

  // Lightweight availability check for hotlink URLs (HEAD preferred, fallback GET)
  private async checkUrlOk(url: string): Promise<boolean> {
    try {
      const head = await this.fetchWithRetry(url, { method: 'HEAD', headers: { 'User-Agent': 'UD-News-Image-Checker/1.0' } }, 2, 8000);
      if (head.ok) return true;
    } catch {}
    try {
      const get = await this.fetchWithRetry(url, { method: 'GET', headers: { 'User-Agent': 'UD-News-Image-Checker/1.0' } }, 1, 8000);
      return get.ok;
    } catch {
      return false;
    }
  }

  // Download image and store optimized copy to /uploads, returning local URL
  private async downloadAndStoreImage(imageUrl: string): Promise<string | null> {
    try {
      const res = await this.fetchWithRetry(imageUrl, { headers: { 'User-Agent': 'UD-News-Image-Fetcher/1.0' } }, 3, 20000);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || '';
      const buffer = Buffer.from(await res.arrayBuffer());

      // Determine a filename and extension
      const urlObj = new URL(imageUrl, 'http://dummy');
      const pathname = urlObj.pathname;
      const base = pathname.split('/').pop() || 'image';
      const hasExt = /\.[a-zA-Z0-9]+$/.test(base);
      let filename = base;
      if (!hasExt) {
        if (contentType.includes('png')) filename = `${base}.png`;
        else if (contentType.includes('webp')) filename = `${base}.webp`;
        else filename = `${base}.jpg`;
      }

      // Optimize to webp by default
      const localPath = await ImageOptimizer.optimizeImage(buffer, filename, { format: 'webp' });
      return localPath; // e.g., /uploads/...
    } catch (e) {
      console.warn('Failed to download/store image:', imageUrl, e);
      return null;
    }
  }

  // Calculate string similarity using Levenshtein distance
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j += 1) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Clean and format content
  private cleanContent(content: string | undefined, contentEncoded?: string): string {
    let text = contentEncoded || content || '';

    try {
      // Parse HTML and extract text
      const root = parse(text);
      text = root.innerText || root.textContent || text;
    } catch (error) {
      // If HTML parsing fails, remove basic HTML tags
      text = text.replace(/<[^>]*>/g, ' ');
    }

    // Clean up whitespace and decode HTML entities
    text = text
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, '...')
      .trim();

    return text;
  }

  // Generate summary from content
  private generateSummary(content: string): string {
    if (!content || content.length < 50) {
      return content || 'ไม่มีเนื้อหาสรุป';
    }

    // Split by sentences (Thai and English)
    const sentences = content.split(/[.!?。]/).filter(s => s.trim().length > 10);

    if (sentences.length === 0) {
      return content.substring(0, 200) + '...';
    }

    // Take first 2-3 sentences for summary
    const summaryLength = Math.min(3, sentences.length);
    let summary = sentences.slice(0, summaryLength).join('. ').trim();

    // Limit summary length
    if (summary.length > 300) {
      summary = summary.substring(0, 300) + '...';
    } else if (!summary.endsWith('.')) {
      summary += '...';
    }

    return summary;
  }

  // Determine category from RSS feed category and item categories
  private determineCategory(feedCategory: string, itemCategories?: string[]): string {
    // If item has specific categories, use the first one
    if (itemCategories && itemCategories.length > 0) {
      const category = itemCategories[0].toLowerCase();

      // Map common categories to Thai categories
      if (category.includes('politics') || category.includes('government') || 
          category.includes('การเมือง') || category.includes('รัฐบาล')) return 'การเมือง';
      if (category.includes('sport') || category.includes('football') || category.includes('soccer') ||
          category.includes('กีฬา') || category.includes('ฟุตบอล')) return 'กีฬา';
      if (category.includes('business') || category.includes('economy') ||
          category.includes('ธุรกิจ') || category.includes('เศรษฐกิจ')) return 'เศรษฐกิจ';
      if (category.includes('technology') || category.includes('tech') ||
          category.includes('เทคโนโลยี') || category.includes('ไอที')) return 'เทคโนโลยี';
      if (category.includes('health') || category.includes('medical') ||
          category.includes('สุขภาพ') || category.includes('การแพทย์')) return 'สุขภาพ';
      if (category.includes('education') || category.includes('school') ||
          category.includes('การศึกษา') || category.includes('โรงเรียน')) return 'การศึกษา';
      if (category.includes('entertainment') || category.includes('celebrity') ||
          category.includes('บันเทิง') || category.includes('ดารา')) return 'บันเทิง';
      if (category.includes('local') || category.includes('ท้องถิ่น') ||
          category.includes('จังหวัด') || category.includes('อุดรธานี')) return 'ข่าวท้องถิ่น';
    }

    // Fall back to feed category
    return feedCategory;
  }

  // Process a single RSS feed with improved performance
  async processFeed(feedId: number, feedUrl: string, category: string): Promise<number> {
    let articlesProcessed = 0;
    let articlesAdded = 0;
    let success = true;
    let errorMessage: string | null = null;

    try {
      console.log(`Processing RSS feed: ${feedUrl}`);
      // Mark feed as processing
      this.feedStatus[feedId] = { isProcessing: true, lastError: null };

      console.log(`🔄 Fetching RSS from: ${feedUrl}`);

      const response = await this.fetchWithRetry(feedUrl, {
        headers: {
          'User-Agent': 'UD-News-RSS-Reader/1.0 (+https://udnews.com)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
          'Cache-Control': 'no-cache'
        }
      }, 3, 20000);

      if (!response.ok) {
        console.error(`❌ RSS fetch failed for ${feedUrl}: HTTP ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xml = await response.text();

      if (!xml || xml.length < 100) {
        console.error(`❌ RSS content too short for ${feedUrl}: ${xml.length} characters`);
        throw new Error('RSS content appears to be empty or too short');
      }

      console.log(`✅ RSS fetched successfully from ${feedUrl}: ${xml.length} characters`);

      // Use the global parser instance
      const feed = await parser.parseString(xml); // Use parseString with the fetched XML

      if (!feed || !feed.items || feed.items.length === 0) {
        console.log(`No items found in feed: ${feedUrl}`);
        await this.recordProcessingHistory(feedId, 0, 0, true, 'No items found in feed');
        this.lastProcessed.set(feedId, new Date()); // Update last processed time even if no items
        return 0;
      }

      articlesProcessed = feed.items.length;

      // Process each item in the feed
      for (const item of feed.items) {
        try {
          const wasAdded = await this.processRSSItem(item as RSSItem, category, feedId);
          if (wasAdded) articlesAdded++;
        } catch (error) {
          console.error(`Error processing RSS item from ${feedUrl}:`, error);
          // Continue processing other items
        }
      }

      // Update feed last processed time
      await storage.updateRssFeedLastProcessed(feedId);

      // Record processing history
      await this.recordProcessingHistory(feedId, articlesProcessed, articlesAdded, true, null);

      this.lastProcessed.set(feedId, new Date());
      this.feedStatus[feedId] = { isProcessing: false, lastError: null, lastProcessed: new Date(), itemsProcessed: articlesAdded };
      console.log(`Successfully processed ${articlesAdded}/${articlesProcessed} items from ${feedUrl}`);
      return articlesAdded;

    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing RSS feed ${feedUrl}:`, error);

      // Record failed processing
      await this.recordProcessingHistory(feedId, articlesProcessed, articlesAdded, false, errorMessage);

      // Update last processed time even on error
      this.lastProcessed.set(feedId, new Date());
      this.feedStatus[feedId] = { isProcessing: false, lastError: errorMessage, lastProcessed: new Date(), itemsProcessed: articlesAdded };

      // Check if it's a parsing error and try alternative approach (consider if this is still needed or if timeout is sufficient)
      if (error instanceof Error && error.message && error.message.includes('Non-whitespace before first tag')) {
        console.log(`Attempting alternative fetch for ${feedUrl}`);
        try {
          const response = await fetch(feedUrl);
          const text = await response.text();
          console.log(`Feed content preview: ${text.substring(0, 200)}...`);

          // If it starts with JSON, it might be a JSON feed
          if (text.trim().startsWith('{')) {
            console.log(`Feed ${feedUrl} appears to be JSON format, skipping for now`);
            return 0;
          }
        } catch (fetchError) {
          console.error(`Alternative fetch also failed for ${feedUrl}:`, fetchError);
        }
      }

      return 0;
    }
  }

  // Record RSS processing history
  private async recordProcessingHistory(feedId: number, processed: number, added: number, success: boolean, errorMessage: string | null): Promise<void> {
    try {
      await storage.insertRssHistory({
        rssFeedId: feedId,
        articlesProcessed: processed,
        articlesAdded: added,
        success: success,
        errorMessage: errorMessage
      });
    } catch (error) {
      console.error('Failed to record RSS processing history:', error);
    }
  }

  // Generate a unique hash for article content
  private generateContentHash(title: string, link: string): string {
    // Use simpler approach for better performance
    return Buffer.from(`${title}:${link}`).toString('base64').slice(0, 16);
  }

  // Process a single RSS item
  private async processRSSItem(item: RSSItem, feedCategory: string, feedId: number): Promise<boolean> {
    if (!item.title || !item.link) {
      return false; // Skip items without title or link
    }

    // Generate content hash for deduplication
    const contentHash = this.generateContentHash(item.title, item.link);

    // Check if this article already exists (by sourceUrl or similar title)
    const existingNews = await storage.getAllNews(); // This might be inefficient for many news items
    const exists = existingNews.some(news => {
      // Check exact URL match
      if (item.link && news.sourceUrl === item.link) return true;

      // Check similar titles (fuzzy matching)
      if (news.title && item.title) {
        const similarity = this.calculateSimilarity(news.title.toLowerCase(), item.title.toLowerCase());
        return similarity > 0.85; // 85% similarity threshold
      }

      return false;
    });

    if (exists) {
      return false; // Skip duplicate articles
    }

    // Gather up to 5 image hotlinks (prefer enclosure first)
    const enclosureUrl = item.enclosure?.url;
    const extracted = this.extractImageUrls(item.contentEncoded || item.content || item.contentSnippet, item.mediaContent, item.mediaThumbnail);
    const candidateUrls: string[] = [];
    if (enclosureUrl) candidateUrls.push(enclosureUrl);
    for (const u of extracted) if (!candidateUrls.includes(u)) candidateUrls.push(u);

    // Hotlink-first: choose first candidate without strict network checks
    let chosenImageUrl: string | null = candidateUrls[0] || null;

    // If no candidates, try scraping og:image from article page
    if (!chosenImageUrl) {
      const og = await this.fetchOgImageUrl(item.link);
      if (og) chosenImageUrl = og;
    }

    // Final fallback: download first candidate if present but broken, otherwise try downloading og image
    if (!chosenImageUrl && candidateUrls.length) {
      const local = await this.downloadAndStoreImage(candidateUrls[0]);
      if (local) chosenImageUrl = local;
    }

    const cleanedContent = this.cleanContent(item.content || item.contentSnippet, item.contentEncoded);
    const summary = this.generateSummary(cleanedContent);

    const newsData: InsertNews = {
      title: item.title.trim(),
      summary: summary,
      content: cleanedContent || 'เนื้อหาจาก RSS Feed',
      category: this.determineCategory(feedCategory, item.categories),
      imageUrl: chosenImageUrl,
      sourceUrl: item.link || null,
      rssFeedId: feedId,
      isBreaking: this.isBreakingNews(item.title)
    };

    await storage.insertNews(newsData);
    return true; // Article was added
  }

  // Determine if news is breaking based on title keywords
  private isBreakingNews(title: string): boolean {
    const breakingKeywords = [
      'ด่วน', 'เร่งด่วน', 'แบบเร่งด่วน', 'เหตุการณ์ด่วน', 'ข่าวด่วน',
      'สำคัญ', 'เหตุการณ์สำคัญ', 'ประกาศ', 'แจ้งข่าว', 'breaking',
      'เกิดเหตุ', 'อุบัติเหตุ', 'เพลิงไหม้', 'น้ำท่วม', 'แผ่นดินไหว',
      'วิกฤต', 'ฉุกเฉิน', 'เตือน', 'อันตราย', 'urgent',
      'ลาออก', 'ตาย', 'เสียชีวิต', 'จับกุม', 'ตร.', 'ชนเผ่า'
    ];

    return breakingKeywords.some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Process all active RSS feeds
  async processAllFeeds(): Promise<void> {
    if (this.isProcessing) {
      console.log('RSS processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('Starting RSS feed processing...');

    try {
      const feeds = await storage.getAllRssFeeds();
      const activeFeeds = feeds.filter(feed => feed.isActive);

      if (activeFeeds.length === 0) {
        console.log('No active RSS feeds found');
        this.isProcessing = false; // Ensure flag is reset
        return;
      }

      let totalProcessed = 0;

      // Process feeds in parallel for faster performance
      const feedPromises = activeFeeds.map(async (feed, index) => {
        try {
          // Stagger requests to avoid overwhelming servers
          await new Promise(resolve => setTimeout(resolve, index * 500));
          const count = await this.processFeed(feed.id, feed.url, feed.category);
          return count;
        } catch (error) {
          console.error(`Failed to process feed ${feed.title}:`, error);
          // Record the error in feed status if not already done by processFeed
          if (!this.feedStatus[feed.id] || !this.feedStatus[feed.id].lastError) {
             this.feedStatus[feed.id] = { isProcessing: false, lastError: error instanceof Error ? error.message : 'Unknown error' };
          }
          return 0;
        }
      });

      const results = await Promise.allSettled(feedPromises);
      totalProcessed = results.reduce((sum, result) => {
        return sum + (result.status === 'fulfilled' ? result.value : 0);
      }, 0);

      console.log(`RSS processing complete. Total articles processed across all feeds: ${totalProcessed}`);
    } catch (error) {
      console.error('Error in overall RSS feed processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Get processing status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      lastProcessed: Object.fromEntries(this.lastProcessed),
      autoProcessingEnabled: this.intervalId !== null,
      feedStatuses: this.feedStatus // Include status for individual feeds
    };
  }

  // Start automatic RSS processing every 30 minutes
  startAutoProcessing() {
    if (this.intervalId) {
      console.log('Auto RSS processing is already running');
      return;
    }

    console.log('Starting automatic RSS processing every 15 minutes...');

    // Process immediately on start
    this.processAllFeeds().catch(error => {
      console.error('Error in initial RSS processing:', error);
    });

    // Set up interval for every 15 minutes for faster updates (15 * 60 * 1000 ms)
    this.intervalId = setInterval(() => {
      console.log('Starting scheduled RSS processing...');
      this.processAllFeeds().catch(error => {
        console.error('Error in scheduled RSS processing:', error);
      });
    }, 15 * 60 * 1000);
  }

  // Stop automatic RSS processing
  stopAutoProcessing() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Stopped automatic RSS processing');
    }
  }
}

export const rssService = new RSSService();