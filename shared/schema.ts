import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  isBreaking: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRssFeed = z.infer<typeof insertRssFeedSchema>;
export type RssFeed = typeof rssFeeds.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
