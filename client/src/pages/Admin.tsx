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
  Clock
} from "lucide-react"
import { Link } from "wouter"
import RSSManager from "@/components/RSSManager"
import NewsManager from "@/components/NewsManager"
import SponsorManager from "@/components/SponsorManager"
import { useTheme } from "next-themes"

const Admin = () => {
  const { setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Admin Header */}
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
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats Overview */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold font-kanit text-orange-800 mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            ภาพรวมระบบ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">127</p>
                    <p className="text-sm opacity-90">ข่าวทั้งหมด</p>
                  </div>
                  <Newspaper className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">1,234</p>
                    <p className="text-sm opacity-90">ผู้เข้าชมวันนี้</p>
                  </div>
                  <Users className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-sm opacity-90">RSS Feeds</p>
                  </div>
                  <Rss className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">95%</p>
                    <p className="text-sm opacity-90">อัพไทม์</p>
                  </div>
                  <Monitor className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="mb-8" />

        {/* Main Admin Interface with Tabs */}
        <section>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-orange-200 rounded-lg p-1 mb-6">
              <TabsTrigger 
                value="content" 
                className="flex items-center gap-2 font-sarabun data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
              >
                <FileText className="h-4 w-4" />
                จัดการเนื้อหา
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="flex items-center gap-2 font-sarabun data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
              >
                <Palette className="h-4 w-4" />
                รูปลักษณ์
              </TabsTrigger>
              <TabsTrigger 
                value="system" 
                className="flex items-center gap-2 font-sarabun data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
              >
                <Settings className="h-4 w-4" />
                ระบบ
              </TabsTrigger>
            </TabsList>

            {/* Content Management Tab */}
            <TabsContent value="content">
              <div className="space-y-6">
                <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการเนื้อหาและข้อมูล</h3>

                {/* News Management */}
                <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 font-kanit text-orange-700">
                      <Newspaper className="h-5 w-5" />
                      จัดการข่าว
                    </CardTitle>
                    <CardDescription className="font-sarabun">
                      เพิ่ม แก้ไข และลบข่าวสาร
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <NewsManager />
                  </CardContent>
                </Card>

                {/* RSS Management */}
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
                    <RSSManager />
                  </CardContent>
                </Card>

                {/* Sponsor Management */}
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
                    <SponsorManager />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <div className="space-y-6">
                <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">การตั้งค่ารูปลักษณ์</h3>

                <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 font-kanit text-pink-700">
                      <Palette className="h-5 w-5" />
                      การตั้งค่าธีม
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

                      {/* Thai Special Day Theme Testing */}
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

            {/* System Tab */}
            <TabsContent value="system">
              <div className="space-y-6">
                <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">การจัดการระบบ</h3>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* User Management Card */}
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

                  {/* System Monitoring Card */}
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

                  {/* Database Management Card */}
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
                          <div className="text-2xl font-bold text-purple-700">127</div>
                          <div className="text-sm font-sarabun text-purple-600">ข่าวทั้งหมด</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">8</div>
                          <div className="text-sm font-sarabun text-blue-600">RSS Feeds</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">45</div>
                          <div className="text-sm font-sarabun text-green-600">แบนเนอร์</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-700">2.1GB</div>
                          <div className="text-sm font-sarabun text-yellow-600">ขนาดฐานข้อมูล</div>
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
          </Tabs>
        </section>
      </main>
    </div>
  )
}

export default Admin