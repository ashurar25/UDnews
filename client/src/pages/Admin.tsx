import { ThemeToggle } from "@/components/ThemeToggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Users,
  FileText,
  BarChart3,
  Home,
  Newspaper,
  Rss,
  Image,
  Palette,
  Monitor,
  UserCog,
  Database,
  Sun,
  Moon,
  Clock,
  Mail,
  LogOut,
  MessageSquare,
  FolderOpen
} from "lucide-react"
import { Link } from "wouter"
// Components will be lazy loaded
// AnalyticsDashboard will be lazy loaded
import { useTheme } from "@/components/ThemeProvider"
import { useQuery } from "@tanstack/react-query"
import React, { useState, useEffect, useCallback, Suspense } from "react"
import { useLocation } from "wouter"
import { useToast } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="text-red-600">เกิดข้อผิดพลาด</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">เกิดข้อผิดพลาดในการโหลดส่วนของผู้ดูแลระบบ</p>
        <p className="text-sm text-gray-500 mb-4">ข้อผิดพลาด: {error.message}</p>
        <Button onClick={resetErrorBoundary}>ลองใหม่</Button>
      </CardContent>
    </Card>
  );
}

// Lazy load components
const LazyNewsManager = React.lazy(() => import("@/components/NewsManager"));
const LazyRSSManager = React.lazy(() => import("@/components/RSSManager"));
const LazySponsorManager = React.lazy(() => import("@/components/SponsorManager"));
const LazyContactMessagesManager = React.lazy(() => import("@/components/ContactMessagesManager"));
const LazyAnalyticsDashboard = React.lazy(() => import("@/components/AnalyticsDashboard"));
const LazyThemeSettings = React.lazy(() => import("@/components/ThemeSettings"));
const LazyUserManager = React.lazy(() => import("@/components/UserManager"));
const LazyCommentManager = React.lazy(() => import("@/components/CommentManager"));
const LazyNewsletterManager = React.lazy(() => import("@/components/NewsletterManager"));
const LazyPushNotificationManager = React.lazy(() => import("@/components/PushNotificationManager"));
const LazySystemSettings = React.lazy(() => import("@/components/SystemSettings"));
const LazyMediaManager = React.lazy(() => import("@/components/MediaManager"));
const LazyCategoryManager = React.lazy(() => import("@/components/CategoryManager"));
const LazyDatabaseManager = React.lazy(() => import("@/components/DatabaseManager"));


