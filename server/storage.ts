import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { users, rssFeeds, newsArticles, sponsorBanners, rssProcessingHistory, type InsertUser, type User, type InsertRssFeed, type RssFeed, type InsertNews, type NewsArticle, type InsertSponsorBanner, type SponsorBanner, type InsertRssHistory, type RssProcessingHistory } from "@shared/schema";
import { eq } from "drizzle-orm";
import ws from "ws";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllRssFeeds(): Promise<RssFeed[]>;
  getRssFeedById(id: number): Promise<RssFeed | null>;
  insertRssFeed(feed: InsertRssFeed): Promise<RssFeed>;
  updateRssFeed(id: number, feed: Partial<InsertRssFeed>): Promise<RssFeed | null>;
  updateRssFeedLastProcessed(id: number): Promise<boolean>;
  deleteRssFeed(id: number): Promise<boolean>;
  getAllNews(): Promise<NewsArticle[]>;
  getNewsById(id: number): Promise<NewsArticle | null>;
  insertNews(news: InsertNews): Promise<NewsArticle>;
  updateNews(id: number, news: Partial<InsertNews>): Promise<NewsArticle | null>;
  deleteNews(id: number): Promise<boolean>;
  getAllSponsorBanners(): Promise<SponsorBanner[]>;
  getSponsorBannersByPosition(position: string): Promise<SponsorBanner[]>;
  getSponsorBannerById(id: number): Promise<SponsorBanner | null>;
  insertSponsorBanner(banner: InsertSponsorBanner): Promise<SponsorBanner>;
  updateSponsorBanner(id: number, banner: Partial<InsertSponsorBanner>): Promise<SponsorBanner | null>;
  deleteSponsorBanner(id: number): Promise<boolean>;
  incrementBannerClick(id: number): Promise<boolean>;
  insertRssHistory(history: InsertRssHistory): Promise<RssProcessingHistory>;
  getRssHistoryByFeedId(feedId: number): Promise<RssProcessingHistory[]>;
  getAllRssHistory(): Promise<RssProcessingHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rssFeeds: Map<number, RssFeed>;
  private news: Map<number, NewsArticle>;
  private sponsorBanners: Map<number, SponsorBanner>;
  private rssHistory: Map<number, RssProcessingHistory>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.rssFeeds = new Map();
    this.news = new Map();
    this.sponsorBanners = new Map();
    this.rssHistory = new Map();
    this.currentId = 1;
    
    // Add some sample data for demonstration
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample RSS feeds
    const sampleRssFeeds = [
      {
        title: "BBC Thai",
        url: "https://feeds.bbci.co.uk/thai/rss.xml",
        description: "ข่าวจาก BBC ภาษาไทย",
        category: "ข่าวทั่วไป",
        isActive: true
      },
      {
        title: "Voice TV",
        url: "https://www.voicetv.co.th/rss/news.xml",
        description: "ข่าวจาก Voice TV",
        category: "ข่าวทั่วไป", 
        isActive: true
      },
      {
        title: "Manager Online",
        url: "https://www.manager.co.th/RSS/AllRSS.aspx",
        description: "ข่าวจาก Manager Online",
        category: "ข่าวทั่วไป",
        isActive: true
      }
    ];

    sampleRssFeeds.forEach((feed) => {
      const id = this.currentId++;
      const now = new Date();
      const rssFeed = {
        ...feed,
        id,
        description: feed.description || null,
        lastProcessed: null,
        createdAt: now,
        updatedAt: now
      };
      this.rssFeeds.set(id, rssFeed);
    });

    // Add sample news articles
    const sampleNews = [
      {
        title: "นายกเทศมนตรีอุดรธานีเปิดโครงการพัฒนาเมือง",
        summary: "นายกเทศมนตรีอุดรธานีเปิดโครงการพัฒนาโครงสร้างพื้นฐานเมืองเพื่อรองรับการเติบโตทางเศรษฐกิจ",
        content: "เมื่อวันที่ 8 มกราคม 2567 นายกเทศมนตรีอุดรธานีได้เปิดโครงการพัฒนาโครงสร้างพื้นฐานเมืองขนาดใหญ่ เพื่อรองรับการเติบโตทางเศรษฐกิจและการท่องเที่ยวในพื้นที่ โครงการนี้มีมูลค่าการลงทุนกว่า 500 ล้านบาท จะใช้เวลาดำเนินการ 2 ปี คาดว่าจะช่วยสร้างงานให้กับประชาชนในพื้นที่และพัฒนาคุณภาพชีวิตของคนในเมือง",
        category: "ข่าวท้องถิ่น",
        imageUrl: null,
        isBreaking: false
      },
      {
        title: "การประชุมสภาเทศบาลครั้งสำคัญวันนี้",
        summary: "สภาเทศบาลอุดรธานีจัดการประชุมพิเศษเพื่อพิจารณาญัตติสำคัญหลายเรื่อง",
        content: "วันนี้ สภาเทศบาลนครอุดรธานีจัดการประชุมพิเศษเพื่อพิจารณาญัตติสำคัญ ได้แก่ การอนุมัติงบประมาณโครงการพัฒนาสวนสาธารณะแห่งใหม่ และการปรับปรุงระบบไฟฟ้าสาธารณะทั่วเมือง การประชุมเริ่มเวลา 14.00 น. โดยมีสมาชิกสภาเข้าร่วมครบองค์ประชุม",
        category: "ข่าวท้องถิ่น",
        imageUrl: null,
        isBreaking: false
      },
      {
        title: "เทศกาลดอกบัวแดงอุดรธานีปีนี้คึกคัก",
        summary: "งานเทศกาลดอกบัวแดงประจำปี 2567 ณ บึงพระราม จังหวัดอุดรธานี คาดมีนักท่องเที่ยวหลายแสนคน",
        content: "เทศกาลดอกบัวแดงประจำปี 2567 ที่บึงพระราม จังหวัดอุดรธานี กำลังจะเปิดการจัดงานในวันที่ 15-31 มกราคม 2567 โดยปีนี้คาดว่าจะมีนักท่องเที่ยวมาร่วมงานกว่า 300,000 คน มีกิจกรรมหลากหลายตลอดงาน ทั้งการแสดงดนตรี การแสดงวัฒนธรรมท้องถิ่น และจำหน่ายสินค้าโอทอปจากชุมชน",
        category: "ข่าวท้องถิ่น",
        imageUrl: null,
        isBreaking: false
      }
    ];

    sampleNews.forEach((article, index) => {
      const id = this.currentId++;
      const now = new Date();
      const newsArticle = {
        ...article,
        id,
        imageUrl: article.imageUrl || null,
        sourceUrl: null,
        rssFeedId: null,
        createdAt: new Date(now.getTime() - (index * 1000 * 60 * 60)), // Spread over hours
        updatedAt: new Date(now.getTime() - (index * 1000 * 60 * 60))
      };
      this.news.set(id, newsArticle);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // RSS Feeds methods
  async getAllRssFeeds(): Promise<RssFeed[]> {
    return Array.from(this.rssFeeds.values());
  }

  async getRssFeedById(id: number): Promise<RssFeed | null> {
    return this.rssFeeds.get(id) || null;
  }

  async insertRssFeed(feed: InsertRssFeed): Promise<RssFeed> {
    const id = this.currentId++;
    const now = new Date();
    const rssFeed: RssFeed = { 
      ...feed, 
      id, 
      description: feed.description ?? null,
      isActive: feed.isActive ?? true,
      lastProcessed: null,
      createdAt: now,
      updatedAt: now
    };
    this.rssFeeds.set(id, rssFeed);
    return rssFeed;
  }

  async updateRssFeed(id: number, feed: Partial<InsertRssFeed>): Promise<RssFeed | null> {
    const existing = this.rssFeeds.get(id);
    if (!existing) return null;
    const updated = { 
      ...existing, 
      ...feed, 
      description: feed.description ?? existing.description,
      updatedAt: new Date()
    };
    this.rssFeeds.set(id, updated);
    return updated;
  }

  async updateRssFeedLastProcessed(id: number): Promise<boolean> {
    const existing = this.rssFeeds.get(id);
    if (!existing) return false;
    const updated = {
      ...existing,
      lastProcessed: new Date(),
      updatedAt: new Date()
    };
    this.rssFeeds.set(id, updated);
    return true;
  }

  async deleteRssFeed(id: number): Promise<boolean> {
    return this.rssFeeds.delete(id);
  }

  // News methods
  async getAllNews(): Promise<NewsArticle[]> {
    return Array.from(this.news.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getNewsById(id: number): Promise<NewsArticle | null> {
    return this.news.get(id) || null;
  }

  async insertNews(newsData: InsertNews): Promise<NewsArticle> {
    const id = this.currentId++;
    const now = new Date();
    const newsArticle: NewsArticle = { 
      ...newsData, 
      id, 
      imageUrl: newsData.imageUrl || null,
      sourceUrl: newsData.sourceUrl || null,
      rssFeedId: newsData.rssFeedId || null,
      isBreaking: newsData.isBreaking ?? false,
      createdAt: now,
      updatedAt: now
    };
    this.news.set(id, newsArticle);
    return newsArticle;
  }

  async updateNews(id: number, newsData: Partial<InsertNews>): Promise<NewsArticle | null> {
    const existing = this.news.get(id);
    if (!existing) return null;
    const updated = { 
      ...existing, 
      ...newsData, 
      imageUrl: newsData.imageUrl ?? existing.imageUrl,
      sourceUrl: newsData.sourceUrl ?? existing.sourceUrl,
      rssFeedId: newsData.rssFeedId ?? existing.rssFeedId,
      updatedAt: new Date()
    };
    this.news.set(id, updated);
    return updated;
  }

  async deleteNews(id: number): Promise<boolean> {
    return this.news.delete(id);
  }

  // Sponsor Banner methods
  async getAllSponsorBanners(): Promise<SponsorBanner[]> {
    return Array.from(this.sponsorBanners.values())
      .filter(banner => banner.isActive)
      .filter(banner => {
        if (!banner.endDate) return true;
        return new Date() <= new Date(banner.endDate);
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getSponsorBannersByPosition(position: string): Promise<SponsorBanner[]> {
    return Array.from(this.sponsorBanners.values())
      .filter(banner => banner.position === position && banner.isActive)
      .filter(banner => {
        if (!banner.endDate) return true;
        return new Date() <= new Date(banner.endDate);
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getSponsorBannerById(id: number): Promise<SponsorBanner | null> {
    return this.sponsorBanners.get(id) || null;
  }

  async insertSponsorBanner(bannerData: InsertSponsorBanner): Promise<SponsorBanner> {
    const id = this.currentId++;
    const now = new Date();
    const banner: SponsorBanner = {
      ...bannerData,
      id,
      isActive: bannerData.isActive ?? true,
      displayOrder: bannerData.displayOrder ?? 0,
      startDate: bannerData.startDate ?? now,
      endDate: bannerData.endDate || null,
      clickCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.sponsorBanners.set(id, banner);
    return banner;
  }

  async updateSponsorBanner(id: number, bannerData: Partial<InsertSponsorBanner>): Promise<SponsorBanner | null> {
    const existing = this.sponsorBanners.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...bannerData,
      endDate: bannerData.endDate === undefined ? existing.endDate : bannerData.endDate,
      updatedAt: new Date()
    };
    this.sponsorBanners.set(id, updated);
    return updated;
  }

  async deleteSponsorBanner(id: number): Promise<boolean> {
    return this.sponsorBanners.delete(id);
  }

  async incrementBannerClick(id: number): Promise<boolean> {
    const banner = this.sponsorBanners.get(id);
    if (!banner) return false;
    banner.clickCount++;
    this.sponsorBanners.set(id, banner);
    return true;
  }

  // RSS History methods
  async insertRssHistory(historyData: InsertRssHistory): Promise<RssProcessingHistory> {
    const id = this.currentId++;
    const now = new Date();
    const history: RssProcessingHistory = {
      ...historyData,
      id,
      processedAt: now,
      errorMessage: historyData.errorMessage || null
    };
    this.rssHistory.set(id, history);
    return history;
  }

  async getRssHistoryByFeedId(feedId: number): Promise<RssProcessingHistory[]> {
    return Array.from(this.rssHistory.values())
      .filter(h => h.rssFeedId === feedId)
      .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
  }

  async getAllRssHistory(): Promise<RssProcessingHistory[]> {
    return Array.from(this.rssHistory.values())
      .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
  }
}

export const storage = new MemStorage();