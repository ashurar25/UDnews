import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SponsorBanner from "@/components/SponsorBanner";
import SponsorBannerBar from "@/components/SponsorBannerBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Eye, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import MetaHead from "@/components/MetaHead";
import ShareButtons from "@/components/ShareButtons";

interface NewsItem {
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
  description?: string; // Added for potential meta description
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [viewCount, setViewCount] = useState(0); // Initialize viewCount to 0

  // Scroll to top when page loads or ID changes
  useEffect(() => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }, [id]);

  // Fetch news detail with aggressive caching
  const { data: news, isLoading, error } = useQuery({
    queryKey: ['/api/news', id],
    queryFn: async () => {
      const response = await fetch(`/api/news/${id}`);
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      // Ensure description is available for meta tags, fallback to content
      if (!data.description && data.content) {
        data.description = data.content.substring(0, 160) + '...';
      }
      return data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch related news - limited to 3 items for better performance
  const { data: relatedNews } = useQuery({
    queryKey: ['/api/news', news?.category], // Include category in query key
    queryFn: async () => {
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news');
      const allNews = await response.json();
      return allNews
        .filter((item: NewsItem) => item.id !== parseInt(id || '0') && item.category === news?.category)
        .sort((a: NewsItem, b: NewsItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
    },
    enabled: !!news, // Only fetch related news if `news` data is available
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update view count and record view analytics
  useEffect(() => {
    if (news) {
      setViewCount(prevCount => prevCount + 1); // Increment view count locally

      // Record view analytics
      fetch(`/api/analytics/view/${news.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(error => {
        console.error('Failed to record view:', error);
      });
    }
  }, [news]); // Depend on `news` object to trigger fetch

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInMinutes === 1) return '1 นาทีที่แล้ว';
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    if (diffInHours === 1) return '1 ชั่วโมงที่แล้ว';
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    if (diffInDays === 1) return '1 วันที่แล้ว';
    return `${diffInDays} วันที่แล้ว`;
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ข่าวด่วน': return 'bg-news-urgent text-white';
      case 'การเมือง': return 'bg-news-politics text-white';
      case 'กีฬา': return 'bg-news-sport text-white';
      case 'ข่าวท้องถิ่น': return 'bg-primary text-primary-foreground';
      case 'ข่าวทั่วไป': return 'bg-blue-600 text-white';
      case 'เศรษฐกิจ': return 'bg-green-600 text-white';
      case 'บันเทิง': return 'bg-purple-600 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  // sharing handled by ShareButtons component

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">ไม่พบข่าวที่ต้องการ</h1>
          <Button onClick={() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            setLocation('/');
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับสู่หน้าหลัก
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {news && (
        <MetaHead
          title={news.title}
          description={news.description || (news.content ? news.content.substring(0, 160) + '...' : '')}
          image={news.imageUrl}
          url={`/news/${news.id}`}
          type="article"
          siteName="UD News Update"
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: news.title,
            description: news.description || news.summary,
            image: news.imageUrl ? [news.imageUrl] : undefined,
            datePublished: news.createdAt,
            dateModified: news.updatedAt || news.createdAt,
            mainEntityOfPage: `${typeof window !== 'undefined' ? window.location.origin : ''}/news/${news.id}`,
            author: { '@type': 'Organization', name: 'UD News Update' },
            publisher: {
              '@type': 'Organization',
              name: 'UD News Update',
              logo: { '@type': 'ImageObject', url: `${typeof window !== 'undefined' ? window.location.origin : ''}/logo.jpg` },
            },
          }}
        />
      )}
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Top Banner */}
        <div className="mb-6">
          <SponsorBannerBar position="header" autoPlay={true} showNavigation={false} bannerCount={1} />
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            setLocation('/');
          }} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับสู่หน้าหลัก
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <article className="space-y-6">
              {/* Article Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getCategoryColor(news.category)}>
                    {news.category}
                  </Badge>
                  {news.isBreaking && (
                    <Badge className="bg-news-urgent text-white animate-pulse">
                      ข่าวด่วน
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold font-kanit leading-tight">
                  {news.title}
                </h1>

                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-sarabun">{getTimeAgo(news.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span className="font-sarabun">{viewCount.toLocaleString()} ครั้ง</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ShareButtons title={news.title} summary={news.summary} />
                  {news.sourceUrl && (
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        อ่านต้นฉบับ
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Featured Image */}
              {news.imageUrl && (
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Article Summary */}
              <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                <p className="text-lg font-sarabun font-medium leading-relaxed">
                  {news.summary}
                </p>
              </div>

              {/* Article Content */}
              <div className="prose prose-lg max-w-none">
                <div
                  className="font-sarabun text-lg leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: news.content.replace(/\n/g, '<br>') }}
                />
              </div>

              {/* Mid-Content Banner */}
              <div className="my-8">
                <SponsorBannerBar position="between_news" autoPlay={true} showNavigation={false} bannerCount={1} />
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sidebar Banner */}
            <div className="hidden lg:block">
              <SponsorBannerBar position="sidebar" autoPlay={true} showNavigation={false} bannerCount={2} />
            </div>

            {/* Related News */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold font-kanit mb-4">ข่าวที่เกี่ยวข้อง (3 ข่าว)</h3>
                <div className="space-y-4">
                  {relatedNews?.slice(0, 3).map((item: NewsItem) => (
                    <div
                      key={item.id}
                      className="cursor-pointer group"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        setLocation(`/news/${item.id}`);
                      }}
                    >
                      <div className="flex gap-3">
                        {item.imageUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-sarabun font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getTimeAgo(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-sm">ไม่มีข่าวที่เกี่ยวข้อง</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold font-kanit mb-4">รายละเอียดเพิ่มเติม</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold">หมวดหมู่:</span> {news.category}
                  </div>
                  <div>
                    <span className="font-semibold">เผยแพร่:</span> {new Date(news.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {news.updatedAt !== news.createdAt && (
                    <div>
                      <span className="font-semibold">อัพเดท:</span> {new Date(news.updatedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Sidebar Banner */}
            <div className="hidden lg:block">
              <SponsorBannerBar position="footer" autoPlay={true} showNavigation={false} bannerCount={1} />
            </div>
          </div>
        </div>

        {/* Bottom Content Banner - Mobile Friendly */}
        <div className="mt-8 lg:hidden">
          <SponsorBannerBar position="footer" autoPlay={true} showNavigation={false} bannerCount={2} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetail;