
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, RefreshCw, Play, Pause, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RSSFeed {
  id: number;
  title: string;
  url: string;
  category: string;
  isActive: boolean;
  lastProcessed?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

interface RSSFormData {
  title: string;
  url: string;
  category: string;
  isActive: boolean;
}

interface ProcessingStatus {
  isProcessing: boolean;
  autoProcessingEnabled: boolean;
  lastProcessed: Record<string, string>;
}

const CATEGORIES = [
  { value: "local", label: "ข่าวท้องถิ่น" },
  { value: "politics", label: "การเมือง" },
  { value: "crime", label: "อาชญากรรม" },
  { value: "sports", label: "กีฬา" },
  { value: "entertainment", label: "บันเทิง" },
  { value: "general", label: "ทั่วไป" }
];

export default function RSSManager() {
  const [editingFeed, setEditingFeed] = useState<RSSFeed | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<RSSFormData>({
    title: "",
    url: "",
    category: "general",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fixed: เพิ่ม queryFn ที่ขาดหาย
  const { data: feeds = [], isLoading, error } = useQuery({
    queryKey: ["/api/rss-feeds"],
    queryFn: async (): Promise<RSSFeed[]> => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch("/api/rss-feeds", {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: processingStatus } = useQuery({
    queryKey: ["/api/rss/status"],
    queryFn: async (): Promise<ProcessingStatus> => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch("/api/rss/status", {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const createFeedMutation = useMutation({
    mutationFn: async (data: RSSFormData): Promise<RSSFeed> => {
      const response = await fetch("/api/rss-feeds", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': localStorage.getItem('adminToken') ? `Bearer ${localStorage.getItem('adminToken')}` : ''
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create RSS feed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds"] });
      toast({ title: "สำเร็จ", description: "เพิ่ม RSS Feed ใหม่แล้ว" });
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถเพิ่ม RSS Feed ได้",
        variant: "destructive" 
      });
    },
  });

  const updateFeedMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RSSFormData> }): Promise<RSSFeed> => {
      const response = await fetch(`/api/rss-feeds/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': localStorage.getItem('adminToken') ? `Bearer ${localStorage.getItem('adminToken')}` : ''
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update RSS feed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds"] });
      toast({ title: "สำเร็จ", description: "แก้ไข RSS Feed แล้ว" });
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถแก้ไข RSS Feed ได้",
        variant: "destructive" 
      });
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/rss-feeds/${id}`, { 
        method: "DELETE",
        headers: {
          'Authorization': localStorage.getItem('adminToken') ? `Bearer ${localStorage.getItem('adminToken')}` : ''
        }
      });
      if (!response.ok) throw new Error("Failed to delete RSS feed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rss-feeds"] });
      toast({ title: "สำเร็จ", description: "ลบ RSS Feed แล้ว" });
    },
    onError: () => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถลบ RSS Feed ได้",
        variant: "destructive" 
      });
    },
  });

  const processAllFeedsMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await fetch("/api/rss/process", { 
        method: "POST",
        headers: {
          'Authorization': localStorage.getItem('adminToken') ? `Bearer ${localStorage.getItem('adminToken')}` : ''
        }
      });
      if (!response.ok) throw new Error("Failed to process feeds");
    },
    onSuccess: () => {
      toast({ title: "สำเร็จ", description: "เริ่มประมวลผล RSS Feeds แล้ว" });
      queryClient.invalidateQueries({ queryKey: ["/api/rss/status"] });
    },
    onError: () => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถประมวลผล RSS ได้",
        variant: "destructive" 
      });
    },
  });

  const processSingleFeedMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/rss/process/${id}`, { 
        method: "POST",
        headers: {
          'Authorization': localStorage.getItem('adminToken') ? `Bearer ${localStorage.getItem('adminToken')}` : ''
        }
      });
      if (!response.ok) throw new Error("Failed to process feed");
    },
    onSuccess: () => {
      toast({ title: "สำเร็จ", description: "ประมวลผล RSS Feed แล้ว" });
      queryClient.invalidateQueries({ queryKey: ["/api/rss/status"] });
    },
    onError: () => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถประมวลผล RSS Feed ได้",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      url: "",
      category: "general",
      isActive: true
    });
    setEditingFeed(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFeed) {
      updateFeedMutation.mutate({ id: editingFeed.id, data: formData });
    } else {
      createFeedMutation.mutate(formData);
    }
  };

  const handleEdit = (feed: RSSFeed) => {
    setEditingFeed(feed);
    setFormData({
      title: feed.title,
      url: feed.url,
      category: feed.category,
      isActive: feed.isActive
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteFeedMutation.mutate(id);
  };

  const handleProcessAll = () => {
    processAllFeedsMutation.mutate();
  };

  const handleProcessSingle = (id: number) => {
    processSingleFeedMutation.mutate(id);
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
        <div>
          <h2 className="text-2xl font-bold">จัดการ RSS Feeds</h2>
          <p className="text-gray-600">จัดการแหล่งข่าวจาก RSS Feeds</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleProcessAll} 
            disabled={processAllFeedsMutation.isPending || processingStatus?.isProcessing}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${processAllFeedsMutation.isPending ? 'animate-spin' : ''}`} />
            ประมวลผลทั้งหมด
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            เพิ่ม RSS Feed
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {processingStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              สถานะการประมวลผล
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={processingStatus.isProcessing ? "default" : "secondary"}>
                {processingStatus.isProcessing ? "กำลังประมวลผล" : "พร้อมใช้งาน"}
              </Badge>
              <Badge variant={processingStatus.autoProcessingEnabled ? "default" : "secondary"}>
                ประมวลผลอัตโนมัติ: {processingStatus.autoProcessingEnabled ? "เปิด" : "ปิด"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RSS Feed Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingFeed ? "แก้ไข RSS Feed" : "เพิ่ม RSS Feed ใหม่"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">ชื่อ RSS Feed *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="เช่น ข่าวสาร XYZ"
                  required
                />
              </div>

              <div>
                <Label htmlFor="url">URL ของ RSS Feed *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/rss.xml"
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isActive">เปิดใช้งาน RSS Feed</Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createFeedMutation.isPending || updateFeedMutation.isPending}
                >
                  {editingFeed ? "แก้ไข" : "เพิ่ม"} RSS Feed
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* RSS Feeds List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">กำลังโหลดข้อมูล...</div>
            </CardContent>
          </Card>
        ) : feeds.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">ยังไม่มี RSS Feeds ในระบบ</div>
            </CardContent>
          </Card>
        ) : (
          feeds.map((feed) => (
            <Card key={feed.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {feed.title}
                      {feed.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{getCategoryLabel(feed.category)}</Badge>
                      <Badge variant={feed.isActive ? "default" : "secondary"}>
                        {feed.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                      </Badge>
                      {feed.lastProcessed && (
                        <Badge variant="outline">
                          ประมวลผลล่าสุด: {formatDate(feed.lastProcessed)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProcessSingle(feed.id)}
                      disabled={processSingleFeedMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className={`h-3 w-3 ${processSingleFeedMutation.isPending ? 'animate-spin' : ''}`} />
                      ประมวลผล
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(feed)}
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
                            คุณแน่ใจหรือไม่ที่จะลบ RSS Feed "{feed.title}" การกระทำนี้ไม่สามารถย้อนกลับได้
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(feed.id)}
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
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>URL:</strong> {feed.url}
                  </p>
                  {feed.lastError && (
                    <p className="text-sm text-red-600">
                      <strong>ข้อผิดพลาดล่าสุด:</strong> {feed.lastError}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    สร้างเมื่อ: {formatDate(feed.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
