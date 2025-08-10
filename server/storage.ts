import { users, rssFeeds, newsArticles, sponsorBanners, rssProcessingHistory, siteSettings, contactMessages, newsViews, dailyStats, comments, newsletterSubscribers, pushSubscriptions, newsRatings, type InsertUser, type User, type InsertRssFeed, type RssFeed, type InsertNews, type NewsArticle, type InsertSponsorBanner, type SponsorBanner, type InsertRssHistory, type RssProcessingHistory, type InsertSiteSetting, type SiteSetting, type InsertContactMessage, type ContactMessage, type NewsView, type DailyStats, type Comment, type InsertComment, type NewsletterSubscriber, type InsertNewsletterSubscriber, type PushSubscription, type InsertPushSubscription, type NewsRating, type InsertNewsRating } from "@shared/schema";
import { eq, sql, desc, and, or, ilike, gte, lte } from "drizzle-orm";
import { db, backupDb } from "./db";

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
  getDatabaseStats(): Promise<{
    newsCount: number;
    rssFeedsCount: number;
    sponsorBannersCount: number;
    contactMessagesCount: number;
    totalUsers: number;
    databaseProvider: string;
    databaseUrl: string;
  }>;
  getAllSiteSettings(): Promise<SiteSetting[]>;
  getSiteSettingByKey(key: string): Promise<SiteSetting | null>;
  insertSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting>;
  updateSiteSetting(key: string, value: string): Promise<SiteSetting | null>;
  deleteSiteSetting(key: string): Promise<boolean>;
  getAllContactMessages(): Promise<ContactMessage[]>;
  getContactMessageById(id: number): Promise<ContactMessage | null>;
  insertContactMessage(data: InsertContactMessage): Promise<ContactMessage>;
  markContactMessageAsRead(id: number): Promise<ContactMessage | null>;
  deleteContactMessage(id: number): Promise<boolean>;
  getUnreadContactMessagesCount(): Promise<number>;
  recordNewsView(newsId: number, ipAddress?: string, userAgent?: string, referrer?: string): Promise<NewsView>;
  getNewsViewCount(newsId: number): Promise<number>;
  getPopularNews(limit?: number): Promise<(typeof newsArticles.$inferSelect & { viewCount: number })[]>;
  getDailyStats(date: string): Promise<DailyStats | null>;
  updateDailyStats(date: string, totalViews: number, uniqueVisitors: number, popularNewsId?: number): Promise<DailyStats>;
  getAnalyticsSummary(): Promise<{
    totalViews: number;
    totalNews: number;
    todayViews: number;
    popularNews: any[];
  }>;
  backupToSecondaryDatabase(): Promise<{ success: boolean; message: string; }>;
  switchToPrimaryDatabase(): Promise<boolean>;
  switchToBackupDatabase(): Promise<boolean>;
}

