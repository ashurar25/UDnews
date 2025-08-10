
import NodeCache from "node-cache";

class CacheService {
  private cache: NodeCache;

  constructor() {
    // Cache for 5 minutes by default
    this.cache = new NodeCache({ 
      stdTTL: 300,
      checkperiod: 60 
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 300);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  keys(): string[] {
    return this.cache.keys();
  }

  flushAll(): void {
    this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }

  // News specific cache methods
  cacheNews(news: any[], category?: string): void {
    const key = category ? `news:${category}` : 'news:all';
    this.set(key, news, 300); // 5 minutes
  }

  getCachedNews(category?: string): any[] | undefined {
    const key = category ? `news:${category}` : 'news:all';
    return this.get<any[]>(key);
  }

  invalidateNewsCache(): void {
    const newsKeys = this.keys().filter(key => key.startsWith('news:'));
    newsKeys.forEach(key => this.del(key));
  }

  // Popular news cache
  cachePopularNews(news: any[]): void {
    this.set('popular:news', news, 600); // 10 minutes
  }

  getCachedPopularNews(): any[] | undefined {
    return this.get<any[]>('popular:news');
  }
}

export const cacheService = new CacheService();
