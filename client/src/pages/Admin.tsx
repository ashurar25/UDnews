import { ThemeToggle } from "@/components/ThemeToggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Users, FileText, BarChart3, Home } from "lucide-react"
import { Link } from "react-router-dom"
import RSSManager from "@/components/RSSManager"

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors">
                <Home className="h-5 w-5" />
                <span className="text-sm">กลับหน้าหลัก</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-2xl font-bold text-foreground font-kanit">แอดมิน UD News</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="font-sarabun">ผู้ดูแลระบบ</Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="container mx-auto px-4 py-8">
        {/* RSS Management Section */}
        <div className="mb-8">
          <RSSManager />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"></div>
          {/* Theme Settings Card */}
          <Card className="hover:shadow-warm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg font-kanit">การตั้งค่าธีม</CardTitle>
              <Settings className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription className="font-sarabun mb-4">
                เปลี่ยนธีมสีของเว็บไซต์ระหว่าง Light และ Dark mode
              </CardDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm font-sarabun">สลับธีม:</span>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* News Management Card */}
          <Card className="hover:shadow-warm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg font-kanit">จัดการข่าว</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription className="font-sarabun mb-4">
                เพิ่ม แก้ไข และลบข่าวสาร
              </CardDescription>
              <div className="space-y-2">
                <Button size="sm" className="w-full font-sarabun">เพิ่มข่าวใหม่</Button>
                <Button variant="outline" size="sm" className="w-full font-sarabun">แก้ไขข่าว</Button>
              </div>
            </CardContent>
          </Card>

          {/* User Management Card */}
          <Card className="hover:shadow-warm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg font-kanit">จัดการผู้ใช้</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription className="font-sarabun mb-4">
                ดูรายชื่อและจัดการสิทธิ์ผู้ใช้
              </CardDescription>
              <div className="space-y-2">
                <Button size="sm" className="w-full font-sarabun">ดูรายชื่อผู้ใช้</Button>
                <Button variant="outline" size="sm" className="w-full font-sarabun">จัดการสิทธิ์</Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Card */}
          <Card className="hover:shadow-warm transition-shadow md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg font-kanit">สรุปสถิติ</CardTitle>
              <BarChart3 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription className="font-sarabun mb-4">
                ข้อมูลสถิติการใช้งานเว็บไซต์
              </CardDescription>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">127</p>
                  <p className="text-sm text-muted-foreground font-sarabun">ข่าวทั้งหมด</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">1,234</p>
                  <p className="text-sm text-muted-foreground font-sarabun">ผู้เข้าชมวันนี้</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">15</p>
                  <p className="text-sm text-muted-foreground font-sarabun">ผู้ใช้ทั้งหมด</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">95%</p>
                  <p className="text-sm text-muted-foreground font-sarabun">อัพไทม์</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Admin