// MemStorage class removed - using only PostgreSQL database storage

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllRssFeeds(): Promise<RssFeed[]> {
    return await db.select().from(rssFeeds);
  }

  async getRssFeedById(id: number): Promise<RssFeed | null> {
    const [feed] = await db.select().from(rssFeeds).where(eq(rssFeeds.id, id));
    return feed || null;
  }

  async insertRssFeed(feed: InsertRssFeed): Promise<RssFeed> {
    const [newFeed] = await db
      .insert(rssFeeds)
      .values(feed)
      .returning();
    return newFeed;
  }

  async updateRssFeed(id: number, feed: Partial<InsertRssFeed>): Promise<RssFeed | null> {
    const [updated] = await db
      .update(rssFeeds)
      .set({ ...feed, updatedAt: new Date() })
      .where(eq(rssFeeds.id, id))
      .returning();
    return updated || null;
  }

  async updateRssFeedLastProcessed(id: number): Promise<boolean> {
    const result = await db
      .update(rssFeeds)
      .set({ lastProcessed: new Date(), updatedAt: new Date() })
      .where(eq(rssFeeds.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteRssFeed(id: number): Promise<boolean> {
    const result = await db.delete(rssFeeds).where(eq(rssFeeds.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllNews(): Promise<NewsArticle[]> {
    return await db.select().from(newsArticles).orderBy(desc(newsArticles.createdAt));
  }

  async getNewsById(id: number): Promise<NewsArticle | null> {
    const [article] = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
    return article || null;
  }

  async insertNews(news: InsertNews): Promise<NewsArticle> {
    const [newArticle] = await db
      .insert(newsArticles)
      .values(news)
      .returning();
    return newArticle;
  }

  async updateNews(id: number, news: Partial<InsertNews>): Promise<NewsArticle | null> {
    const [updated] = await db
      .update(newsArticles)
      .set({ ...news, updatedAt: new Date() })
      .where(eq(newsArticles.id, id))
      .returning();
    return updated || null;
  }

  async deleteNews(id: number): Promise<boolean> {
    const result = await db.delete(newsArticles).where(eq(newsArticles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllSponsorBanners(): Promise<SponsorBanner[]> {
    return await db.select().from(sponsorBanners).where(eq(sponsorBanners.isActive, true));
  }

  async getSponsorBannersByPosition(position: string): Promise<SponsorBanner[]> {
    return await db.select().from(sponsorBanners)
      .where(eq(sponsorBanners.position, position as any))
      .orderBy(sponsorBanners.displayOrder);
  }

  async getSponsorBannerById(id: number): Promise<SponsorBanner | null> {
    const [banner] = await db.select().from(sponsorBanners).where(eq(sponsorBanners.id, id));
    return banner || null;
  }

  async insertSponsorBanner(banner: InsertSponsorBanner): Promise<SponsorBanner> {
    const [newBanner] = await db
      .insert(sponsorBanners)
      .values(banner)
      .returning();
    return newBanner;
  }

  async updateSponsorBanner(id: number, banner: Partial<InsertSponsorBanner>): Promise<SponsorBanner | null> {
    const [updated] = await db
      .update(sponsorBanners)
      .set({ ...banner, updatedAt: new Date() })
      .where(eq(sponsorBanners.id, id))
      .returning();
    return updated || null;
  }

  async deleteSponsorBanner(id: number): Promise<boolean> {
    const result = await db.delete(sponsorBanners).where(eq(sponsorBanners.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementBannerClick(id: number): Promise<boolean> {
    const result = await db
      .update(sponsorBanners)
      .set({ clickCount: sql`${sponsorBanners.clickCount} + 1` })
      .where(eq(sponsorBanners.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async insertRssHistory(history: InsertRssHistory): Promise<RssProcessingHistory> {
    const [newHistory] = await db
      .insert(rssProcessingHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  async getRssHistoryByFeedId(feedId: number): Promise<RssProcessingHistory[]> {
    return await db.select().from(rssProcessingHistory)
      .where(eq(rssProcessingHistory.rssFeedId, feedId))
      .orderBy(rssProcessingHistory.processedAt);
  }

  async getAllRssHistory(): Promise<RssProcessingHistory[]> {
    return await db.select().from(rssProcessingHistory).orderBy(rssProcessingHistory.processedAt);
  }

  // Contact Messages CRUD operations
  async getAllContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async getContactMessageById(id: number): Promise<ContactMessage | null> {
    const result = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
    return result[0] || null;
  }

  async insertContactMessage(data: InsertContactMessage): Promise<ContactMessage> {
    const result = await db.insert(contactMessages).values(data).returning();
    return result[0];
  }

  async markContactMessageAsRead(id: number): Promise<ContactMessage | null> {
    const result = await db
      .update(contactMessages)
      .set({
        isRead: true
      })
      .where(eq(contactMessages.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteContactMessage(id: number): Promise<boolean> {
    const result = await db.delete(contactMessages).where(eq(contactMessages.id, id)).returning();
    return result.length > 0;
  }

  async getUnreadContactMessagesCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactMessages)
      .where(eq(contactMessages.isRead, false));

    return result[0]?.count || 0;
  }

  // Analytics methods
  async recordNewsView(newsId: number, ipAddress?: string, userAgent?: string, referrer?: string): Promise<NewsView> {
    const [view] = await db
      .insert(newsViews)
      .values({
        newsId,
        ipAddress,
        userAgent,
        referrer
      })
      .returning();
    return view;
  }

  async getNewsViewCount(newsId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsViews)
      .where(eq(newsViews.newsId, newsId));

    return result[0]?.count || 0;
  }

  async getPopularNews(limit: number = 10): Promise<(typeof newsArticles.$inferSelect & { viewCount: number })[]> {
    const result = await db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        summary: newsArticles.summary,
        content: newsArticles.content,
        imageUrl: newsArticles.imageUrl,
        sourceUrl: newsArticles.sourceUrl,
        category: newsArticles.category,
        isBreaking: newsArticles.isBreaking,
        createdAt: newsArticles.createdAt,
        updatedAt: newsArticles.updatedAt,
        viewCount: sql<number>`count(${newsViews.id})`
      })
      .from(newsArticles)
      .leftJoin(newsViews, eq(newsArticles.id, newsViews.newsId))
      .groupBy(newsArticles.id)
      .orderBy(sql`count(${newsViews.id}) desc`)
      .limit(limit);

    return result;
  }

  async getDailyStats(date: string): Promise<DailyStats | null> {
    const [stats] = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, date));

    return stats || null;
  }

  async updateDailyStats(date: string, totalViews: number, uniqueVisitors: number, popularNewsId?: number): Promise<DailyStats> {
    const existing = await this.getDailyStats(date);

    if (existing) {
      const [updated] = await db
        .update(dailyStats)
        .set({
          totalViews,
          uniqueVisitors,
          popularNewsId
        })
        .where(eq(dailyStats.date, date))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(dailyStats)
        .values({
          date,
          totalViews,
          uniqueVisitors,
          popularNewsId
        })
        .returning();
      return created;
    }
  }

  async getAnalyticsSummary(): Promise<{
    totalViews: number;
    totalNews: number;
    todayViews: number;
    popularNews: any[];
  }> {
    const today = new Date().toISOString().split('T')[0];

    const [totalViewsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsViews);

    const [totalNewsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsArticles);

    const [todayViewsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsViews)
      .where(sql`DATE(${newsViews.viewedAt}) = ${today}`);

    const popularNews = await this.getPopularNews(5);

    return {
      totalViews: totalViewsResult?.count || 0,
      totalNews: totalNewsResult?.count || 0,
      todayViews: todayViewsResult?.count || 0,
      popularNews
    };
  }


  // Get database statistics
  async getDatabaseStats(): Promise<{
    newsCount: number;
    rssFeedsCount: number;
    sponsorBannersCount: number;
    contactMessagesCount: number;
    totalUsers: number;
    databaseProvider: string;
    databaseUrl: string;
  }> {
    const [newsCount, rssFeedsCount, sponsorBannersCount, contactMessagesCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(newsArticles),
      db.select({ count: sql<number>`count(*)` }).from(rssFeeds),
      db.select({ count: sql<number>`count(*)` }).from(sponsorBanners),
      db.select({ count: sql<number>`count(*)` }).from(contactMessages)
    ]);

    return {
      newsCount: newsCount[0]?.count || 0,
      rssFeedsCount: rssFeedsCount[0]?.count || 0,
      sponsorBannersCount: sponsorBannersCount[0]?.count || 0,
      contactMessagesCount: contactMessagesCount[0]?.count || 0,
      totalUsers: 0, // Placeholder since we don't have user management yet
      databaseProvider: "Render PostgreSQL + Neon Backup",
      databaseUrl: "Primary: Render | Backup: Neon",
    };
  }

  // Site Settings Methods
  async getAllSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings).where(eq(siteSettings.isActive, true));
  }

  async getSiteSettingByKey(key: string): Promise<SiteSetting | null> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key));
    return setting || null;
  }

  async insertSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting> {
    const [newSetting] = await db
      .insert(siteSettings)
      .values(setting)
      .returning();
    return newSetting;
  }

  async updateSiteSetting(key: string, value: string): Promise<SiteSetting | null> {
    const [updatedSetting] = await db
      .update(siteSettings)
      .set({
        settingValue: value,
        updatedAt: sql`NOW()`
      })
      .where(eq(siteSettings.settingKey, key))
      .returning();
    return updatedSetting || null;
  }

  async deleteSiteSetting(key: string): Promise<boolean> {
    const result = await db
      .delete(siteSettings)
      .where(eq(siteSettings.settingKey, key));
    return (result.rowCount ?? 0) > 0;
  }

  // Backup Management Methods
  async backupToSecondaryDatabase(): Promise<{ success: boolean; message: string; }> {
    try {
      console.log('🔄 Starting backup to Neon database...');

      // Get all data from primary database
      const [news, feeds, banners, settings, contacts] = await Promise.all([
        db.select().from(newsArticles),
        db.select().from(rssFeeds),
        db.select().from(sponsorBanners),
        db.select().from(siteSettings),
        db.select().from(contactMessages)
      ]);

      // Clear backup database first (optional - you may want to keep history)
      // await Promise.all([
      //   backupDb.delete(newsArticles),
      //   backupDb.delete(rssFeeds),
      //   backupDb.delete(sponsorBanners),
      //   backupDb.delete(siteSettings),
      //   backupDb.delete(contactMessages)
      // ]);

      // Insert data into backup database
      const results = await Promise.allSettled([
        news.length > 0 ? backupDb.insert(newsArticles).values(news).onConflictDoNothing() : Promise.resolve(),
        feeds.length > 0 ? backupDb.insert(rssFeeds).values(feeds).onConflictDoNothing() : Promise.resolve(),
        banners.length > 0 ? backupDb.insert(sponsorBanners).values(banners).onConflictDoNothing() : Promise.resolve(),
        settings.length > 0 ? backupDb.insert(siteSettings).values(settings).onConflictDoNothing() : Promise.resolve(),
        contacts.length > 0 ? backupDb.insert(contactMessages).values(contacts).onConflictDoNothing() : Promise.resolve()
      ]);

      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length > 0) {
        console.error('❌ Some backup operations failed:', failed);
        return {
          success: false,
          message: `Backup partially failed. ${failed.length} operations failed.`
        };
      }

      console.log('✅ Backup completed successfully');
      return {
        success: true,
        message: `Backup completed: ${news.length} news, ${feeds.length} feeds, ${banners.length} banners, ${settings.length} settings, ${contacts.length} messages`
      };
    } catch (error) {
      console.error('❌ Backup failed:', error);
      return {
        success: false,
        message: `Backup failed: ${error}`
      };
    }
  }

  async switchToPrimaryDatabase(): Promise<boolean> {
    // This would require application restart with different DATABASE_URL
    console.log('📝 Note: To switch to primary database, restart with DATABASE_URL pointing to Render');
    return true;
  }

  async switchToBackupDatabase(): Promise<boolean> {
    // This would require application restart with different DATABASE_URL
    console.log('📝 Note: To switch to backup database, restart with DATABASE_URL pointing to Neon');
    return true;
  }

  // Comments System Implementation
  async getCommentsByNewsId(newsId: number): Promise<Comment[]> {
    try {
      return await db.select().from(comments)
        .where(eq(comments.newsId, newsId))
        .orderBy(comments.createdAt);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  // Newsletter System Implementation
  async createNewsletterSubscriber(insertSubscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [subscriber] = await db
      .insert(newsletterSubscribers)
      .values(insertSubscriber)
      .returning();
    return subscriber;
  }

  async getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return await db.select().from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, true))
      .orderBy(newsletterSubscribers.subscriptionDate);
  }

  // Push Notifications Implementation
  async createPushSubscription(insertSubscription: InsertPushSubscription): Promise<PushSubscription> {
    const [subscription] = await db
      .insert(pushSubscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async deactivatePushSubscription(endpoint: string): Promise<void> {
    await db
      .update(pushSubscriptions)
      .set({ isActive: false })
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  // News Rating System Implementation
  async getNewsRatings(newsId: number): Promise<{ likes: number; dislikes: number }> {
    try {
      const ratings = await db.select().from(newsRatings)
        .where(eq(newsRatings.newsId, newsId));
      
      const likes = ratings.filter(r => r.rating === 'like').length;
      const dislikes = ratings.filter(r => r.rating === 'dislike').length;
      
      return { likes, dislikes };
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return { likes: 0, dislikes: 0 };
    }
  }

  async getUserRating(newsId: number, ipAddress: string): Promise<NewsRating | undefined> {
    try {
      const [rating] = await db.select().from(newsRatings)
        .where(and(eq(newsRatings.newsId, newsId), eq(newsRatings.ipAddress, ipAddress)))
        .limit(1);
      return rating;
    } catch (error) {
      console.error('Error checking user rating:', error);
      return undefined;
    }
  }

  async createNewsRating(insertRating: InsertNewsRating): Promise<NewsRating> {
    const [rating] = await db
      .insert(newsRatings)
      .values(insertRating)
      .returning();
    return rating;
  }

  // Advanced Search Implementation
  async searchNews(params: {
    query?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<NewsArticle[]> {
    try {
      let query = db.select().from(newsArticles);
      
      const conditions = [];
      
      if (params.query) {
        conditions.push(
          or(
            ilike(newsArticles.title, `%${params.query}%`),
            ilike(newsArticles.content, `%${params.query}%`),
            ilike(newsArticles.summary, `%${params.query}%`)
          )
        );
      }
      
      if (params.category) {
        conditions.push(eq(newsArticles.category, params.category));
      }
      
      if (params.dateFrom) {
        conditions.push(gte(newsArticles.createdAt, new Date(params.dateFrom)));
      }
      
      if (params.dateTo) {
        conditions.push(lte(newsArticles.createdAt, new Date(params.dateTo)));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Sort by
      if (params.sortBy === 'popularity') {
        // Could join with view counts here if needed
        query = query.orderBy(desc(newsArticles.createdAt));
      } else {
        query = query.orderBy(desc(newsArticles.createdAt));
      }
      
      // Pagination
      if (params.offset) {
        query = query.offset(params.offset);
      }
      
      if (params.limit) {
        query = query.limit(params.limit);
      } else {
        query = query.limit(20); // Default limit
      }
      
      return await query;
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();