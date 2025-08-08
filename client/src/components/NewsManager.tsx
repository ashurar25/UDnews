import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string | null;
  isBreaking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NewsForm {
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  isBreaking: boolean;
}

const NewsManager = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState<NewsForm>({
    title: "",
    summary: "",
    content: "",
    category: "ข่าวท้องถิ่น",
    imageUrl: "",
    isBreaking: false,
  });
  const { toast } = useToast();

  const categories = [
    "ข่าวท้องถิ่น",
    "การเมือง",
    "กีฬา",
    "บันเทิง",
    "เศรษฐกิจ",
    "การศึกษา",
    "เทคโนโลยี",
    "สุขภาพ"
  ];

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch("/api/news");
      if (response.ok) {
        const newsData = await response.json();
        setNews(newsData);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลข่าวได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingNews ? `/api/news/${editingNews.id}` : "/api/news";
      const method = editingNews ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "สำเร็จ!",
          description: editingNews ? "แก้ไขข่าวสำเร็จ" : "เพิ่มข่าวสำเร็จ",
        });
        fetchNews();
        resetForm();
        setIsDialogOpen(false);
      } else {
        throw new Error("Failed to save news article");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข่าวได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบข่าวนี้?")) {
      return;
    }

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "สำเร็จ!",
          description: "ลบข่าวสำเร็จ",
        });
        fetchNews();
      } else {
        throw new Error("Failed to delete news article");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข่าวได้",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingNews(article);
    setFormData({
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      imageUrl: article.imageUrl || "",
      isBreaking: article.isBreaking,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingNews(null);
    setFormData({
      title: "",
      summary: "",
      content: "",
      category: "ข่าวท้องถิ่น",
      imageUrl: "",
      isBreaking: false,
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-warm transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg font-kanit flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            จัดการข่าว
          </CardTitle>
          <CardDescription className="font-sarabun">
            เพิ่ม แก้ไข และลบข่าวสารของเว็บไซต์
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-sarabun">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มข่าวใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-kanit">
                {editingNews ? "แก้ไขข่าว" : "เพิ่มข่าวใหม่"}
              </DialogTitle>
              <DialogDescription className="font-sarabun">
                กรอกข้อมูลข่าวที่ต้องการ{editingNews ? "แก้ไข" : "เพิ่ม"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="font-sarabun">หัวข้อข่าว</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="หัวข้อข่าว"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="summary" className="font-sarabun">สรุปข่าว</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="สรุปข่าวสั้น ๆ"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content" className="font-sarabun">เนื้อหาข่าว</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="เนื้อหาข่าวทั้งหมด"
                    rows={6}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category" className="font-sarabun">หมวดหมู่</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl" className="font-sarabun">URL รูปภาพ</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isBreaking"
                    checked={formData.isBreaking}
                    onCheckedChange={(checked) => setFormData({ ...formData, isBreaking: checked })}
                  />
                  <Label htmlFor="isBreaking" className="font-sarabun">ข่าวด่วน</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="font-sarabun"
                >
                  <X className="h-4 w-4 mr-2" />
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isLoading} className="font-sarabun">
                  <Save className="h-4 w-4 mr-2" />
                  {editingNews ? "บันทึกการแก้ไข" : "เพิ่มข่าว"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <p className="font-sarabun">กำลังโหลด...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-sarabun">ยังไม่มีข่าว</p>
            <p className="text-sm text-muted-foreground font-sarabun">
              คลิกปุ่ม "เพิ่มข่าวใหม่" เพื่อเริ่มต้น
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sarabun">หัวข้อ</TableHead>
                  <TableHead className="font-sarabun">หมวดหมู่</TableHead>
                  <TableHead className="font-sarabun">สถานะ</TableHead>
                  <TableHead className="font-sarabun">วันที่สร้าง</TableHead>
                  <TableHead className="font-sarabun">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-sarabun">
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {article.summary}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-sarabun">
                        {article.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {article.isBreaking && (
                          <Badge variant="destructive" className="font-sarabun text-xs">
                            ข่าวด่วน
                          </Badge>
                        )}
                        <Badge variant="outline" className="font-sarabun text-xs">
                          ปกติ
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-sarabun text-sm">
                      {formatDate(article.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(article)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(article.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsManager;