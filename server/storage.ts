import { users, rssFeeds, newsArticles, sponsorBanners, rssProcessingHistory, siteSettings, contactMessages, newsViews, dailyStats, comments, newsletterSubscribers, pushSubscriptions, newsRatings, donations, type InsertUser, type User, type InsertRssFeed, type RssFeed, type InsertNews, type NewsArticle, type InsertSponsorBanner, type SponsorBanner, type InsertRssHistory, type RssProcessingHistory, type InsertSiteSetting, type SiteSetting, type InsertContactMessage, type ContactMessage, type NewsView, type DailyStats, type Comment, type InsertComment, type NewsletterSubscriber, type InsertNewsletterSubscriber, type PushSubscription, type InsertPushSubscription, type NewsRating, type InsertNewsRating, type Donation, type InsertDonation } from "@shared/schema";
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
  getAllNews(limit?: number, offset?: number): Promise<NewsArticle[]>;
  getNewsById(id: number): Promise<NewsArticle | null>;
  getNewsByUrl(url: string): Promise<NewsArticle | null>;
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
  getCommentsByNewsId(newsId: number): Promise<Comment[]>;
  createComment(insertComment: InsertComment): Promise<Comment>;
  createNewsletterSubscriber(insertSubscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  createPushSubscription(insertSubscription: InsertPushSubscription): Promise<PushSubscription>;
  deactivatePushSubscription(endpoint: string): Promise<void>;
  getNewsRatings(newsId: number): Promise<{ likes: number; dislikes: number }>;
  getUserRating(newsId: number, ipAddress: string): Promise<NewsRating | undefined>;
  createNewsRating(insertRating: InsertNewsRating): Promise<NewsRating>;
  searchNews(params: {
    query?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<NewsArticle[]>;
  getAllActivePushSubscriptions(): Promise<PushSubscription[]>;
  getNewsCount(): Promise<number>;
  getRSSFeedsCount(): Promise<number>;
  getSponsorBannersCount(): Promise<number>;
  getContactMessagesCount(): Promise<number>;
  getTodayViews(): Promise<number>;
  getViewsByDate(date: string): Promise<number>;
  getViewsSince(date: string): Promise<number>;
  getNewsReadToday(): Promise<number>;
  getMostViewedNews(): Promise<string>;
  getMostPopularCategory(): Promise<string>;
  getComments(filter?: string, limit?: number): Promise<any[]>;
  approveComment(id: number): Promise<boolean>;
  deleteComment(id: number): Promise<boolean>;
  updateGlobalSetting(key: string, value: string): Promise<boolean>;
  getGlobalSetting(key: string): Promise<string | null>;
  // Donations
  createDonation(donation: InsertDonation): Promise<Donation>;
  approveDonation(id: number): Promise<Donation | null>;
  getDonationRanking(range: 'today'|'week'|'all'): Promise<Array<{ name: string; total: number; count: number }>>;
  getRecentDonations(limit?: number): Promise<Donation[]>;
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

  async getAllNews(limit?: number, offset?: number): Promise<NewsArticle[]> {
    let query = db.select().from(newsArticles).orderBy(desc(newsArticles.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getNewsById(id: number): Promise<NewsArticle | null> {
    const result = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
    return result[0] || null;
  }

  async getNewsByUrl(url: string): Promise<NewsArticle | null> {
    const result = await db.select().from(newsArticles).where(eq(newsArticles.sourceUrl, url));
    return result[0] || null;
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

  async getPopularNews(limit: number = 10): Promise<(NewsArticle & { viewCount: number })[]> {
    const result = await db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        summary: newsArticles.summary,
        content: newsArticles.content,
        imageUrl: newsArticles.imageUrl,
        sourceUrl: newsArticles.sourceUrl,
        category: newsArticles.category,
        rssFeedId: newsArticles.rssFeedId,
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

    return result as (NewsArticle & { viewCount: number })[];
  }

  async getDailyStats(date: string): Promise<DailyStats | null> {
    const [stats] = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, date));

    return stats || null;
  }

  async updateDailyStats(date: string, totalViews: number, uniqueVisitors: number, popularNewsId?: number): Promise<DailyStats> {
    const existing = await db.select().from(dailyStats).where(eq(dailyStats.date, date)).then(res => res[0] || null);

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
    try {
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

      const popularNews = await db.select().from(newsArticles).orderBy(desc(newsArticles.createdAt)).limit(5);

      return {
        totalViews: totalViewsResult?.count || 0,
        totalNews: totalNewsResult?.count || 0,
        todayViews: todayViewsResult?.count || 0,
        popularNews
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        totalViews: 0,
        totalNews: 0,
        todayViews: 0,
        popularNews: []
      };
    }
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
      db.select({ count: sql<number>`count(*)` }).from(newsArticles).then(res => res[0]?.count || 0),
      db.select({ count: sql<number>`count(*)` }).from(rssFeeds).then(res => res[0]?.count || 0),
      db.select({ count: sql<number>`count(*)` }).from(sponsorBanners).then(res => res[0]?.count || 0),
      db.select({ count: sql<number>`count(*)` }).from(contactMessages).then(res => res[0]?.count || 0)
    ]);

    return {
      newsCount: newsCount,
      rssFeedsCount: rssFeedsCount,
      sponsorBannersCount: sponsorBannersCount,
      contactMessagesCount: contactMessagesCount,
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

  // Get newsletter subscriber by email
  async getNewsletterSubscriberByEmail(email: string) {
    return await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1)
      .execute();
  }

  // Get all newsletter subscribers
  async getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, true));
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

  // Get all active push subscriptions
  async getAllActivePushSubscriptions(): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.isActive, true));
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

  // Added helper functions for counts
  async getNewsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(newsArticles);
    return result[0]?.count || 0;
  }

  async getRSSFeedsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(rssFeeds);
    return result[0]?.count || 0;
  }

  async getSponsorBannersCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(sponsorBanners);
    return result[0]?.count || 0;
  }

  async getContactMessagesCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(contactMessages);
    return result[0]?.count || 0;
  }

  // Analytics functions
  async getTodayViews(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await db
        .select({ count: sql<number>`sum(${newsViews.viewCount})` })
        .from(newsViews)
        .where(sql`date(${newsViews.viewedAt}) = ${today}`);

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting today views:', error);
      return 0;
    }
  }

  async getViewsByDate(date: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`sum(${newsViews.viewCount})` })
        .from(newsViews)
        .where(sql`date(${newsViews.viewedAt}) = ${date}`);

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting views by date:', error);
      return 0;
    }
  }

  async getViewsSince(date: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`sum(${newsViews.viewCount})` })
        .from(newsViews)
        .where(sql`date(${newsViews.viewedAt}) >= ${date}`);

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting views since date:', error);
      return 0;
    }
  }

  async getNewsReadToday(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await db
        .select({ count: sql<number>`count(distinct ${newsViews.newsId})` })
        .from(newsViews)
        .where(sql`date(${newsViews.viewedAt}) = ${today}`);

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting news read today:', error);
      return 0;
    }
  }

  async getMostViewedNews(): Promise<string> {
    try {
      const result = await db
        .select({
          title: newsArticles.title,
          totalViews: sql<number>`sum(${newsViews.viewCount})`
        })
        .from(newsViews)
        .innerJoin(newsArticles, eq(newsViews.newsId, newsArticles.id))
        .groupBy(newsArticles.id, newsArticles.title)
        .orderBy(sql`sum(${newsViews.viewCount}) desc`)
        .limit(1);

      return result[0]?.title || 'ไม่มีข้อมูล';
    } catch (error) {
      console.error('Error getting most viewed news:', error);
      return 'ไม่มีข้อมูล';
    }
  }

  async getMostPopularCategory(): Promise<string> {
    try {
      const result = await db
        .select({
          category: newsArticles.category,
          totalViews: sql<number>`sum(${newsViews.viewCount})`
        })
        .from(newsViews)
        .innerJoin(newsArticles, eq(newsViews.newsId, newsArticles.id))
        .groupBy(newsArticles.category)
        .orderBy(sql`sum(${newsViews.viewCount}) desc`)
        .limit(1);

      return result[0]?.category || 'ไม่มีข้อมูล';
    } catch (error) {
      console.error('Error getting most popular category:', error);
      return 'ไม่มีข้อมูล';
    }
  }

  // Comments functions
  async getComments(filter: string = 'all', limit: number = 50): Promise<any[]> {
    try {
      let query = db
        .select({
          id: comments.id,
          content: comments.content,
          author: comments.author,
          createdAt: comments.createdAt,
          status: comments.status,
          newsTitle: newsArticles.title
        })
        .from(comments)
        .innerJoin(newsArticles, eq(comments.newsId, newsArticles.id))
        .limit(limit)
        .orderBy(desc(comments.createdAt));

      if (filter !== 'all') {
        query = query.where(eq(comments.status, filter));
      }

      return await query;
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  async approveComment(id: number): Promise<boolean> {
    try {
      const result = await db
        .update(comments)
        .set({ status: 'approved' })
        .where(eq(comments.id, id));

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error approving comment:', error);
      return false;
    }
  }

  async deleteComment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(comments)
        .where(eq(comments.id, id));

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Global settings functions
  async updateGlobalSetting(key: string, value: string): Promise<boolean> {
    try {
      // Check if setting exists
      const existing = await db
        .select()
        .from(sql`global_settings`)
        .where(sql`key = ${key}`)
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(sql`global_settings`)
          .set({ value, updatedAt: new Date() })
          .where(sql`key = ${key}`);
      } else {
        await db
          .insert(sql`global_settings`)
          .values({ key, value, createdAt: new Date(), updatedAt: new Date() });
      }

      return true;
    } catch (error) {
      console.error('Error updating global setting:', error);
      return false;
    }
  }

  async getGlobalSetting(key: string): Promise<string | null> {
    try {
      const result = await db
        .select({ value: sql<string>`value` })
        .from(sql`global_settings`)
        .where(sql`key = ${key}`)
        .limit(1);

      return result[0]?.value || null;
    } catch (error) {
      console.error('Error getting global setting:', error);
      return null;
    }
  }

  // Donations
  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [row] = await db.insert(donations).values(donation).returning();
    return row;
  }

  async approveDonation(id: number): Promise<Donation | null> {
    const [row] = await db
      .update(donations)
      .set({ status: 'approved' as any, approvedAt: new Date() })
      .where(eq(donations.id, id))
      .returning();
    return row || null;
  }

  async getDonationRanking(range: 'today'|'week'|'all'): Promise<Array<{ name: string; total: number; count: number }>> {
    // compute time filter
    let since: Date | null = null;
    const now = new Date();
    if (range === 'today') {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'week') {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build base where
    let whereSql = sql`status = 'approved'`;
    if (since) {
      whereSql = sql`${whereSql} AND ${donations.createdAt} >= ${since}`;
    }

    const rows = await db.execute<{ name: string; total: number; count: number }>(
      sql`SELECT 
            CASE 
              WHEN COALESCE(${donations.isAnonymous}, false) = true OR ${donations.donorName} IS NULL OR ${donations.donorName} = ''
              THEN 'ผู้ไม่ประสงค์ออกนาม'
              ELSE ${donations.donorName}
            END as name,
            SUM(${donations.amount})::int as total,
            COUNT(*)::int as count
          FROM ${donations}
          WHERE ${whereSql}
          GROUP BY name
          ORDER BY total DESC, count DESC
          LIMIT 50`
    );

    return rows.rows || [];
  }

  async getRecentDonations(limit: number = 10): Promise<Donation[]> {
    const rows = await db
      .select()
      .from(donations)
      .where(eq(donations.status, 'approved' as any))
      .orderBy(desc(donations.approvedAt), desc(donations.createdAt))
      .limit(limit);
    return rows as Donation[];
  }
}

export const storage = new DatabaseStorage();