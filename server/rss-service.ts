import Parser from 'rss-parser';
import { parse } from 'node-html-parser';
import { storage } from './storage';
import { type InsertNews } from '@shared/schema';

const parser = new Parser({
  timeout: 10000,
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
}

export class RSSService {
  private isProcessing = false;
  private lastProcessed = new Map<number, Date>();

  // Extract image URL from content
  private extractImageUrl(content: string | undefined, mediaContent?: any, mediaThumbnail?: any): string | undefined {
    // Try media content first
    if (mediaContent && mediaContent.$ && mediaContent.$.url) {
      return mediaContent.$.url;
    }

    // Try media thumbnail
    if (mediaThumbnail && mediaThumbnail.$ && mediaThumbnail.$.url) {
      return mediaThumbnail.$.url;
    }

    if (!content) return undefined;

    // Parse HTML content to find images
    try {
      const root = parse(content);
      const img = root.querySelector('img');
      if (img) {
        const src = img.getAttribute('src');
        if (src && (src.startsWith('http') || src.startsWith('//'))) {
          return src.startsWith('//') ? `https:${src}` : src;
        }
      }
    } catch (error) {
      console.error('Error parsing HTML content:', error);
    }

    return undefined;
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
      .trim();

    return text;
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

  // Process a single RSS feed
  async processFeed(feedId: number, feedUrl: string, category: string): Promise<number> {
    try {
      console.log(`Processing RSS feed: ${feedUrl}`);
      
      const feed = await parser.parseURL(feedUrl);
      let addedCount = 0;

      if (!feed.items || feed.items.length === 0) {
        console.log(`No items found in feed: ${feedUrl}`);
        return 0;
      }

      // Process each item in the feed
      for (const item of feed.items) {
        try {
          await this.processRSSItem(item as RSSItem, category, feedId);
          addedCount++;
        } catch (error) {
          console.error(`Error processing RSS item from ${feedUrl}:`, error);
        }
      }

      this.lastProcessed.set(feedId, new Date());
      console.log(`Successfully processed ${addedCount} items from ${feedUrl}`);
      return addedCount;

    } catch (error) {
      console.error(`Error processing RSS feed ${feedUrl}:`, error);
      throw error;
    }
  }

  // Process a single RSS item
  private async processRSSItem(item: RSSItem, feedCategory: string, feedId: number): Promise<void> {
    if (!item.title || !item.link) {
      return; // Skip items without title or link
    }

    // Check if this article already exists (by link)
    const existingNews = await storage.getAllNews();
    const exists = existingNews.some((news: any) => 
      news.title === item.title || 
      (item.link && news.content.includes(item.link))
    );

    if (exists) {
      return; // Skip duplicate articles
    }

    const imageUrl = this.extractImageUrl(
      item.content || item.contentSnippet, 
      item.mediaContent, 
      item.mediaThumbnail
    );

    const cleanedContent = this.cleanContent(item.content || item.contentSnippet, item.contentEncoded);
    const summary = this.generateSummary(cleanedContent);

    const newsData: InsertNews = {
      title: item.title.trim(),
      summary: summary,
      content: cleanedContent || 'เนื้อหาจาก RSS Feed',
      category: this.determineCategory(feedCategory, item.categories),
      imageUrl: imageUrl || null,
      isBreaking: this.isBreakingNews(item.title)
    };

    await storage.insertNews(newsData);
  }

  // Generate a summary from content
  private generateSummary(content: string): string {
    if (!content) return 'สรุปข่าวจาก RSS Feed';

    // Take first 150 characters and ensure it ends properly
    let summary = content.substring(0, 150);
    
    // Try to end at a sentence boundary
    const lastPeriod = summary.lastIndexOf('.');
    const lastSpace = summary.lastIndexOf(' ');
    
    if (lastPeriod > 100) {
      summary = summary.substring(0, lastPeriod + 1);
    } else if (lastSpace > 100) {
      summary = summary.substring(0, lastSpace) + '...';
    } else {
      summary = summary + '...';
    }

    return summary.trim();
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
        return;
      }

      let totalProcessed = 0;
      
      for (const feed of activeFeeds) {
        try {
          const count = await this.processFeed(feed.id, feed.url, feed.category);
          totalProcessed += count;
          
          // Add delay between feeds to be respectful
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Failed to process feed ${(feed as any).title}:`, error);
        }
      }

      console.log(`RSS processing complete. Total articles processed: ${totalProcessed}`);
    } catch (error) {
      console.error('Error in RSS processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Get processing status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      lastProcessed: Object.fromEntries(this.lastProcessed)
    };
  }
}

export const rssService = new RSSService();