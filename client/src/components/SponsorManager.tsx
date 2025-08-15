import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ExternalLink, Eye, Calendar } from "lucide-react";
import { z } from "zod";
import { api } from "@/lib/api";
import type { SponsorBanner, InsertSponsorBanner } from "@shared/schema";
import { insertSponsorBannerSchema } from "@shared/schema";

const formSchema = insertSponsorBannerSchema.extend({
  endDate: z.string().optional(),
  startDate: z.string(),
});

type FormData = z.infer<typeof formSchema>;

const SponsorManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SponsorBanner | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["/api/sponsor-banners"],
    queryFn: async () => api.get<SponsorBanner[]>("/api/sponsor-banners"),
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      imageUrl: "",
      linkUrl: "",
      position: "sidebar",
      isActive: true,
      displayOrder: 0,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSponsorBanner) => api.post("/api/sponsor-banners", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor-banners"] });
      toast({ title: "สร้างแบนเนอร์สปอนเซอร์สำเร็จ" });
      setIsDialogOpen(false);
      form.reset();
      setEditingBanner(null);
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างแบนเนอร์ได้",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSponsorBanner> }) =>
      api.put(`/api/sponsor-banners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor-banners"] });
      toast({ title: "อัพเดทแบนเนอร์สปอนเซอร์สำเร็จ" });
      setIsDialogOpen(false);
      form.reset();
      setEditingBanner(null);
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทแบนเนอร์ได้",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/sponsor-banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor-banners"] });
      toast({ title: "ลบแบนเนอร์สปอนเซอร์สำเร็จ" });
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบแบนเนอร์ได้",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const bannerData: InsertSponsorBanner = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    };

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: bannerData });
    } else {
      createMutation.mutate(bannerData);
    }
  };

  const handleEdit = (banner: SponsorBanner) => {
    setEditingBanner(banner);
    form.reset({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      position: banner.position,
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
      startDate: new Date(banner.startDate).toISOString().split('T')[0],
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบแบนเนอร์นี้?")) {
      deleteMutation.mutate(id);
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case "header": return "ส่วนหัว";
      case "sidebar": return "แถบข้าง";
      case "footer": return "ส่วนท้าย";
      case "between_news": return "ระหว่างข่าว";
      default: return position;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "header": return "bg-blue-100 text-blue-800";
      case "sidebar": return "bg-green-100 text-green-800";
      case "footer": return "bg-purple-100 text-purple-800";
      case "between_news": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-kanit">จัดการแบนเนอร์สปอนเซอร์</h2>
          <p className="text-muted-foreground font-sarabun">
            จัดการโฆษณาและแบนเนอร์สปอนเซอร์ในเว็บไซต์
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingBanner(null);
                form.reset();
              }}
              className="font-sarabun"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มแบนเนอร์
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-kanit">
                {editingBanner ? "แก้ไขแบนเนอร์สปอนเซอร์" : "เพิ่มแบนเนอร์สปอนเซอร์ใหม่"}
              </DialogTitle>
              <DialogDescription className="font-sarabun">
                กรอกข้อมูลแบนเนอร์สปอนเซอร์ที่จะแสดงในเว็บไซต์
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-sarabun">ชื่อแบนเนอร์</FormLabel>
                      <FormControl>
                        <Input placeholder="ชื่อแบนเนอร์สปอนเซอร์" {...field} className="font-sarabun" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-sarabun">URL รูปภาพ</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/banner.jpg" {...field} className="font-sarabun" />
                      </FormControl>
                      <FormDescription className="font-sarabun text-xs">
                        ลิงก์รูปภาพแบนเนอร์ (ขนาดแนะนำ: 400x200px)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-sarabun">URL ปลายทาง</FormLabel>
                      <FormControl>
                        <Input placeholder="https://sponsor-website.com" {...field} className="font-sarabun" />
                      </FormControl>
                      <FormDescription className="font-sarabun text-xs">
                        ลิงก์ที่จะเปิดเมื่อคลิกแบนเนอร์
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-sarabun">ตำแหน่งแสดง</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-sarabun">
                            <SelectValue placeholder="เลือกตำแหน่งแสดงแบนเนอร์" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="header" className="font-sarabun">ส่วนหัว</SelectItem>
                          <SelectItem value="sidebar" className="font-sarabun">แถบข้าง</SelectItem>
                          <SelectItem value="footer" className="font-sarabun">ส่วนท้าย</SelectItem>
                          <SelectItem value="between_news" className="font-sarabun">ระหว่างข่าว</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sarabun">ลำดับการแสดง</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="font-sarabun"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="font-sarabun">เปิดใช้งาน</FormLabel>
                          <FormDescription className="font-sarabun text-xs">
                            แบนเนอร์จะแสดงในเว็บไซต์
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sarabun">วันที่เริ่มต้น</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="font-sarabun" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sarabun">วันที่สิ้นสุด (ไม่บังคับ)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="font-sarabun" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="font-sarabun"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="font-sarabun"
                  >
                    {editingBanner ? "อัพเดท" : "สร้าง"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {banners.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground font-sarabun">
                  ยังไม่มีแบนเนอร์สปอนเซอร์
                </p>
              </CardContent>
            </Card>
          ) : (
            banners.map((banner) => (
              <Card key={banner.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-kanit text-lg">{banner.title}</CardTitle>
                      <CardDescription className="font-sarabun">
                        {banner.linkUrl}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`font-sarabun ${getPositionColor(banner.position)}`}>
                        {getPositionLabel(banner.position)}
                      </Badge>
                      {banner.isActive ? (
                        <Badge variant="default" className="bg-green-500 font-sarabun">เปิดใช้</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-sarabun">ปิดใช้</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-start">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-32 h-20 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTAwTDE2MCA4MEwyMDAgNjBMMjQwIDgwTDIwMCAxMDBaIiBmaWxsPSIjOUI5QkE0Ii8+PC9zdmc+';
                      }}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span className="font-sarabun">{banner.clickCount} คลิก</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="font-sarabun">
                            {new Date(banner.startDate).toLocaleDateString('th-TH')} - 
                            {banner.endDate ? new Date(banner.endDate).toLocaleDateString('th-TH') : 'ไม่กำหนด'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(banner)}
                          className="font-sarabun"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          แก้ไข
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(banner.id)}
                          className="font-sarabun text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          ลบ
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(banner.linkUrl, '_blank')}
                          className="font-sarabun"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          ดูเว็บไซต์
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SponsorManager;