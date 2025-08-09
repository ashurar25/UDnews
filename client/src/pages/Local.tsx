
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ProcessedNewsItem, NewsItem } from "@/types/news";

const Local = () => {
  const [, setLocation] = useLocation();

  // Fetch all news and filter for local news
  const { data: allNews, isLoading } = useQuery({
    queryKey: ['/api/news'],
    queryFn: async (): Promise<NewsItem[]> => {
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    }
  });

  // Mock local news data for demo purposes
  const mockLocalNews: ProcessedNewsItem[] = [
    {
      title: "อุดรธานีจัดงานประเพณีบุญบั้งไฟ ปี 2567",
      summary: "เทศบาลนครอุดรธานีเตรียมจัดงานประเพณีบุญบั้งไฟประจำปี 2567 ระหว่างวันที่ 15-17 พฤษภาคม กิจกรรมมากมาย",
      category: "ข่าวท้องถิ่น",
      time: "2 ชั่วโมงที่แล้ว",
      views: "1,234",
    },
    {
      title: "ตลาดโต้รุ่งอุดรธานีปรับปรุงใหม่",
      summary: "ตลาดโต้รุ่งอุดรธานีเริ่มปรับปรุงและขยายพื้นที่การค้า เพื่อรองรับนักท่องเที่ยวและชาวบ้าน คาดเสร็จปีหน้า",
      category: "ข่าวท้องถิ่น",
      time: "4 ชั่วโมงที่แล้ว",
      views: "892",
    }
  ];

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

  // Filter and process real news data
  const localNews = allNews ? allNews
    .filter(news => news.category.includes('ท้องถิ่น') || news.category.includes('local'))
    .map((news): ProcessedNewsItem => ({
      id: news.id,
      title: news.title,
      summary: news.summary,
      category: news.category,
      time: getTimeAgo(news.createdAt),
      views: `${Math.floor(Math.random() * 2000 + 500)}`,
      image: news.imageUrl,
      isBreaking: news.isBreaking
    }))
    .sort((a, b) => new Date().getTime() - new Date().getTime()) : [];

  // Combine real news with mock data
  const allLocalNews = [...localNews, ...mockLocalNews];

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
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-kanit">ข่าวท้องถิ่นอุดรธานี</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground font-sarabun">
              ข่าวสารท้องถิ่น กิจกรรม และเหตุการณ์สำคัญในจังหวัดอุดรธานี
            </p>
            <Badge variant="outline" className="font-sarabun">
              {allLocalNews.length} ข่าว
            </Badge>
          </div>
        </div>

        {/* News Grid */}
        {allLocalNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allLocalNews.map((news, index) => (
              <NewsCard key={news.id || index} {...news} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏛️</div>
            <h3 className="text-xl font-bold font-kanit mb-2">ยังไม่มีข่าวท้องถิ่น</h3>
            <p className="text-muted-foreground font-sarabun mb-4">
              ลองดูข่าวในหมวดอื่นๆ หรือกลับสู่หน้าหลัก
            </p>
            <Button onClick={() => setLocation('/')} className="font-sarabun">
              กลับสู่หน้าหลัก
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Local;
