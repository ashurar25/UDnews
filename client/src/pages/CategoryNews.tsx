import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import MetaHead from "@/components/MetaHead";
import NewsletterSignup from "@/components/NewsletterSignup";
import TrendingWidget from "@/components/TrendingWidget";

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

const CategoryNews = () => {
  const { category } = useParams<{ category: string }>();
  const [, setLocation] = useLocation();

  // Fetch all news and filter by category
  const { data: allNews, isLoading } = useQuery({
    queryKey: ['/api/news'],
    queryFn: async (): Promise<NewsItem[]> => {
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    }
  });

  // Helper function to calculate time ago
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

  // Category mapping for Thai names
  const categoryTitles: { [key: string]: string } = {
    'local': 'ข่าวท้องถิ่น',
    'politics': 'การเมือง', 
    'crime': 'อาชญากรรม',
    'sports': 'กีฬา',
    'entertainment': 'บันเทิง',
    'economy': 'เศรษฐกิจ',
    'general': 'ข่าวทั่วไป'
  };

  const categoryMapping: { [key: string]: string[] } = {
    'local': ['ข่าวท้องถิ่น', 'ท้องถิ่น'],
    'politics': ['การเมือง', 'รัฐบาล', 'นโยบาย'],
    'crime': ['อาชญากรรม', 'ความปลอดภัย'],
    'sports': ['กีฬา', 'ฟุตบอล', 'แบดมินตัน'],
    'entertainment': ['บันเทิง', 'ดารา', 'ภาพยนตร์'],
    'economy': ['เศรษฐกิจ', 'การเงิน', 'ธุรกิจ'],
    'general': ['ข่าวทั่วไป', 'ทั่วไป']
  };

  // Filter news by category
  const categoryNews = allNews ? allNews.filter(news => {
    if (!category) return false;
    const categoriesForRoute = categoryMapping[category] || [];
    return categoriesForRoute.some(cat => 
      news.category.toLowerCase().includes(cat.toLowerCase()) || 
      cat.toLowerCase().includes(news.category.toLowerCase())
    );
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  // Process news for display
  const processedNews = categoryNews.map((news, index) => ({
    id: news.id,
    title: news.title,
    summary: news.summary,
    category: news.category,
    time: getTimeAgo(news.createdAt),
    views: `${Math.floor(Math.random() * 3000 + 500)}`,
    image: news.imageUrl,
    isBreaking: news.isBreaking
  }));

  const categoryTitle = category ? categoryTitles[category] || 'ข่าวทั่วไป' : 'ข่าว';
  const absPath = `/category/${category ?? ''}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MetaHead
        title={`${categoryTitle} | UD News Update`}
        description={`รวมข่าวหมวด ${categoryTitle} ข่าวล่าสุดจากอุดรธานี`}
        image="/og-article-default.svg"
        url={absPath}
        canonical={`https://udnewsupdate.sbs${absPath}`}
        siteName="UD News Update"
        type="website"
        locale="th_TH"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับสู่หน้าหลัก
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-kanit mb-2">{categoryTitle}</h1>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground font-sarabun">
              ข่าวสารในหมวด {categoryTitle} ทั้งหมด
            </p>
            <Badge variant="outline" className="font-sarabun">
              {processedNews.length} ข่าว
            </Badge>
          </div>
        </div>

        {/* News Grid */}
        {processedNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedNews.map((news) => (
              <NewsCard key={news.id} {...news} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-xl font-bold font-kanit mb-2">ยังไม่มีข่าวในหมวด {categoryTitle}</h3>
            <p className="text-muted-foreground font-sarabun mb-4">
              ลองดูข่าวในหมวดอื่นๆ หรือกลับสู่หน้าหลัก
            </p>
            <div className="space-x-4">
              <Button onClick={() => setLocation('/')} className="font-sarabun">
                หน้าหลัก
              </Button>
              <Button variant="outline" onClick={() => setLocation('/news')} className="font-sarabun">
                ข่าวทั้งหมด
              </Button>
            </div>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="mt-10">
          <NewsletterSignup className="shadow-news" />
        </div>

        {/* Trending Widget */}
        <div className="mt-8">
          <TrendingWidget title="กำลังมาแรงในวันนี้" limit={6} className="shadow-news" />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryNews;