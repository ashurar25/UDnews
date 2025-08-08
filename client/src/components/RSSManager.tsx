
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
import { Rss, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RssFeed {
  id: number;
  title: string;
  url: string;
  description: string | null;
  category: string;
  isActive: boolean;
}

interface RssFeedForm {
  title: string;
  url: string;
  description: string;
  category: string;
  isActive: boolean;
}

const RSSManager = () => {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<RssFeed | null>(null);
  const [formData, setFormData] = useState<RssFeedForm>({
    title: "",
    url: "",
    description: "",
    category: "ทั่วไป",
    isActive: true,
  });
  const { toast } = useToast();

  const categories = [
    "ทั่วไป",
    "ข่าวท้องถิ่น",
    "การเมือง",
    "กีฬา",
    "บันเทิง",
    "เศรษฐกิจ",
    "เทคโนโลยี"
  ];

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const response = await fetch("/api/rss-feeds");
      if (response.ok) {
        const feedsData = await response.json();
        setFeeds(feedsData);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูล RSS Feed ได้",
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
      const url = editingFeed ? `/api/rss-feeds/${editingFeed.id}` : "/api/rss-feeds";
      const method = editingFeed ? "PUT" : "POST";

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
          description: editingFeed ? "แก้ไข RSS Feed สำเร็จ" : "เพิ่ม RSS Feed สำเร็จ",
        });
        fetchFeeds();
        resetForm();
        setIsDialogOpen(false);
      } else {
        throw new Error("Failed to save RSS feed");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึก RSS Feed ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ RSS Feed นี้?")) {
      return;
    }

    try {
      const response = await fetch(`/api/rss-feeds/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "สำเร็จ!",
          description: "ลบ RSS Feed สำเร็จ",
        });
        fetchFeeds();
      } else {
        throw new Error("Failed to delete RSS feed");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบ RSS Feed ได้",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (feed: RssFeed) => {
    setEditingFeed(feed);
    setFormData({
      title: feed.title,
      url: feed.url,
      description: feed.description || "",
      category: feed.category,
      isActive: feed.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingFeed(null);
    setFormData({
      title: "",
      url: "",
      description: "",
      category: "ทั่วไป",
      isActive: true,
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Card className="hover:shadow-warm transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg font-kanit flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            จัดการ RSS Feed
          </CardTitle>
          <CardDescription className="font-sarabun">
            เพิ่ม แก้ไข และลบ RSS Feed ของเว็บไซต์
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-sarabun">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่ม RSS Feed
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-kanit">
                {editingFeed ? "แก้ไข RSS Feed" : "เพิ่ม RSS Feed ใหม่"}
              </DialogTitle>
              <DialogDescription className="font-sarabun">
                กรอกข้อมูล RSS Feed ที่ต้องการ{editingFeed ? "แก้ไข" : "เพิ่ม"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="font-sarabun">ชื่อ RSS Feed</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="เช่น ข่าวทั่วไป"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url" className="font-sarabun">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/rss.xml"
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
                  <Label htmlFor="description" className="font-sarabun">คำอธิบาย</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="คำอธิบายเกี่ยวกับ RSS Feed นี้"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="font-sarabun">เปิดใช้งาน</Label>
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
                  {editingFeed ? "บันทึกการแก้ไข" : "เพิ่ม RSS Feed"}
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
        ) : feeds.length === 0 ? (
          <div className="text-center py-8">
            <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-sarabun">ยังไม่มี RSS Feed</p>
            <p className="text-sm text-muted-foreground font-sarabun">
              คลิกปุ่ม "เพิ่ม RSS Feed" เพื่อเริ่มต้น
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sarabun">ชื่อ</TableHead>
                  <TableHead className="font-sarabun">หมวดหมู่</TableHead>
                  <TableHead className="font-sarabun">URL</TableHead>
                  <TableHead className="font-sarabun">สถานะ</TableHead>
                  <TableHead className="font-sarabun">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell className="font-sarabun font-medium">
                      {feed.title}
                      {feed.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {feed.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-sarabun">
                        {feed.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">
                      {feed.url}
                    </TableCell>
                    <TableCell>
                      <Badge variant={feed.isActive ? "default" : "outline"} className="font-sarabun">
                        {feed.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(feed)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(feed.id)}
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

export default RSSManager;
