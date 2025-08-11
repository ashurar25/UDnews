
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Rss, Plus, Edit, Trash2, Save, X, Play, Pause, RefreshCw, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface RssFeed {
  id: number;
  title: string;
  url: string;
  category: string;
  isActive: boolean;
  lastFetched: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RssForm {
  title: string;
  url: string;
  category: string;
  isActive: boolean;
}

const RSSManager = () => {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<RssFeed | null>(null);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [formData, setFormData] = useState<RssForm>({
    title: "",
    url: "",
    category: "ข่าวท้องถิ่น",
    isActive: true,
  });
  const { toast } = useToast();

  const categories = [
    "ข่าวท้องถิ่น",
    "การเมือง",
    "อาชญากรรม",
    "กีฬา",
    "บันเทิง",
    "เศรษฐกิจ",
    "การศึกษา",
    "เทคโนโลยี",
    "สุขภาพ"
  ];

  const { data: feedsData, isLoading: queryLoading, refetch } = useQuery({
    queryKey: ['rss-feeds-manager'],
    queryFn: async () => {
      const response = await fetch("/api/rss-feeds");
      if (!response.ok) {
        throw new Error('Failed to fetch RSS feeds');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  const { data: autoProcessingStatus } = useQuery({
    queryKey: ['rss-auto-processing-status'],
    queryFn: async () => {
      const response = await fetch("/api/rss/auto-processing/status");
      if (!response.ok) {
        throw new Error('Failed to fetch auto-processing status');
      }
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (feedsData) {
      setFeeds(feedsData);
    }
    setIsLoading(queryLoading);
  }, [feedsData, queryLoading]);

  useEffect(() => {
    if (autoProcessingStatus) {
      setIsAutoProcessing(autoProcessingStatus.isRunning || false);
    }
  }, [autoProcessingStatus]);

  const fetchFeeds = async () => {
    try {
      await refetch();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูล RSS feeds ได้",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingFeed ? `/api/rss-feeds/${editingFeed.id}` : "/api/rss-feeds";
      const method = editingFeed ? "PUT" : "POST";

      const token = localStorage.getItem('adminToken');
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "สำเร็จ!",
          description: editingFeed ? "แก้ไข RSS feed สำเร็จ" : "เพิ่ม RSS feed สำเร็จ",
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
        description: "ไม่สามารถบันทึก RSS feed ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ RSS feed นี้?")) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/rss-feeds/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "สำเร็จ!",
          description: "ลบ RSS feed สำเร็จ",
        });
        fetchFeeds();
      } else {
        throw new Error("Failed to delete RSS feed");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบ RSS feed ได้",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (feed: RssFeed) => {
    setEditingFeed(feed);
    setFormData({
      title: feed.title,
      url: feed.url,
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
      category: "ข่าวท้องถิ่น",
      isActive: true,
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleProcessFeed = async (id: number) => {
    try {
      setProcessingStatus(`Processing feed ${id}...`);
      const response = await fetch(`/api/rss/process/${id}`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "สำเร็จ!",
          description: result.message,
        });
        fetchFeeds();
      } else {
        throw new Error("Failed to process RSS feed");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถประมวลผล RSS feed ได้",
        variant: "destructive",
      });
    } finally {
      setProcessingStatus("");
    }
  };

  const handleProcessAllFeeds = async () => {
    try {
      setProcessingStatus("Processing all feeds...");
      const response = await fetch("/api/rss/process", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "สำเร็จ!",
          description: "เริ่มประมวลผล RSS feeds ทั้งหมดแล้ว",
        });
        fetchFeeds();
      } else {
        throw new Error("Failed to process all RSS feeds");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถประมวลผล RSS feeds ได้",
        variant: "destructive",
      });
    } finally {
      setProcessingStatus("");
    }
  };

  const toggleAutoProcessing = async () => {
    try {
      const endpoint = isAutoProcessing ? "/api/rss/auto/stop" : "/api/rss/auto/start";
      const response = await fetch(endpoint, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        setIsAutoProcessing(!isAutoProcessing);
        toast({
          title: "สำเร็จ!",
          description: result.message,
        });
      } else {
        throw new Error("Failed to toggle auto processing");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเปลี่ยนสถานะการประมวลผลอัตโนมัติได้",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "ยังไม่เคยดึงข้อมูล";
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
            <Rss className="h-5 w-5 text-primary" />
            จัดการ RSS Feeds
          </CardTitle>
          <CardDescription className="font-sarabun">
            จัดการแหล่งข่าวอัตโนมัติ RSS
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={toggleAutoProcessing}
            className="font-sarabun"
          >
            {isAutoProcessing ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                หยุดอัตโนมัติ
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                เปิดอัตโนมัติ
              </>
            )}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="font-sarabun">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่ม RSS Feed
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
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
                      placeholder="ชื่อแหล่งข่าว"
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
                      placeholder="https://example.com/rss"
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
        </div>
      </CardHeader>
      <CardContent>
        {/* Auto Processing Status */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-sarabun text-sm text-blue-700">การประมวลผลอัตโนมัติ</span>
            </div>
            <div className="flex items-center gap-2">
              {isAutoProcessing ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Badge className="bg-green-100 text-green-700 font-sarabun">ทำงานอยู่</Badge>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <Badge variant="secondary" className="font-sarabun">หยุดทำงาน</Badge>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-blue-600 font-sarabun mt-1">
            {isAutoProcessing ? "ประมวลผลอัตโนมัติทุก 30 นาที" : "การประมวลผลอัตโนมัติถูกปิด"}
          </p>
        </div>

        {/* Processing Status */}
        {processingStatus && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-orange-600 animate-spin" />
              <span className="text-sm text-orange-700 font-sarabun">{processingStatus}</span>
            </div>
          </div>
        )}

        {/* Process All Button */}
        <div className="mb-6">
          <Button
            onClick={handleProcessAllFeeds}
            disabled={isLoading || !!processingStatus}
            className="font-sarabun bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            ประมวลผล RSS ทั้งหมดทันที
          </Button>
        </div>

        {isLoading && !processingStatus ? (
          <div className="text-center py-4">
            <p className="font-sarabun">กำลังโหลด...</p>
          </div>
        ) : feeds.length === 0 ? (
          <div className="text-center py-8">
            <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-sarabun">ยังไม่มี RSS feeds</p>
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
                  <TableHead className="font-sarabun">URL</TableHead>
                  <TableHead className="font-sarabun">หมวดหมู่</TableHead>
                  <TableHead className="font-sarabun">สถานะ</TableHead>
                  <TableHead className="font-sarabun">ดึงข้อมูลล่าสุด</TableHead>
                  <TableHead className="font-sarabun">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell className="font-sarabun">
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{feed.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <a 
                          href={feed.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs font-mono truncate block"
                        >
                          {feed.url}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-sarabun">
                        {feed.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {feed.isActive ? (
                          <Badge className="bg-green-100 text-green-700 font-sarabun">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-sarabun">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            ปิดใช้งาน
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-sarabun text-sm">
                      {formatDate(feed.lastFetched)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcessFeed(feed.id)}
                          disabled={!!processingStatus}
                          className="h-8 w-8 p-0"
                          title="ประมวลผลทันที"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
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
