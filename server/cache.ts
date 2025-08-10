import NodeCache from 'node-cache';

// Create cache instances with different TTL settings
export const newsCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes for news list
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Better performance, but be careful with object mutations
});

export const individualNewsCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes for individual news articles
  checkperiod: 120,
  useClones: false
});

export const popularNewsCache = new NodeCache({ 
  stdTTL: 600, // 10 minutes for popular news
  checkperiod: 60,
  useClones: false
});

export const categoryCacheNews = new NodeCache({ 
  stdTTL: 600, // 10 minutes for category news
  checkperiod: 60,
  useClones: false
});

// Cache key generators
export const cacheKeys = {
  allNews: (limit?: number, offset?: number) => 
    `news:all:${limit || 'unlimited'}:${offset || 0}`,
  newsById: (id: number) => `news:${id}`,
  newsByCategory: (category: string, limit?: number) => 
    `news:category:${category}:${limit || 'unlimited'}`,
  popularNews: (limit?: number) => `news:popular:${limit || 10}`,
  breakingNews: () => 'news:breaking',
  latestNews: (limit?: number) => `news:latest:${limit || 10}`
};

// Cache clearing functions
export const clearNewsCache = () => {
  newsCache.flushAll();
  individualNewsCache.flushAll();
  popularNewsCache.flushAll();
  categoryCacheNews.flushAll();
};

export const clearNewsCacheByCategory = (category: string) => {
  const keys = categoryCacheNews.keys();
  keys.forEach(key => {
    if (key.includes(`category:${category}`)) {
      categoryCacheNews.del(key);
    }
  });
};

export const clearNewsCacheById = (id: number) => {
  individualNewsCache.del(cacheKeys.newsById(id));
  // Also clear related caches
  newsCache.flushAll();
  popularNewsCache.flushAll();
  categoryCacheNews.flushAll();
};