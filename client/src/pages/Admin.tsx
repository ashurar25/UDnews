
import { ThemeToggle } from "@/components/ThemeToggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings, Users, FileText, BarChart3, Home, Newspaper, Rss, Image } from "lucide-react"
import { Link } from "wouter"
import RSSManager from "@/components/RSSManager"
import NewsManager from "@/components/NewsManager"
import SponsorManager from "@/components/SponsorManager"

const Admin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Admin Header */}
      <header className="border-b border-orange-200 bg-white/90 backdrop-blur-sm shadow-sm">
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-kanit text-orange-800 mb-4">ภาพรวมระบบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  <BarChart3 className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Content Management Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-kanit text-orange-800 mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            จัดการเนื้อหา
          </h2>
          
          <div className="space-y-8">
            {/* News Management */}
            <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="h-5 w-5 text-orange-600" />
                <h3 className="text-xl font-semibold font-kanit text-orange-700">จัดการข่าว</h3>
              </div>
              <NewsManager />
            </div>
            
            {/* RSS Management */}
            <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Rss className="h-5 w-5 text-orange-600" />
                <h3 className="text-xl font-semibold font-kanit text-orange-700">จัดการ RSS Feeds</h3>
              </div>
              <RSSManager />
            </div>
            
            {/* Sponsor Management */}
            <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Image className="h-5 w-5 text-orange-600" />
                <h3 className="text-xl font-semibold font-kanit text-orange-700">จัดการแบนเนอร์สปอนเซอร์</h3>
              </div>
              <SponsorManager />
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* System Settings Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-kanit text-orange-800 mb-6 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            การตั้งค่าระบบ
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Theme Settings Card */}
            <Card className="hover:shadow-lg transition-shadow border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-kanit text-orange-700">การตั้งค่าธีม</CardTitle>
                <Settings className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <CardDescription className="font-sarabun mb-4">
                  เปลี่ยนธีมสีของเว็บไซต์ และทดสอบธีมวันสำคัญ
                </CardDescription>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-sarabun">สลับธีม:</span>
                    <ThemeToggle />
                  </div>
                  
                  {/* Thai Special Day Theme Testing */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold font-kanit text-orange-700 mb-3">ทดสอบธีมวันสำคัญ</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-sarabun border-yellow-300 text-yellow-700 hover:bg-yellow-50"
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
                        วันเฉลิมพระชนมพรรษา
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-sarabun border-blue-300 text-blue-700 hover:bg-blue-50"
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
                        วันแม่แห่งชาติ
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-sarabun border-yellow-300 text-yellow-700 hover:bg-yellow-50"
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
                        วันพ่อแห่งชาติ
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-sarabun border-red-300 text-red-700 hover:bg-red-50"
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
                        วันชาติ
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-sarabun border-orange-300 text-orange-700 hover:bg-orange-50"
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
                        วันรัฐธรรมนูญ
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-sarabun border-orange-400 text-orange-800 hover:bg-orange-50"
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
                        วันมาघบูชา
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-sarabun border-cyan-300 text-cyan-700 hover:bg-cyan-50"
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
                        วันสงกรานต์
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-sarabun col-span-2 border-gray-300 text-gray-700 hover:bg-gray-50"
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
                        รีเซ็ตธีม (กลับเป็นธีมปกติ)
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Management Card */}
            <Card className="hover:shadow-lg transition-shadow border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-kanit text-orange-700">จัดการผู้ใช้</CardTitle>
                <Users className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <CardDescription className="font-sarabun mb-4">
                  ดูรายชื่อและจัดการสิทธิ์ผู้ใช้
                </CardDescription>
                <div className="space-y-2">
                  <Button size="sm" className="w-full font-sarabun bg-orange-600 hover:bg-orange-700">
                    ดูรายชื่อผู้ใช้
                  </Button>
                  <Button variant="outline" size="sm" className="w-full font-sarabun border-orange-300 text-orange-600 hover:bg-orange-50">
                    จัดการสิทธิ์
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Monitoring Card */}
            <Card className="hover:shadow-lg transition-shadow border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-kanit text-orange-700">การตรวจสอบระบบ</CardTitle>
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <CardDescription className="font-sarabun mb-4">
                  ตรวจสอบสถานะและประสิทธิภาพระบบ
                </CardDescription>
                <div className="space-y-2">
                  <Button size="sm" className="w-full font-sarabun bg-green-600 hover:bg-green-700">
                    ดูสถานะระบบ
                  </Button>
                  <Button variant="outline" size="sm" className="w-full font-sarabun border-green-300 text-green-600 hover:bg-green-50">
                    รายงานข้อผิดพลาด
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Admin
