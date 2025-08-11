import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Eye, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // Fixed: เพิ่ม queryFn ที่ขาดหาย
  const { data: news = [], isLoading, error } = useQuery({
    queryKey: ["/api/news"],
    queryFn: async (): Promise<News[]> => {
      const response = await fetch("/api/news");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createNewsMutation = useMutation({
    mutationFn: async (data: NewsFormData): Promise<News> => {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create news");
      return response.json();
    },
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewsFormData> }): Promise<News> => {
      const response = await fetch(`/api/news/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update news");
      return response.json();
    },
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
      const response = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete news");
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
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNews) {
      updateNewsMutation.mutate({ id: editingNews.id, data: formData });
    } else {
      createNewsMutation.mutate(formData);
    }
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.toString()}
          </div>
        </CardContent>
      </Card>
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
        <Card>
          <CardHeader>
            <CardTitle>{editingNews ? "แก้ไขข่าว" : "เพิ่มข่าวใหม่"}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* News List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">กำลังโหลดข้อมูล...</div>
            </CardContent>
          </Card>
        ) : news.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">ยังไม่มีข่าวในระบบ</div>
            </CardContent>
          </Card>
        ) : (
          news.map((newsItem) => (
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
      </div>
    </div>
  );
}