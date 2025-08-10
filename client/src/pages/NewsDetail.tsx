import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Eye, Share2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

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
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 5000 + 1000));

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
      return response.json();
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch related news - limited to 3 items for better performance
  const { data: relatedNews } = useQuery({
    queryKey: ['/api/news'],
    queryFn: async () => {
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news');
      const allNews = await response.json();
      return allNews
        .filter((item: NewsItem) => item.id !== parseInt(id || '0') && item.category === news?.category)
        .sort((a: NewsItem, b: NewsItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
    },
    enabled: !!news,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'เมื่อสักครู่';
    if (diffInHours === 1) return '1 ชั่วโมงที่แล้ว';
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    
    const diffInDays = Math.floor(diffInHours / 24);
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

  const handleShare = async () => {
    if (navigator.share && news) {
      try {
        await navigator.share({
          title: news.title,
          text: news.summary,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('ลิงก์ถูกคัดลอกแล้ว');
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
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
                  <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    แชร์
                  </Button>
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
            </article>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related News */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold font-kanit mb-4">ข่าวที่เกี่ยวข้อง</h3>
                <div className="space-y-4">
                  {relatedNews?.map((item: NewsItem) => (
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetail;