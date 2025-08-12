import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Home, Newspaper, Users, Rss, Mail } from "lucide-react"
import { Link } from "wouter"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/ThemeToggle"

function AdminContent() {
  const { toast } = useToast()
  const [, setLocation] = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('admin-token')
    toast({
      title: "ออกจากระบบสำเร็จ",
      description: "คุณได้ออกจากระบบผู้ดูแลเรียบร้อยแล้ว",
    })
    setLocation('/')
  }

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

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold font-kanit text-orange-800 mb-4">ภาพรวมระบบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">0</p>
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
                    <p className="text-2xl font-bold">0</p>
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
                    <p className="text-2xl font-bold">0</p>
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
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm opacity-90">ข้อความติดต่อ</p>
                  </div>
                  <Mail className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
            <CardTitle className="font-kanit text-orange-700">
              ระบบแอดมิน (แบบง่าย)
            </CardTitle>
            <CardDescription className="font-sarabun">
              หน้าแอดมินแบบทดสอบ - ไม่มี lazy loading หรือ complex components
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 font-sarabun">
              หากหน้านี้โหลดได้ปกติ แสดงว่าปัญหาอยู่ที่ lazy loading หรือ component ที่ซับซ้อน
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function AdminSimple() {
  const [, setLocation] = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('admin-token')
        if (!token) {
          setLocation('/login')
          return
        }

        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Token invalid')
        }

        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem('admin-token')
        setLocation('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [setLocation])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <AdminContent />
}