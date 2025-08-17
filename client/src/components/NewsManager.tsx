import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard, GlassCardHeader } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Eye, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface News {
  id: number;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  category: string;
  author?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface NewsFormData {
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  category: string;
  author?: string;
}

const CATEGORIES = [
  { value: "local", label: "ข่าวท้องถิ่น" },
  { value: "politics", label: "การเมือง" },
  { value: "crime", label: "อาชญากรรม" },
  { value: "sports", label: "กีฬา" },
  { value: "entertainment", label: "บันเทิง" },
  { value: "general", label: "ทั่วไป" }
];

export default function NewsManager() {
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [formData, setFormData] = useState<NewsFormData>({
    title: "",
    content: "",
    summary: "",
    imageUrl: "",
    category: "general",
    author: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fixed: เพิ่ม queryFn ที่ขาดหาย และ authentication token
  const { data: news = [], isLoading, error } = useQuery({
    queryKey: ["/api/news"],
    queryFn: async (): Promise<News[]> => api.get("/api/news", { auth: false }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createNewsMutation = useMutation({
    mutationFn: async (data: NewsFormData): Promise<News> => api.post("/api/news", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "สำเร็จ", description: "เพิ่มข่าวใหม่แล้ว" });
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถเพิ่มข่าวได้",
        variant: "destructive" 
      });
    },
  });

  const updateNewsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewsFormData> }): Promise<News> =>
      api.put(`/api/news/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "สำเร็จ", description: "แก้ไขข่าวแล้ว" });
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถแก้ไขข่าวได้",
        variant: "destructive" 
      });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/api/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "สำเร็จ", description: "ลบข่าวแล้ว" });
    },
    onError: () => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถลบข่าวได้",
        variant: "destructive" 
      });
    },
  });

  const validateNewsContent = (content: string) => {
    // Remove HTML tags for accurate length check
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    return {
      isValid: textContent.length >= 50, // Minimum 50 characters
      length: textContent.length
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate content length
    const contentValidation = validateNewsContent(formData.content);
    if (!contentValidation.isValid) {
      toast({
        title: 'เนื้อหาข่าวสั้นเกินไป',
        description: `เนื้อหาข่าวต้องมีความยาวอย่างน้อย 50 ตัวอักษร (ปัจจุบัน ${contentValidation.length} ตัวอักษร)`,
        variant: 'destructive'
      });
      return;
    }

    // Validate title length
    if (formData.title.length < 10) {
      toast({
        title: 'หัวข้อข่าวสั้นเกินไป',
        description: 'หัวข้อข่าวต้องมีความยาวอย่างน้อย 10 ตัวอักษร',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingNews) {
        await updateNewsMutation.mutateAsync({
          id: editingNews.id,
          data: formData
        });
      } else {
        await createNewsMutation.mutateAsync(formData);
      }
      
      // Reset form after successful submission
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving news:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกข่าวได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      summary: "",
      imageUrl: "",
      category: "general",
      author: ""
    });
    setEditingNews(null);
  };

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      summary: newsItem.summary || "",
      imageUrl: newsItem.imageUrl || "",
      category: newsItem.category,
      author: newsItem.author || ""
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteNewsMutation.mutate(id);
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(cat => cat.value === category)?.label || category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH');
  };

  // Filter and pagination logic
  const filteredNews = news.filter((newsItem) => {
    const matchesSearch = 
      newsItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      newsItem.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (newsItem.author && newsItem.author.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || newsItem.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setCurrentPage(1);
  };

  if (error) {
    return (
      <GlassCard>
        <div className="p-6 text-center text-red-600">
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.toString()}
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">จัดการข่าว</h2>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มข่าวใหม่
        </Button>
      </div>

      {/* News Form */}
      {isFormOpen && (
        <GlassCard
          header={
            <GlassCardHeader title={editingNews ? "แก้ไขข่าว" : "เพิ่มข่าวใหม่"} />
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">หัวข้อข่าว *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="ใส่หัวข้อข่าว"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">หมวดหมู่ *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="author">ผู้เขียน</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="ชื่อผู้เขียน"
                />
              </div>

              <div>
                <Label htmlFor="summary">สรุปข่าว</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="สรุปเนื้อหาข่าวสั้นๆ"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">URL รูปภาพ</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
              </div>

              <div>
                <Label htmlFor="content">เนื้อหาข่าว *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="เขียนเนื้อหาข่าวที่นี่"
                  rows={8}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createNewsMutation.isPending || updateNewsMutation.isPending}
                >
                  {editingNews ? "แก้ไข" : "เพิ่ม"}ข่าว
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  ยกเลิก
                </Button>
              </div>
            </form>
        </GlassCard>
      )}

      {/* Search and Filter Controls */}
      <GlassCard className="p-0">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium">ค้นหาข่าว</Label>
              <Input
                id="search"
                placeholder="ค้นหาจากหัวข้อ, เนื้อหา, หรือผู้เขียน..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="category-filter" className="text-sm font-medium">หมวดหมู่</Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="h-10">
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600">
            พบ {filteredNews.length.toLocaleString()} ข่าว
            {selectedCategory !== 'all' && (
              <span> ในหมวดหมู่ {getCategoryLabel(selectedCategory)}</span>
            )}
            {searchTerm && (
              <span> สำหรับคำค้น "{searchTerm}"</span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* News List */}
      <div className="space-y-4">
        {isLoading ? (
          <GlassCard>
            <div className="p-6 text-center">กำลังโหลดข้อมูล...</div>
          </GlassCard>
        ) : filteredNews.length === 0 ? (
          <GlassCard>
            <div className="p-6 text-center text-gray-500">
              {searchTerm || selectedCategory 
                ? "ไม่พบข่าวที่ตรงกับเงื่อนไขการค้นหา" 
                : "ยังไม่มีข่าวในระบบ"
              }
            </div>
          </GlassCard>
        ) : (
          currentNews.map((newsItem) => (
            <Card key={newsItem.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{newsItem.title}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{getCategoryLabel(newsItem.category)}</Badge>
                      {newsItem.author && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {newsItem.author}
                        </Badge>
                      )}
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(newsItem.publishedAt)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(newsItem)}
                      className="flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      แก้ไข
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />
                          ลบ
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                          <AlertDialogDescription>
                            คุณแน่ใจหรือไม่ที่จะลบข่าว "{newsItem.title}" การกระทำนี้ไม่สามารถย้อนกลับได้
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(newsItem.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            ลบ
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {newsItem.summary && (
                  <p className="text-gray-600 mb-3 italic">"{newsItem.summary}"</p>
                )}
                <p className="text-sm text-gray-500 line-clamp-3">
                  {newsItem.content.substring(0, 200)}...
                </p>
                {newsItem.imageUrl && (
                  <div className="mt-3">
                    <img 
                      src={newsItem.imageUrl} 
                      alt={newsItem.title}
                      className="w-full h-40 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  แสดง {startIndex + 1}-{Math.min(endIndex, filteredNews.length)} จาก {filteredNews.length} ข่าว
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ก่อนหน้า
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-10 h-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}