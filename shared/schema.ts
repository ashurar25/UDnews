import { pgTable, text, serial, integer, boolean, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Placeholder for news table, assuming it exists elsewhere and is needed for foreign keys
// In a real scenario, 'news' would be imported or defined here.
const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const rssFeeds = pgTable("rss_feeds", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastProcessed: timestamp("last_processed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRssFeedSchema = createInsertSchema(rssFeeds).pick({
  title: true,
  url: true,
  description: true,
  category: true,
  isActive: true,
});

export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  sourceUrl: text("source_url"), // Original RSS item link
  rssFeedId: integer("rss_feed_id"), // Reference to RSS feed source
  isBreaking: boolean("is_breaking").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNewsSchema = createInsertSchema(newsArticles).pick({
  title: true,
  summary: true,
  content: true,
  category: true,
  imageUrl: true,
  sourceUrl: true,
  rssFeedId: true,
  isBreaking: true,
});

// Sponsor Banners Table
export const sponsorBanners = pgTable("sponsor_banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url").notNull(),
  position: text("position", { enum: ["header", "sidebar", "footer", "between_news"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSponsorBannerSchema = createInsertSchema(sponsorBanners).pick({
  title: true,
  imageUrl: true,
  linkUrl: true,
  position: true,
  isActive: true,
  displayOrder: true,
  startDate: true,
  endDate: true,
});

// RSS Processing History Table
export const rssProcessingHistory = pgTable("rss_processing_history", {
  id: serial("id").primaryKey(),
  rssFeedId: integer("rss_feed_id").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  articlesProcessed: integer("articles_processed").notNull().default(0),
  articlesAdded: integer("articles_added").notNull().default(0),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
});

export const insertRssHistorySchema = createInsertSchema(rssProcessingHistory).pick({
  rssFeedId: true,
  articlesProcessed: true,
  articlesAdded: true,
  success: true,
  errorMessage: true,
});

// Site Theme Settings Table
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  settingType: text("setting_type", { enum: ["color", "theme", "general", "layout"] }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).pick({
  settingKey: true,
  settingValue: true,
  settingType: true,
  description: true,
  isActive: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRssFeed = z.infer<typeof insertRssFeedSchema>;
export type RssFeed = typeof rssFeeds.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertSponsorBanner = z.infer<typeof insertSponsorBannerSchema>;
export type SponsorBanner = typeof sponsorBanners.$inferSelect;
export type InsertRssHistory = z.infer<typeof insertRssHistorySchema>;
export type RssProcessingHistory = typeof rssProcessingHistory.$inferSelect;
// Contact Messages Table
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const newsViews = pgTable("news_views", {
  id: serial("id").primaryKey(),
  newsId: integer("news_id").references(() => newsArticles.id).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  totalViews: integer("total_views").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),
  popularNewsId: integer("popular_news_id").references(() => newsArticles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  subject: true,
  message: true,
});

export const insertNewsViewSchema = createInsertSchema(newsViews);
export type NewsView = typeof newsViews.$inferSelect;
export type InsertNewsView = typeof newsViews.$inferInsert;

export const insertDailyStatsSchema = createInsertSchema(dailyStats);
export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = typeof dailyStats.$inferInsert;

// Comments Table  
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  newsId: integer("news_id").references(() => newsArticles.id).notNull(),
  parentId: integer("parent_id"),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  isReported: boolean("is_reported").default(false).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  newsId: true,
  parentId: true,
  authorName: true,
  authorEmail: true,
  content: true,
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Newsletter Subscribers Table
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  subscriptionDate: timestamp("subscription_date").defaultNow().notNull(),
  preferences: text("preferences").default('{"daily": true, "weekly": true}').notNull(),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).pick({
  email: true,
  name: true,
  preferences: true,
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// Push Notifications Table
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userId: integer("user_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).pick({
  endpoint: true,
  p256dh: true,
  auth: true,
  userId: true,
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// News Ratings Table
export const newsRatings = pgTable("news_ratings", {
  id: serial("id").primaryKey(),
  newsId: integer("news_id").references(() => newsArticles.id).notNull(),
  rating: varchar("rating", { length: 10 }).notNull(), // 'like' or 'dislike'
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNewsRatingSchema = createInsertSchema(newsRatings).pick({
  newsId: true,
  rating: true,
  ipAddress: true,
});

export type NewsRating = typeof newsRatings.$inferSelect;
export type InsertNewsRating = typeof newsRatings.$inferInsert;

// Donations Table (Phase 1: manual approval)
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  amount: integer("amount").notNull(), // in THB satang? here store THB integer amount
  currency: varchar("currency", { length: 10 }).notNull().default("THB"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | rejected
  donorName: varchar("donor_name", { length: 200 }),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  message: text("message"),
  reference: varchar("reference", { length: 64 }).notNull().unique(),
  slipUrl: text("slip_url"),
  slipUploadedAt: timestamp("slip_uploaded_at"),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertDonationSchema = createInsertSchema(donations).pick({
  amount: true,
  currency: true,
  donorName: true,
  isAnonymous: true,
  message: true,
  reference: true,
  status: true,
});

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = typeof donations.$inferInsert;