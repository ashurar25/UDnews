// Additional types for new systems
export interface Comment {
  id: number;
  newsId: number;
  author: string;
  email?: string;
  content: string;
  parentId?: number; // For replies
  likes: number;
  dislikes: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  name?: string;
  isActive: boolean;
  subscriptionDate: string;
  preferences: string; // JSON string of preferences
}

export interface PushSubscription {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  userId?: number;
  isActive: boolean;
  createdAt: string;
}

export interface SocialShare {
  platform: 'facebook' | 'twitter' | 'line' | 'whatsapp' | 'email' | 'copy';
  url: string;
  title: string;
  description?: string;
}

export interface SearchFilters {
  query: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'popularity' | 'relevance';
  limit?: number;
  offset?: number;
}

export interface NewsRating {
  id: number;
  newsId: number;
  rating: 'like' | 'dislike';
  ipAddress: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: number;
  eventType: string;
  eventData: string; // JSON
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}