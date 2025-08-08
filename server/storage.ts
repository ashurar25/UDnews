import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { users, rssFeeds, type InsertUser, type User, type InsertRssFeed, type RssFeed } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
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
    // In-memory implementation for demonstration
    return [];
  }

  async getRssFeedById(id: number): Promise<RssFeed | null> {
    // In-memory implementation for demonstration
    return null;
  }

  async insertRssFeed(feed: InsertRssFeed): Promise<RssFeed> {
    // In-memory implementation for demonstration
    const id = this.currentId++;
    const rssFeed: RssFeed = { ...feed, id };
    return rssFeed;
  }

  async updateRssFeed(id: number, feed: Partial<InsertRssFeed>): Promise<RssFeed | null> {
    // In-memory implementation for demonstration
    return null;
  }

  async deleteRssFeed(id: number): Promise<boolean> {
    // In-memory implementation for demonstration
    return false;
  }
}

export const storage = new MemStorage();