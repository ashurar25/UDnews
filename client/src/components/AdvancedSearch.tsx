import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import NewsCard from "@/components/NewsCard";

interface SearchFilters {
  query: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
}

interface AdvancedSearchProps {
  onClose?: () => void;
}

const AdvancedSearch = ({ onClose }: AdvancedSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all",
    dateFrom: "",
    dateTo: "",
    sortBy: "date"
  });
  const [isSearching, setIsSearching] = useState(false);

  const categories = [
    { value: "all", label: "ทุกหมวดหมู่" },
    { value: "ข่าวท้องถิ่น", label: "ข่าวท้องถิ่น" },
    { value: "การเมือง", label: "การเมือง" },
    { value: "กีฬา", label: "กีฬา" },
    { value: "บันเทิง", label: "บันเทิง" },
    { value: "เศรษฐกิจ", label: "เศรษฐกิจ" },
    { value: "ข่าวด่วน", label: "ข่าวด่วน" },
    { value: "ข่าวทั่วไป", label: "ข่าวทั่วไป" }
  ];

  const sortOptions = [
    { value: "date", label: "วันที่ล่าสุด" },
    { value: "popularity", label: "ความนิยม" },
    { value: "relevance", label: "ความเกี่ยวข้อง" }
  ];

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/news/search', filters],
    queryFn: async () => {
      if (!isSearching) return null;
      
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const response = await fetch(`/api/news/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: isSearching,
  });

  const handleSearch = () => {
    setIsSearching(true);
  };

  const handleReset = () => {
    setFilters({
      query: "",
      category: "all",
      dateFrom: "",
      dateTo: "",
      sortBy: "date"
    });
    setIsSearching(false);
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-kanit">
            <Search className="h-5 w-5" />
            ค้นหาข่าวขั้นสูง
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Query */}
          <div className="space-y-2">
            <label className="text-sm font-semibold font-kanit">คำค้นหา</label>
            <Input
              placeholder="พิมพ์คำที่ต้องการค้นหา..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              className="font-sarabun"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold font-kanit">หมวดหมู่</label>
              <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger className="font-sarabun">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-semibold font-kanit">จากวันที่</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="font-sarabun"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-semibold font-kanit">ถึงวันที่</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="font-sarabun"
              />
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-semibold font-kanit">เรียงตาม</label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger className="font-sarabun">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSearch} className="gap-2" disabled={isLoading}>
              <Search className="h-4 w-4" />
              {isLoading ? "กำลังค้นหา..." : "ค้นหา"}
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <Filter className="h-4 w-4" />
              ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {isSearching && (
        <Card>
          <CardHeader>
            <CardTitle className="font-kanit">
              ผลการค้นหา 
              {searchResults && ` (${searchResults.length} รายการ)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-48 mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((news: any) => (
                  <NewsCard
                    key={news.id}
                    id={news.id}
                    title={news.title}
                    summary={news.summary}
                    category={news.category}
                    time={new Date(news.createdAt).toLocaleDateString('th-TH')}
                    views={`${Math.floor(Math.random() * 3000 + 500)}`}
                    image={news.imageUrl}
                    isBreaking={news.isBreaking}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  <Search className="h-12 w-12 mx-auto opacity-30" />
                </div>
                <p className="text-muted-foreground font-sarabun">
                  ไม่พบข่าวที่ตรงกับเงื่อนไขการค้นหา
                </p>
                <p className="text-sm text-muted-foreground font-sarabun mt-1">
                  ลองเปลี่ยนคำค้นหาหรือปรับเงื่อนไขใหม่
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;