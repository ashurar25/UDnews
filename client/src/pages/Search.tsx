
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar } from "lucide-react";
import { NewsItem, ProcessedNewsItem } from "@/types/news";
import MetaHead from "@/components/MetaHead";

const SearchPage = () => {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  
  // Extract search query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1]);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
    // load recent queries
    try {
      const raw = localStorage.getItem('ud_search_history');
      if (raw) setRecentQueries(JSON.parse(raw));
    } catch {}
  }, [location]);

  // Fetch all news for searching
  const { data: allNews, isLoading } = useQuery({
    queryKey: ['/api/news'],
    queryFn: async (): Promise<NewsItem[]> => {
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    }
  });

  // Filter and search news
  const searchResults = allNews?.filter((news: NewsItem) => {
    const matchesQuery = searchQuery === "" || 
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || news.category === categoryFilter;
    
    return matchesQuery && matchesCategory;
  }) || [];

  // Sort results
  const sortedResults = [...searchResults].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "title":
        return a.title.localeCompare(b.title, 'th');
      default: // relevance
        return 0;
    }
  });

  const processedResults: ProcessedNewsItem[] = sortedResults.map((news: NewsItem) => ({
    id: news.id,
    title: news.title,
    summary: news.summary,
    category: news.category,
    time: getTimeAgo(news.createdAt),
    views: `${Math.floor(Math.random() * 5000 + 100)}`,
    image: news.imageUrl || "/placeholder.svg",
    isBreaking: news.isBreaking,
    size: "medium" as const
  }));

  // Suggestions derived from titles
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [] as string[];
    const q = searchQuery.toLowerCase();
    const titles = (allNews || []).map(n => n.title).filter(Boolean);
    const unique = Array.from(new Set(
      titles.filter(t => t.toLowerCase().includes(q))
    ));
    return unique.slice(0, 8);
  }, [allNews, searchQuery]);

  function getTimeAgo(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now.getTime() - created.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'เมื่อสักครู่';
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 วันที่แล้ว';
    return `${diffInDays} วันที่แล้ว`;
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`);
    // persist recent queries
    try {
      const trimmed = query.trim();
      if (trimmed) {
        const next = [trimmed, ...recentQueries.filter(q => q !== trimmed)].slice(0, 8);
        setRecentQueries(next);
        localStorage.setItem('ud_search_history', JSON.stringify(next));
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <MetaHead
        title={searchQuery ? `ค้นหา: ${searchQuery} | UD News Update` : 'ค้นหาข่าว | UD News Update'}
        description={searchQuery ? `ผลการค้นหาสำหรับ "${searchQuery}"` : 'ค้นหาข่าวล่าสุดจาก UD News Update'}
        url={searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : '/search'}
        canonical={`https://udnewsupdate.sbs/search`}
        noindex
        siteName="UD News Update"
        type="website"
        locale="th_TH"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold font-kanit">ค้นหาข่าว</h1>
          </div>
          
          <SearchBar 
            onSearch={handleSearch}
            placeholder="ค้นหาข่าวสาร..."
            className="max-w-2xl"
          />

          {/* Recent searches */}
          {recentQueries.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground font-sarabun">ค้นหาล่าสุด:</span>
              {recentQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSearch(q)}
                  className="text-sm px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition font-sarabun"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 max-w-2xl bg-background border rounded-md shadow-sm overflow-hidden">
              {suggestions.map((s, idx) => (
                <button
                  key={s + idx}
                  onClick={() => handleSearch(s)}
                  className="w-full text-left px-4 py-2 hover:bg-accent font-sarabun"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Info & Filters */}
        {searchQuery && (
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-sarabun">ผลการค้นหาสำหรับ:</span>
                <Badge variant="outline" className="font-sarabun text-base px-3 py-1">
                  "{searchQuery}"
                </Badge>
                <span className="text-muted-foreground font-sarabun">
                  ({searchResults.length} รายการ)
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40 font-sarabun">
                      <SelectValue placeholder="หมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="ข่าวท้องถิ่น">ข่าวท้องถิ่น</SelectItem>
                      <SelectItem value="ข่าวการเมือง">ข่าวการเมือง</SelectItem>
                      <SelectItem value="ข่าวกีฬา">ข่าวกีฬา</SelectItem>
                      <SelectItem value="ข่าวบันเทิง">ข่าวบันเทิง</SelectItem>
                      <SelectItem value="ข่าวอาชญากรรม">ข่าวอาชญากรรม</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 font-sarabun">
                      <SelectValue placeholder="เรียงตาม" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">ความเกี่ยวข้อง</SelectItem>
                      <SelectItem value="date">วันที่ล่าสุด</SelectItem>
                      <SelectItem value="title">ชื่อข่าว</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-48 mb-4"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : searchQuery === "" ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold font-kanit text-muted-foreground mb-2">
              ค้นหาข่าวสาร
            </h2>
            <p className="text-muted-foreground font-sarabun">
              ใส่คำค้นหาเพื่อค้นหาข่าวที่สนใจ
            </p>
          </div>
        ) : processedResults.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold font-kanit text-muted-foreground mb-2">
              ไม่พบผลการค้นหา
            </h2>
            <p className="text-muted-foreground font-sarabun mb-4">
              ไม่พบข่าวที่ตรงกับคำค้นหา "{searchQuery}"
            </p>
            <Button 
              variant="outline" 
              onClick={() => handleSearch("")}
              className="font-sarabun"
            >
              ล้างการค้นหา
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedResults.map((news) => (
              <NewsCard key={news.id} {...news} />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default SearchPage;