function AdminContent() {
  const { setTheme } = useTheme()
  const [, setLocation] = useLocation()
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview")
  const [systemStats, setSystemStats] = useState({
    totalNews: 0,
    totalMessages: 0,
    totalFeeds: 0
  });

  const fetchSystemStats = useCallback(async () => {
    try {
      const [newsRes, statsRes] = await Promise.all([
        fetch('/api/news?limit=1'),
        fetch('/api/database/stats')
      ]);

      if (newsRes.ok && statsRes.ok) {
        const stats = await statsRes.json();
        setSystemStats({
          totalNews: stats.newsCount || 0,
          totalMessages: stats.contactMessagesCount || 0,
          totalFeeds: stats.rssFeedsCount || 0
        });
      } else {
         console.error("Failed to fetch stats. News response:", newsRes.status, "Stats response:", statsRes.status);
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchSystemStats();
  }, [fetchSystemStats]);


  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    toast({
      title: "ออกจากระบบสำเร็จ",
      description: "คุณได้ออกจากระบบผู้ดูแลเรียบร้อยแล้ว",
    });
    setLocation('/');
  };

  // Fetch real database stats
  const { data: newsData } = useQuery({
    queryKey: ['/api/news'],
    queryFn: async () => {
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    }
  })

  const { data: rssFeedsData } = useQuery({
    queryKey: ['/api/rss-feeds'],
    queryFn: async () => {
      const response = await fetch('/api/rss-feeds');
      if (!response.ok) throw new Error('Failed to fetch RSS feeds');
      return response.json();
    }
  })

  const { data: sponsorBannersData } = useQuery({
    queryKey: ['/api/sponsor-banners'],
    queryFn: async () => {
      const response = await fetch('/api/sponsor-banners');
      if (!response.ok) throw new Error('Failed to fetch sponsor banners');
      return response.json();
    }
  })

  const { data: databaseStats } = useQuery({
    queryKey: ['/api/database/stats'],
    queryFn: async () => {
      const response = await fetch('/api/database/stats');
      if (!response.ok) throw new Error('Failed to fetch database stats');
      return response.json();
    },
    refetchInterval: 30000
  })

  const { data: systemInfo } = useQuery({
    queryKey: ['/api/system-info'],
    queryFn: async () => {
      const response = await fetch('/api/system-info');
      if (!response.ok) throw new Error('Failed to fetch system info');
      return response.json();
    },
    refetchInterval: 60000
  })

  const newsStats = Array.isArray(newsData) ? newsData.length : 0
  const rssFeeds = Array.isArray(rssFeedsData) ? rssFeedsData.length : 0
  const sponsorBanners = Array.isArray(sponsorBannersData) ? sponsorBannersData.length : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="border-b border-orange-200 bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors">
                <Home className="h-5 w-5" />
                <span className="text-sm font-sarabun font-medium">กลับหน้าหลัก</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-3xl font-bold text-orange-800 font-kanit">แอดมิน UD News</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="font-sarabun bg-orange-100 text-orange-700 hover:bg-orange-200">
                ผู้ดูแลระบบ
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-sarabun border-red-300 text-red-600 hover:bg-red-50"
              >
                ออกจากระบบ
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
              <h2 className="text-2xl font-bold">สถิติและการวิเคราะห์</h2>
            </div>
            <React.Suspense fallback={<LoadingSpinner />}>
              <LazyAnalyticsDashboard />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="news">
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการข่าว</h3>
              <React.Suspense fallback={<LoadingSpinner />}>
                <LazyNewsManager />
              </React.Suspense>
            </div>
          </TabsContent>

          <TabsContent value="rss">
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการ RSS Feeds</h3>
              <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 font-kanit text-purple-700">
                    <Rss className="h-5 w-5" />
                    จัดการ RSS Feeds
                  </CardTitle>
                  <CardDescription className="font-sarabun">
                    จัดการแหล่งข่าวอัตโนมัติ
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <LazyRSSManager />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sponsors">
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการแบนเนอร์สปอนเซอร์</h3>
              <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 font-kanit text-green-700">
                    <Image className="h-5 w-5" />
                    จัดการแบนเนอร์สปอนเซอร์
                  </CardTitle>
                  <CardDescription className="font-sarabun">
                    จัดการโฆษณาและแบนเนอร์
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <LazySponsorManager />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="themes">
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">การตั้งค่ารูปลักษณ์</h3>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyThemeSettings />
              </Suspense>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 font-kanit text-blue-700">
                      <Image className="h-5 w-5" />
                      จัดการไฟล์มีเดีย
                    </CardTitle>
                    <CardDescription className="font-sarabun">
                      อัปโหลดและจัดการไฟล์รูปภาพ วิดีโอ และเอกสาร
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <React.Suspense fallback={<LoadingSpinner />}>
                      <LazyMediaManager />
                    </React.Suspense>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 font-kanit text-green-700">
                      <FolderOpen className="h-5 w-5" />
                      จัดการหมวดหมู่
                    </CardTitle>
                    <CardDescription className="font-sarabun">
                      สร้างและจัดการหมวดหมู่ข่าว
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <React.Suspense fallback={<LoadingSpinner />}>
                      <LazyCategoryManager />
                    </React.Suspense>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 font-kanit text-pink-700">
                    <Palette className="h-5 w-5" />
                    การตั้งค่าธีมพื้นฐาน
                  </CardTitle>
                  <CardDescription className="font-sarabun">
                    เปลี่ยนธีมสีของเว็บไซต์ และทดสอบธีมวันสำคัญ
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">ธีมปัจจุบัน</h3>
                          <p className="text-sm text-muted-foreground">
                            เปลี่ยนธีมของเว็บไซต์ - รองรับโหมดอัตโนมัติตามเวลา
                          </p>
                        </div>
                        <ThemeToggle />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setTheme("light")}
                          className="p-4 h-auto flex-col gap-2"
                        >
                          <Sun className="h-8 w-8" />
                          <span>โหมดสว่าง</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setTheme("dark")}
                          className="p-4 h-auto flex-col gap-2"
                        >
                          <Moon className="h-8 w-8" />
                          <span>โหมดมืด</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setTheme("auto")}
                          className="p-4 h-auto flex-col gap-2 relative"
                        >
                          <Clock className="h-8 w-8" />
                          <span>อัตโนมัติ</span>
                          <div className="text-xs text-muted-foreground">
                            18:00-06:00
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setTheme("system")}
                          className="p-4 h-auto flex-col gap-2"
                        >
                          <Monitor className="h-8 w-8" />
                          <span>ตามระบบ</span>
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="text-lg font-semibold font-kanit text-orange-700 mb-4">ทดสอบธีมวันสำคัญ</h4>
                      <p className="text-sm text-gray-600 font-sarabun mb-4">คลิกเพื่อดูธีมสำหรับวันสำคัญต่างๆ ของไทย</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-auto p-3 text-xs font-sarabun border-yellow-300 text-yellow-700 hover:bg-yellow-50 flex flex-col items-center gap-1"
                          onClick={() => {
                            const root = document.documentElement;
                            root.classList.remove("light", "dark", "royal-yellow", "mothers-blue", "fathers-yellow", "national-tricolor", "constitution-gold", "buddhist-saffron", "songkran-blue");
                            root.classList.add("thai-special", "royal-yellow");
                            const style = root.style;
                            style.setProperty('--primary', '45 93% 58%');
                            style.setProperty('--secondary', '43 74% 66%');
                            style.setProperty('--accent', '38 92% 50%');
                          }}
                        >
                          <div className="w-4 h-4 bg-yellow-400 rounded-full mb-1"></div>
                          วันเฉลิมพระชนมพรรษา
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-auto p-3 text-xs font-sarabun border-blue-300 text-blue-700 hover:bg-blue-50 flex flex-col items-center gap-1"
                          onClick={() => {
                            const root = document.documentElement;
                            root.classList.remove("light", "dark", "royal-yellow", "mothers-blue", "fathers-yellow", "national-tricolor", "constitution-gold", "buddhist-saffron", "songkran-blue");
                            root.classList.add("thai-special", "mothers-blue");
                            const style = root.style;
                            style.setProperty('--primary', '214 100% 59%');
                            style.setProperty('--secondary', '213 94% 68%');
                            style.setProperty('--accent', '212 100% 45%');
                          }}
                        >
                          <div className="w-4 h-4 bg-blue-500 rounded-full mb-1"></div>
                          วันแม่แห่งชาติ
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-auto p-3 text-xs font-sarabun border-yellow-300 text-yellow-700 hover:bg-yellow-50 flex flex-col items-center gap-1"
                          onClick={() => {
                            const root = document.documentElement;
                            root.classList.remove("light", "dark", "royal-yellow", "mothers-blue", "fathers-yellow", "national-tricolor", "constitution-gold", "buddhist-saffron", "songkran-blue");
                            root.classList.add("thai-special", "fathers-yellow");
                            const style = root.style;
                            style.setProperty('--primary', '45 93% 58%');
                            style.setProperty('--secondary', '43 74% 66%');
                            style.setProperty('--accent', '38 92% 50%');
                          }}
                        >
                          <div className="w-4 h-4 bg-yellow-400 rounded-full mb-1"></div>
                          วันพ่อแห่งชาติ
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-auto p-3 text-xs font-sarabun border-red-300 text-red-700 hover:bg-red-50 flex flex-col items-center gap-1"
                          onClick={() => {
                            const root = document.documentElement;
                            root.classList.remove("light", "dark", "royal-yellow", "mothers-blue", "fathers-yellow", "national-tricolor", "constitution-gold", "buddhist-saffron", "songkran-blue");
                            root.classList.add("thai-special", "national-tricolor");
                            const style = root.style;
                            style.setProperty('--primary', '0 72% 51%');
                            style.setProperty('--secondary', '220 100% 50%');
                            style.setProperty('--accent', '0 0% 100%');
                          }}
                        >
                          <div className="flex gap-1 mb-1">
                            <div className="w-1 h-4 bg-red-500"></div>
                            <div className="w-1 h-4 bg-white border"></div>
                            <div className="w-1 h-4 bg-blue-500"></div>
                          </div>
                          วันชาติ
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-auto p-3 text-xs font-sarabun border-orange-300 text-orange-700 hover:bg-orange-50 flex flex-col items-center gap-1"
                          onClick={() => {
                            const root = document.documentElement;
                            root.classList.remove("light", "dark", "royal-yellow", "mothers-blue", "fathers-yellow", "national-tricolor", "constitution-gold", "buddhist-saffron", "songkran-blue");
                            root.classList.add("thai-special", "constitution-gold");
                            const style = root.style;
                            style.setProperty('--primary', '38 92% 50%');
                            style.setProperty('--secondary', '45 93% 58%');
                            style.setProperty('--accent', '0 0% 95%');
                          }}
                        >
                          <div className="w-4 h-4 bg-orange-400 rounded-full mb-1"></div>
                          วันรัฐธรรมนูญ
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-auto p-3 text-xs font-sarabun border-orange-400 text-orange-800 hover:bg-orange-50 flex flex-col items-center gap-1"
                          onClick={() => {
                            const root = document.documentElement;
                            root.classList.remove("light", "dark", "royal-yellow", "mothers-blue", "fathers-yellow", "national-tricolor", "constitution-gold", "buddhist-saffron", "songkran-blue");
                            root.classList.add("thai-special", "buddhist-saffron");
                            const style = root.style;
                            style.setProperty('--primary', '33 100% 50%');
                            style.setProperty('--secondary', '35 85% 60%');
                            style.setProperty('--accent', '30 95% 40%');
                          }}
                        >
                          <div className="w-4 h-4 bg-amber-500 rounded-full mb-1"></div>
                          วันมาฆบูชา
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-auto p-3 text-xs font-sarabun border-cyan-300 text-cyan-700 hover:bg-cyan-50 flex flex-col items-center gap-1"
                          onClick={() => {
                            const root = document.documentElement;
                            root.classList.remove("light", "dark", "royal-yellow", "mothers-blue", "fathers-yellow", "national-tricolor", "constitution-gold", "buddhist-saffron", "songkran-blue");
                            root.classList.add("thai-special", "songkran-blue");
                            const style = root.style;
                            style.setProperty('--primary', '195 100% 50%');
                            style.setProperty('--secondary', '200 100% 70%');
                            style.setProperty('--accent', '190 100% 42%');
                          }}
                        >
                          <div className="w-4 h-4 bg-cyan-400 rounded-full mb-1"></div>
                          วันสงกรานต์
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-auto p-3 text-xs font-sarabun border-gray-300 text-gray-700 hover:bg-gray-50 flex flex-col items-center gap-1"
                          onClick={() => {
                            const root = document.documentElement;
                            root.classList.remove("light", "dark", "thai-special", "royal-yellow", "mothers-blue", "fathers-yellow", "national-tricolor", "constitution-gold", "buddhist-saffron", "songkran-blue");
                            root.classList.add("light");
                            const style = root.style;
                            style.removeProperty('--primary');
                            style.removeProperty('--secondary');
                            style.removeProperty('--accent');
                          }}
                        >
                          <div className="w-4 h-4 bg-gray-400 rounded-full mb-1"></div>
                          รีเซ็ตธีม
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system">
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">การจัดการระบบ</h3>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 font-kanit text-blue-700">
                      <UserCog className="h-5 w-5" />
                      จัดการผู้ใช้
                    </CardTitle>
                    <CardDescription className="font-sarabun">
                      ดูรายชื่อและจัดการสิทธิ์ผู้ใช้
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="font-sarabun text-sm">ผู้ใช้ออนไลน์</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">24</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="font-sarabun text-sm">ผู้ดูแลระบบ</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">3</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button size="sm" className="w-full font-sarabun bg-blue-600 hover:bg-blue-700">
                          ดูรายชื่อ
                        </Button>
                        <Button variant="outline" size="sm" className="w-full font-sarabun border-blue-300 text-blue-600 hover:bg-blue-50">
                          จัดการสิทธิ์
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 font-kanit text-green-700">
                      <Monitor className="h-5 w-5" />
                      การตรวจสอบระบบ
                    </CardTitle>
                    <CardDescription className="font-sarabun">
                      ตรวจสอบสถานะและประสิทธิภาพระบบ
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="font-sarabun text-sm">สถานะเซิร์ฟเวอร์</span>
                        <Badge className="bg-green-500 text-white">ปกติ</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="font-sarabun text-sm">การใช้งาน CPU</span>
                        <Badge variant="outline" className="border-yellow-400 text-yellow-700">45%</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button size="sm" className="w-full font-sarabun bg-green-600 hover:bg-green-700">
                          ดูสถานะ
                        </Button>
                        <Button variant="outline" size="sm" className="w-full font-sarabun border-green-300 text-green-600 hover:bg-green-50">
                          รายงานข้อผิดพลาด
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-xl shadow-lg border border-orange-100 md:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 font-kanit text-purple-700">
                      <Database className="h-5 w-5" />
                      จัดการฐานข้อมูล
                    </CardTitle>
                    <CardDescription className="font-sarabun">
                      สำรองข้อมูลและบำรุงรักษาฐานข้อมูล
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700">
                          {(databaseStats as any)?.newsCount ?? newsStats}
                        </div>
                        <div className="text-sm font-sarabun text-purple-600">ข่าวทั้งหมด</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">
                          {(databaseStats as any)?.rssFeedsCount ?? rssFeeds}
                        </div>
                        <div className="text-sm font-sarabun text-blue-600">RSS Feeds</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {(databaseStats as any)?.sponsorBannersCount ?? sponsorBanners}
                        </div>
                        <div className="text-sm font-sarabun text-green-600">แบนเนอร์</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-700">
                          {(databaseStats as any)?.totalUsers ?? 0}
                        </div>
                        <div className="text-sm font-sarabun text-yellow-600">ผู้ใช้งาน</div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                      <h4 className="text-lg font-bold text-orange-700 mb-3 font-kanit">ข้อมูลการเชื่อมต่อฐานข้อมูล</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sarabun">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-orange-600">ประเภทฐานข้อมูล:</span>
                            <span className="text-orange-800 font-medium">{(systemInfo as any)?.database?.provider ?? "PostgreSQL"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-600">เซิร์ฟเวอร์:</span>
                            <span className="text-orange-800 font-mono text-xs">
                              {(systemInfo as any)?.database?.host || "dpg-d2a2dp2dbo4c73at42ug-a.singapore-postgres.render.com"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-600">พอร์ต:</span>
                            <span className="text-orange-800 font-mono">{(systemInfo as any)?.database?.port ?? "5432"}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-orange-600">ฐานข้อมูล:</span>
                            <span className="text-orange-800 font-mono text-xs">
                              {(systemInfo as any)?.database?.database || "udnewsdb_8d2c"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-600">SSL:</span>
                            <span className={`font-medium ${(systemInfo as any)?.database?.ssl === 'Enabled' ? 'text-green-600' : 'text-red-600'}`}>
                              {(systemInfo as any)?.database?.ssl ?? "Enabled"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-600">สภาพแวดล้อม:</span>
                            <span className={`font-medium ${(systemInfo as any)?.environment === 'production' ? 'text-green-600' : 'text-blue-600'}`}>
                              {(systemInfo as any)?.environment ?? "development"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                      <Button size="sm" variant="outline" className="font-sarabun border-purple-300 text-purple-600 hover:bg-purple-50">
                        สำรองข้อมูล
                      </Button>
                      <Button size="sm" variant="outline" className="font-sarabun border-blue-300 text-blue-600 hover:bg-blue-50">
                        กู้คืนข้อมูล
                      </Button>
                      <Button size="sm" variant="outline" className="font-sarabun border-orange-300 text-orange-600 hover:bg-orange-50">
                        ล้างแคช
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <LazyContactMessagesManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <LazyUserManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="comments" className="space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <LazyCommentManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <LazyNewsletterManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <LazyPushNotificationManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <LazySystemSettings />
            </Suspense>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <LazyDatabaseManager />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('admin-token');
        if (!token) {
          setLocation('/login');
          return;
        }

        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Token invalid');
        }

        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('admin-token');
        setLocation('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AdminContent />
    </ErrorBoundary>
  );
}