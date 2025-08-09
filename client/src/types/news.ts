
export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl?: string;
  sourceUrl?: string;
  isBreaking: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessedNewsItem {
  id?: number;
  title: string;
  summary: string;
  category: string;
  time: string;
  views: string;
  image?: string;
  isBreaking?: boolean;
  size?: "small" | "medium" | "large";
}
