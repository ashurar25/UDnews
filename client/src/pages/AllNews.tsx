import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar } from "lucide-react";

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

const AllNews = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedNews, setAllLoadedNews] = useState<NewsItem[]>([]);

  const itemsPerPage = 100;

  // Fetch news with pagination
  const { data: newsData, isLoading, isFetching } = useQuery({
    queryKey: ['/api/news', currentPage],
    queryFn: async (): Promise<NewsItem[]> => {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await fetch(`/api/news?limit=${itemsPerPage}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch news');
      const newNews = await response.json();
      
      // เพิ่มข่าวใหม่เข้าไปในรายการเดิม
      if (currentPage === 1) {
        setAllLoadedNews(newNews);
      } else {
        setAllLoadedNews(prev => [...prev, ...newNews]);
      }
      
      return newNews;
    },
    enabled: true
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

  // Filter and sort news
  const filteredNews = allLoadedNews
    .filter(news => {
      const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           news.summary.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || news.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "breaking":
          if (a.isBreaking && !b.isBreaking) return -1;
          if (!a.isBreaking && b.isBreaking) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  
  // ฟังก์ชันโหลดข่าวเพิ่มเติม
  const loadMoreNews = () => {
    setCurrentPage(prev => prev + 1);
  };
  
  // รีเซ็ตเมื่อมีการค้นหาหรือเปลี่ยนหมวดหมู่
  const handleSearchOrFilterChange = () => {
    setCurrentPage(1);
    setAllLoadedNews([]);
  };

  // Show loading state while initial data is loading
  if (isLoading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get unique categories
  const categories = allLoadedNews ? Array.from(new Set(allLoadedNews.map((news: NewsItem) => news.category))) : [];



  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-kanit mb-2">ข่าวทั้งหมด</h1>
          <p className="text-muted-foreground font-sarabun">
            ข่าวสารล่าสุดทั้งหมด ทั้งข่าวด่วน ข่าวท้องถิ่น และข่าวทั่วไป
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาข่าว..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearchOrFilterChange();
                }}
                className="pl-10 font-sarabun"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              handleSearchOrFilterChange();
            }}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="เรียงตาม" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">ใหม่ล่าสุด</SelectItem>
                <SelectItem value="oldest">เก่าสุด</SelectItem>
                <SelectItem value="breaking">ข่าวด่วนก่อน</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-sarabun">
                พบ {filteredNews.length} ข่าว
              </Badge>
              {selectedCategory !== "all" && (
                <Badge className="font-sarabun">
                  หมวด: {selectedCategory}
                </Badge>
              )}
            </div>

            {(searchTerm || selectedCategory !== "all") && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="font-sarabun"
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </div>

        {/* News Grid */}
        {filteredNews.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((news) => (
                <NewsCard 
                  key={news.id} 
                  id={news.id}
                  title={news.title}
                  summary={news.summary}
                  category={news.category}
                  time={getTimeAgo(news.createdAt)}
                  views={`${Math.floor(Math.random() * 3000 + 500)}`}
                  image={news.imageUrl}
                  isBreaking={news.isBreaking}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {!isFetching && newsData && newsData.length === itemsPerPage && (
              <div className="text-center mt-8">
                <Button 
                  onClick={loadMoreNews}
                  variant="outline"
                  size="lg"
                  className="font-sarabun px-8 py-3"
                  disabled={isFetching}
                >
                  {isFetching ? 'กำลังโหลด...' : 'โหลดข่าวเพิ่มเติม (100 ข่าวต่อครั้ง)'}
                </Button>
              </div>
            )}
            
            {/* Loading indicator */}
            {isFetching && (
              <div className="text-center mt-8">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="font-sarabun">กำลังโหลดข่าวเพิ่มเติม...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-xl font-bold font-kanit mb-2">ไม่พบข่าวที่ตรงกับเงื่อนไข</h3>
            <p className="text-muted-foreground font-sarabun mb-4">
              ลองปรับเปลี่ยนคำค้นหาหรือหมวดหมู่
            </p>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="font-sarabun"
            >
              ดูข่าวทั้งหมด
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AllNews;