import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { users, rssFeeds, newsArticles, sponsorBanners, type InsertUser, type User, type InsertRssFeed, type RssFeed, type InsertNews, type NewsArticle, type InsertSponsorBanner, type SponsorBanner } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rssFeeds: Map<number, RssFeed>;
  private news: Map<number, NewsArticle>;
  private sponsorBanners: Map<number, SponsorBanner>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.rssFeeds = new Map();
    this.news = new Map();
    this.sponsorBanners = new Map();
    this.currentId = 1;
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
    const rssFeed: RssFeed = { 
      ...feed, 
      id, 
      description: feed.description ?? null,
      isActive: feed.isActive ?? true
    };
    this.rssFeeds.set(id, rssFeed);
    return rssFeed;
  }

  async updateRssFeed(id: number, feed: Partial<InsertRssFeed>): Promise<RssFeed | null> {
    const existing = this.rssFeeds.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...feed, description: feed.description ?? existing.description };
    this.rssFeeds.set(id, updated);
    return updated;
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
}

export const storage = new MemStorage();