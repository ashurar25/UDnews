
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, Calendar, Eye, MessageCircle, Heart, Clock, ArrowUpDown } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import MetaTags from '@/components/MetaTags';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  category: string;
  author: string;
  publishedAt: string;
  source: string;
  originalUrl: string;
  viewCount?: number;
  isBreaking?: boolean;
  tags?: string[];
}

const categories = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'breaking', label: 'ข่าวด่วน' },
  { value: 'local', label: 'ข่าวท้องถิ่น' },
  { value: 'politics', label: 'การเมือง' },
  { value: 'sports', label: 'กีฬา' },
  { value: 'entertainment', label: 'บันเทิง' },
  { value: 'economy', label: 'เศรษฐกิจ' },
  { value: 'technology', label: 'เทคโนโลยี' },
  { value: 'health', label: 'สุขภาพ' },
  { value: 'education', label: 'การศึกษา' },
  { value: 'crime', label: 'อาชญากรรม' },
  { value: 'weather', label: 'สภาพอากาศ' },
  { value: 'traffic', label: 'การจราจร' },
];

const sortOptions = [
  { value: 'latest', label: 'ล่าสุด' },
  { value: 'popular', label: 'ยอดนิยม' },
  { value: 'breaking', label: 'ข่าวด่วน' },
  { value: 'oldest', label: 'เก่าสุด' },
];

const AllNews: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const itemsPerPage = 20;

  const { data: news = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/news', { limit: 1000, offset: 0 }],
    queryFn: () => apiRequest('/api/news?limit=1000&offset=0'),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Filter and sort news
  useEffect(() => {
    let filtered = [...news];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'breaking') {
        filtered = filtered.filter(item => item.isBreaking === true);
      } else {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }
    }

    // Sort news
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'oldest':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'popular':
          return (b.viewCount || 0) - (a.viewCount || 0);
        case 'breaking':
          if (a.isBreaking && !b.isBreaking) return -1;
          if (!a.isBreaking && b.isBreaking) return 1;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredNews(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [news, searchQuery, selectedCategory, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, endIndex);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      breaking: 'bg-red-500 hover:bg-red-600',
      local: 'bg-blue-500 hover:bg-blue-600',
      politics: 'bg-purple-500 hover:bg-purple-600',
      sports: 'bg-green-500 hover:bg-green-600',
      entertainment: 'bg-pink-500 hover:bg-pink-600',
      economy: 'bg-orange-500 hover:bg-orange-600',
      technology: 'bg-cyan-500 hover:bg-cyan-600',
      health: 'bg-emerald-500 hover:bg-emerald-600',
      education: 'bg-indigo-500 hover:bg-indigo-600',
      crime: 'bg-red-600 hover:bg-red-700',
      weather: 'bg-sky-500 hover:bg-sky-600',
      traffic: 'bg-yellow-500 hover:bg-yellow-600',
    };
    return colors[category] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getCategoryName = (category: string): string => {
    const categoryObj = categories.find(cat => cat.value === category);
    return categoryObj?.label || category;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
    
    return format(date, 'dd MMMM yyyy', { locale: th });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">เกิดข้อผิดพลาดในการโหลดข่าว</p>
            <Button onClick={() => refetch()}>ลองใหม่</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <MetaTags 
        title="ข่าวทั้งหมด - อัพเดทข่าวอุดร - UD News Update"
        description="ติดตามข่าวสารทั้งหมดจากอุดรธานีและภาคอีสาน ข่าวท้องถิ่น การเมือง กีฬา บันเทิง และอื่นๆ อีกมากมาย"
        keywords="ข่าว, อุดรธานี, ภาคอีสาน, ข่าวท้องถิ่น, การเมือง, กีฬา, บันเทิง"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-kanit mb-4">
              ข่าวทั้งหมด
            </h1>
            <p className="text-muted-foreground font-sarabun text-lg">
              ติดตามข่าวสารล่าสุดจากอุดรธานีและภาคอีสาน
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-kanit">
                <Filter className="h-5 w-5" />
                ตัวกรอง & ค้นหา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="ค้นหาข่าว..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 font-sarabun"
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="font-sarabun">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value} className="font-sarabun">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="font-sarabun">
                    <SelectValue placeholder="เรียงตาม" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="font-sarabun">
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground font-sarabun">
                  พบ {filteredNews.length.toLocaleString()} ข่าว
                  {searchQuery && ` จากการค้นหา "${searchQuery}"`}
                  {selectedCategory !== 'all' && ` ในหมวด "${getCategoryName(selectedCategory)}"`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* News Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold font-kanit mb-2">ไม่พบข่าวที่ตรงกับเงื่อนไข</h3>
                <p className="text-muted-foreground font-sarabun mb-4">
                  ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSortBy('latest');
                  }}
                >
                  ล้างตัวกรอง
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentNews.map((item) => (
                  <Card key={item.id} className="group hover:shadow-lg transition-shadow duration-200">
                    <div className="relative">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-t-lg flex items-center justify-center">
                          <div className="text-6xl">📰</div>
                        </div>
                      )}
                      
                      {/* Breaking News Badge */}
                      {item.isBreaking && (
                        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white font-kanit">
                          🚨 ข่าวด่วน
                        </Badge>
                      )}
                      
                      {/* Category Badge */}
                      <Badge 
                        className={`absolute top-2 right-2 text-white font-kanit ${getCategoryColor(item.category)}`}
                      >
                        {getCategoryName(item.category)}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-4">
                      <Link href={`/news/${item.id}`}>
                        <h3 className="font-semibold font-kanit text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                      
                      <p className="text-muted-foreground font-sarabun text-sm mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-sarabun mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(item.publishedAt)}
                        </span>
                        <span>โดย {item.author}</span>
                      </div>
                      
                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs font-sarabun">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs font-sarabun">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <Separator className="my-3" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {(item.viewCount || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            0
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            0
                          </span>
                        </div>
                        
                        <Link href={`/news/${item.id}`}>
                          <Button size="sm" variant="ghost" className="font-sarabun">
                            อ่านต่อ
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground font-sarabun">
                        แสดง {startIndex + 1}-{Math.min(endIndex, filteredNews.length)} จาก {filteredNews.length} ข่าว
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="font-sarabun"
                        >
                          ก่อนหน้า
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNumber)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNumber}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="font-sarabun"
                        >
                          ถัดไป
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AllNews;
