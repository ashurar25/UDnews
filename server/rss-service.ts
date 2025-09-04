import Parser from 'rss-parser';
import { parse } from 'node-html-parser';
import { storage } from './storage';
import { type InsertNews } from '@shared/schema';
import { ImageOptimizer } from './image-optimizer';

// Environment-based tuning knobs to control memory usage
const RSS_MAX_CONCURRENT = Math.max(1, parseInt(process.env.RSS_MAX_CONCURRENT || '2'));
const RSS_BATCH_DELAY_MS = Math.max(0, parseInt(process.env.RSS_BATCH_DELAY_MS || '1500'));
const RSS_CONTENT_IMAGE_LIMIT = Math.max(0, parseInt(process.env.RSS_CONTENT_IMAGE_LIMIT || '1'));
const RSS_GC_BETWEEN_ITEMS = (process.env.RSS_GC_BETWEEN_ITEMS || 'true').toLowerCase() !== 'false';

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
    let buffer: Buffer | null = null;
    try {
      // Add size limit check via HEAD request first
      try {
        const headRes = await this.fetchWithRetry(imageUrl, { 
          method: 'HEAD', 
          headers: { 'User-Agent': 'UD-News-Image-Fetcher/1.0' } 
        }, 1, 8000);
        
        if (headRes.ok) {
          const contentLength = headRes.headers.get('content-length');
          if (contentLength) {
            const size = parseInt(contentLength);
            // Reject images larger than 10MB to prevent memory issues
            if (size > 10 * 1024 * 1024) {
              console.warn(`Image too large (${Math.round(size/1024/1024)}MB), skipping:`, imageUrl);
              return null;
            }
          }
        }
      } catch {
        // HEAD request failed, continue with GET but be more cautious
      }

      const res = await this.fetchWithRetry(imageUrl, { 
        headers: { 'User-Agent': 'UD-News-Image-Fetcher/1.0' } 
      }, 2, 15000); // Reduced retries and timeout
      
      if (!res.ok) return null;
      
      const contentType = res.headers.get('content-type') || '';
      
      // Validate content type
      if (!contentType.startsWith('image/')) {
        console.warn('Invalid content type for image:', contentType, imageUrl);
        return null;
      }

      // Stream the response to avoid loading entire image into memory at once
      const reader = res.body?.getReader();
      if (!reader) {
        console.warn('No readable stream for image:', imageUrl);
        return null;
      }

      const chunks: Uint8Array[] = [];
      let totalSize = 0;
      const maxSize = 10 * 1024 * 1024; // 10MB limit

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          totalSize += value.length;
          if (totalSize > maxSize) {
            console.warn(`Image stream exceeded size limit (${Math.round(totalSize/1024/1024)}MB), aborting:`, imageUrl);
            return null;
          }
          
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      // Combine chunks into buffer
      buffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
      
      // Clear chunks array to free memory
      chunks.length = 0;

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
    } finally {
      // Explicitly clear buffer to help GC
      if (buffer) {
        buffer = null;
      }
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

  // Clean and format content but PRESERVE <img> and basic HTML
  private cleanContent(content: string | undefined, contentEncoded?: string): string {
    let html = contentEncoded || content || '';

    try {
      const root = parse(html);
      // Remove unsafe/irrelevant tags
      root.querySelectorAll('script, style, iframe, noscript').forEach(n => n.remove());
      // Basic sanitization on images/links
      root.querySelectorAll('img').forEach(img => {
        // keep src/data-src attributes; drop event handlers
        const attrs = (img as any).attributes as Record<string, string>;
        Object.keys(attrs || {}).forEach((attrName) => {
          if (/^on/i.test(attrName)) img.removeAttribute(attrName);
        });
      });
      html = root.toString();
    } catch (error) {
      // If HTML parsing fails, keep as-is after minimal cleanup
    }

    // Decode entities and normalize whitespace
    html = html
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, '...')
      .replace(/&#8211;/g, '-')
      .replace(/&#8212;/g, '—')
      .replace(/\s+$/g, '')
      .trim();

    return html;
  }

  // Generate summary from content
  private generateSummary(content: string): string {
    if (!content || content.length < 50) {
      return content || 'ไม่มีเนื้อหาสรุป';
    }

    // Strip HTML before generating summary
    const textOnly = content.replace(/<[^>]*>/g, ' ');
    // Split by sentences (Thai and English)
    const sentences = textOnly.split(/[.!?。]/).filter(s => s.trim().length > 10);

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
    // Build a normalized haystack from item categories and feed category
    const haystack = (
      (Array.isArray(itemCategories) ? itemCategories.join(' ') : '') + ' ' + (feedCategory || '')
    ).toLowerCase();

    // Source-specific and extended mappings (helps map TNN labels to Thai)
    const mapping: Array<{ keys: string[]; to: string }> = [
      { keys: ['politics', 'government', 'การเมือง', 'รัฐบาล'], to: 'การเมือง' },
      { keys: ['sport', 'sports', 'football', 'soccer', 'กีฬา', 'ฟุตบอล'], to: 'กีฬา' },
      { keys: ['business', 'economy', 'เศรษฐกิจ', 'ธุรกิจ', 'investment', 'การลงทุน', 'stock', 'หุ้น'], to: 'เศรษฐกิจ' },
      { keys: ['technology', 'tech', 'เทคโนโลยี', 'ไอที', 'digital', 'ดิจิทัล'], to: 'เทคโนโลยี' },
      { keys: ['health', 'medical', 'สุขภาพ', 'การแพทย์', 'covid', 'โควิด', 'coronavirus'], to: 'สุขภาพ' },
      { keys: ['education', 'school', 'การศึกษา', 'โรงเรียน'], to: 'การศึกษา' },
      { keys: ['entertainment', 'celebrity', 'บันเทิง', 'ดารา'], to: 'บันเทิง' },
      { keys: ['world', 'international', 'ต่างประเทศ'], to: 'ต่างประเทศ' },
      { keys: ['crime', 'อาชญากรรม'], to: 'อาชญากรรม' },
      { keys: ['environment', 'สิ่งแวดล้อม'], to: 'สิ่งแวดล้อม' },
      { keys: ['science', 'sci', 'วิทยาศาสตร์'], to: 'วิทยาศาสตร์' },
      { keys: ['life', 'lifestyle', 'ไลฟ์สไตล์'], to: 'ไลฟ์สไตล์' },
      { keys: ['regional', 'region', 'ภูมิภาค', 'ภาค'], to: 'ภูมิภาค' },
      { keys: ['bangkok', 'กรุงเทพ'], to: 'กรุงเทพฯ' },
      { keys: ['traffic', 'จราจร'], to: 'จราจร' },
      { keys: ['weather', 'พยากรณ์', 'อากาศ'], to: 'สภาพอากาศ' },
      { keys: ['auto', 'motor', 'car', 'ยานยนต์'], to: 'ยานยนต์' },
      { keys: ['energy', 'พลังงาน'], to: 'พลังงาน' },
      { keys: ['tourism', 'travel', 'ท่องเที่ยว'], to: 'ท่องเที่ยว' },
      { keys: ['social', 'สังคม'], to: 'สังคม' },
      { keys: ['local', 'ท้องถิ่น', 'จังหวัด', 'อุดรธานี'], to: 'ข่าวท้องถิ่น' },
    ];

    for (const m of mapping) {
      if (m.keys.some(k => haystack.includes(k))) {
        return m.to;
      }
    }

    // Backward-compatible generic rule (use first item category if exists)
    if (itemCategories && itemCategories.length > 0) {
      const category = itemCategories[0].toLowerCase();
      if (category) return category;
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

    // Check if this article already exists (prefer precise, then limited fuzzy)
    // 1) Fast path: exact URL match via DB
    const byUrl = await storage.getNewsByUrl(item.link);
    let exists = !!byUrl;
    // 2) If not found by URL, only fetch a LIMITED set of recent news to compare titles
    if (!exists) {
      const recent = await storage.getAllNews(200, 0); // Limit to latest 200 to keep memory low
      exists = recent.some(news => {
        if (!news.title) return false;
        const similarity = this.calculateSimilarity(news.title.toLowerCase(), item.title!.toLowerCase());
        return similarity > 0.85; // 85% similarity threshold
      });
    }

    if (exists) {
      return false; // Skip duplicate articles
    }

    // First, clean the content (preserve <img>)
    const cleanedContent = this.cleanContent(item.content || item.contentSnippet, item.contentEncoded);
    
    // Extract all image URLs from the cleaned content
    const contentImageUrls: string[] = [];
    try {
      const root = parse(cleanedContent);
      const imgElements = root.querySelectorAll('img');
      for (const img of imgElements) {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        if (src && !contentImageUrls.includes(src)) {
          contentImageUrls.push(src);
        }
      }
    } catch (error) {
      console.error('Error parsing content for images:', error);
    }

    // Gather up to 5 image hotlinks (prefer enclosure first, then content images, then other sources)
    const enclosureUrl = item.enclosure?.url;
    const extracted = this.extractImageUrls(item.contentEncoded || item.content || item.contentSnippet, item.mediaContent, item.mediaThumbnail);
    
    // Combine all candidate URLs with priority: enclosure > content images > other extracted images
    const candidateUrls: string[] = [];
    if (enclosureUrl) candidateUrls.push(enclosureUrl);
    // Add content images next
    for (const u of contentImageUrls) if (!candidateUrls.includes(u)) candidateUrls.push(u);
    // Add other extracted images
    for (const u of extracted) if (!candidateUrls.includes(u)) candidateUrls.push(u);

    // Try to find a working image URL
    let chosenImageUrl: string | null = null;
    
    // First try enclosure or first content image
    const primaryCandidate = candidateUrls[0];
    if (primaryCandidate) {
      const isAvailable = await this.checkUrlOk(primaryCandidate);
      if (isAvailable) {
        chosenImageUrl = primaryCandidate;
      } else {
        // Try to download and store the image
        const localUrl = await this.downloadAndStoreImage(primaryCandidate);
        if (localUrl) chosenImageUrl = localUrl;
      }
    }

    // If still no image, try scraping og:image from article page
    if (!chosenImageUrl) {
      const og = await this.fetchOgImageUrl(item.link);
      if (og) {
        const isAvailable = await this.checkUrlOk(og);
        if (isAvailable) {
          chosenImageUrl = og;
        } else {
          const localUrl = await this.downloadAndStoreImage(og);
          if (localUrl) chosenImageUrl = localUrl;
        }
      }
    }

    // Generate summary from cleaned content (without images)
    const summary = this.generateSummary(cleanedContent);
    
    // Process the content to ensure images are properly formatted and hosted
    let processedContent = cleanedContent;
    let processedImageUrls: string[] = [];
    
    // If we have content images, ensure they're properly hosted (limited by RSS_CONTENT_IMAGE_LIMIT)
    if (contentImageUrls.length > 0 && RSS_CONTENT_IMAGE_LIMIT > 0) {
      try {
        const root = parse(cleanedContent);
        const imgElements = root.querySelectorAll('img');
        
        let downloaded = 0;
        for (const img of imgElements) {
          const src = img.getAttribute('src') || img.getAttribute('data-src');
          if (src) {
            // Download and replace with local URL if needed
            const localUrl = await this.downloadAndStoreImage(src);
            if (localUrl) {
              img.setAttribute('src', localUrl);
              img.removeAttribute('data-src');
              // Add responsive image classes
              img.setAttribute('class', 'max-w-full h-auto rounded-lg my-4');
              img.setAttribute('loading', 'lazy');
              img.setAttribute('alt', item.title || 'News image');
              if (!processedImageUrls.includes(localUrl) && processedImageUrls.length < 5) processedImageUrls.push(localUrl);
              downloaded++;
              if (downloaded >= RSS_CONTENT_IMAGE_LIMIT) {
                // Stop downloading more to limit memory/IO
                break;
              }
            }
          }
        }
        
        // Update the processed content with optimized images
        processedContent = root.toString();
      } catch (error) {
        console.error('Error processing images in content:', error);
      }
    }

    // If we still have no processedImageUrls, try to collect from final content
    if (processedImageUrls.length === 0) {
      try {
        const root = parse(processedContent);
        const imgs = root.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src');
          if (src && !processedImageUrls.includes(src)) processedImageUrls.push(src);
          if (processedImageUrls.length >= 5) break;
        }
      } catch {}
    }

    const newsData: InsertNews = {
      title: item.title.trim(),
      summary: summary,
      content: processedContent || 'เนื้อหาจาก RSS Feed',
      category: this.determineCategory(feedCategory, item.categories),
      imageUrl: chosenImageUrl,
      imageUrls: processedImageUrls.length > 0 ? processedImageUrls : undefined,
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

      // Process feeds with controlled concurrency to prevent memory issues
      const maxConcurrent = RSS_MAX_CONCURRENT; // Limit concurrent feed processing via env
      const results: number[] = [];
      
      for (let i = 0; i < activeFeeds.length; i += maxConcurrent) {
        const batch = activeFeeds.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (feed, batchIndex) => {
          try {
            // Stagger requests within batch to avoid overwhelming servers
            await new Promise(resolve => setTimeout(resolve, batchIndex * 500));
            const count = await this.processFeed(feed.id, feed.url, feed.category);
            // Optionally GC between items
            if (RSS_GC_BETWEEN_ITEMS && global.gc) {
              try { global.gc(); } catch {}
            }
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
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map(result => result.status === 'fulfilled' ? result.value : 0));
        
        // Force garbage collection between batches if available
        if (global.gc) {
          global.gc();
        }
        
        // Small delay between batches to allow memory cleanup
        if (i + maxConcurrent < activeFeeds.length) {
          await new Promise(resolve => setTimeout(resolve, RSS_BATCH_DELAY_MS));
        }
      }
      
      const feedPromises = Promise.resolve(results);

      const batchResults = await feedPromises;
      totalProcessed = batchResults.reduce((sum, count) => sum + count, 0);

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