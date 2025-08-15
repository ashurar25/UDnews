import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SponsorBannerBar from "@/components/SponsorBannerBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Eye, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import MetaHead from "@/components/MetaHead";
import { toAbsoluteUrl } from "@/lib/url";

import CommentSection from "@/components/CommentSection";
import SocialShare from "@/components/SocialShare";
import NewsRating from "@/components/NewsRating";
import TTSReader from "@/components/TTSReader";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import { getHourlyForecastHourly, type HourlyWeather } from "@/lib/weather-api";
import { api } from "@/lib/api";

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

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [viewCount, setViewCount] = useState(0); // Initialize viewCount to 0
  const [hourly1h, setHourly1h] = useState<HourlyWeather[] | null>(null);
  const [isLoadingHourly1h, setIsLoadingHourly1h] = useState(true);

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
      const data = await api.get(`/api/news/${id}`, { auth: false });
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

  // Load true hourly forecast (1-hour step) for Udon Thani sidebar
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoadingHourly1h(true);
        const data = await getHourlyForecastHourly(12); // show next 12 hours for detail page
        if (mounted) setHourly1h(data);
      } catch {}
      finally {
        if (mounted) setIsLoadingHourly1h(false);
      }
    };
    load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Fetch related news - limited to 3 items for better performance
  const { data: relatedNews } = useQuery({
    queryKey: ['/api/news', news?.category], // Include category in query key
    queryFn: async () => {
      const allNews = await api.get('/api/news', { auth: false });
      return allNews
        .filter((item: NewsItem) => item.id !== parseInt(id || '0') && item.category === news?.category)
        .sort((a: NewsItem, b: NewsItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
    },
    enabled: !!news, // Only fetch related news if `news` data is available
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update view count and record view analytics (unique per 24h per newsId)
  useEffect(() => {
    if (news?.id) {
      const key = `viewed:${news.id}`;
      const now = Date.now();
      const last = localStorage.getItem(key);
      const dayMs = 24 * 60 * 60 * 1000;
      const shouldRecord = !last || (now - Number(last)) > dayMs;
      if (shouldRecord) {
        setViewCount(prevCount => prevCount + 1);
        api.post('/api/analytics/track-view', { newsId: news.id }, { auth: false }).catch(error => {
          console.error('Failed to record view:', error);
        });
        localStorage.setItem(key, String(now));
      }
    }
  }, [news?.id]);

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
    <AppErrorBoundary>
    <div className="min-h-screen bg-background">
      {news && (
        <MetaHead
          title={news.title}
          description={news.description || (news.content ? news.content.substring(0, 160) + '...' : '')}
          image={toAbsoluteUrl(news.imageUrl)}
          url={toAbsoluteUrl(`/news/${news.id}`) || `/news/${news.id}`}
          type="article"
          siteName="UD News Update"
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: news.title,
            description: news.description || news.summary,
            image: news.imageUrl ? [toAbsoluteUrl(news.imageUrl)!] : undefined,
            datePublished: news.createdAt,
            dateModified: news.updatedAt || news.createdAt,
            mainEntityOfPage: toAbsoluteUrl(`/news/${news.id}`),
            author: { '@type': 'Organization', name: 'UD News Update' },
            publisher: {
              '@type': 'Organization',
              name: 'UD News Update',
              logo: { '@type': 'ImageObject', url: toAbsoluteUrl('/logo.jpg')! },
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

                <div className="flex items-center gap-3 sm:gap-2 flex-wrap sm:flex-nowrap">
                  <SocialShare
                    newsId={String(news.id)}
                    title={news.title}
                    description={news.summary || news.description || ''}
                    imageUrl={news.imageUrl}
                    compact
                  />
                  {news.sourceUrl && (
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label="เปิดข่าวต้นฉบับในแท็บใหม่" title="เปิดข่าวต้นฉบับในแท็บใหม่">
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

              {/* Text-to-Speech */}
              {typeof window !== 'undefined' && 'speechSynthesis' in window && (
                <TTSReader
                  title={news.title}
                  summary={news.summary}
                  htmlContent={news.content.replace(/\n/g, '<br>')}
                  newsId={news.id}
                />
              )}

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

              {/* Social Share & Rating */}
              <div className="mt-6 space-y-4">
                <SocialShare
                  newsId={String(news.id)}
                  title={news.title}
                  description={news.summary || news.description || ''}
                  imageUrl={news.imageUrl}
                />
                <NewsRating newsId={news.id} />
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sidebar Banner */}
            <div className="hidden lg:block">
              <SponsorBannerBar position="sidebar" autoPlay={true} showNavigation={false} bannerCount={2} />
            </div>

            {/* Hourly Weather (Real, 1-hour step) */}
            <Card className="border-white/30 bg-white/10 backdrop-blur-md shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold font-kanit mb-4">พยากรณ์รายชั่วโมง (อุดรธานี)</h3>
                <div className="relative rounded-xl p-3 border border-white/30 bg-white/20 backdrop-blur-md shadow-md overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🕘</span>
                        <span className="text-sm font-kanit">ถัดไป 12 ชั่วโมง</span>
                      </div>
                      {isLoadingHourly1h && (
                        <span className="text-xs font-sarabun text-muted-foreground">กำลังโหลด...</span>
                      )}
                    </div>
                    <div className="overflow-x-auto snap-x snap-mandatory scroll-smooth">
                      <div className="flex gap-3 min-w-max">
                        {(hourly1h || []).map((h, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center rounded-2xl px-2 py-2 w-16 border border-white/30 bg-white/40 backdrop-blur-md shadow-sm hover:bg-white/60 hover:shadow transition-all snap-center"
                          >
                            <span className="text-[10px] font-sarabun text-muted-foreground">{h.time}</span>
                            <span className="text-lg leading-none my-1">{h.icon}</span>
                            <span className="text-sm font-kanit text-orange-600">{h.temp}°</span>
                            <span className="text-[10px] font-sarabun text-blue-600">{h.rainChance}%</span>
                          </div>
                        ))}
                        {!hourly1h && !isLoadingHourly1h && (
                          <div className="text-xs font-sarabun text-muted-foreground">ไม่มีข้อมูลรายชั่วโมง</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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

        {/* Comments Section */}
        <section className="container mx-auto px-4 mt-10">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold font-kanit mb-4">แสดงความคิดเห็น</h3>
              <CommentSection newsId={Number(id)} />
            </CardContent>
          </Card>
        </section>

        {/* Bottom Content Banner - Mobile Friendly */}
        <div className="mt-8 lg:hidden">
          <SponsorBannerBar position="footer" autoPlay={true} showNavigation={false} bannerCount={2} />
        </div>
      </main>
      <Footer />
    </div>
  </AppErrorBoundary>
);
}