import React, { useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Menu, 
  X, 
  Home, 
  BarChart3, 
  FileText, 
  Rss, 
  Image, 
  Users, 
  Mail, 
  MessageSquare, 
  Settings, 
  Database,
  LogOut,
  FolderOpen,
  Palette,
  UserCog,
  Monitor,
  Clock,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';

// Lazy load components
const LazyAnalyticsDashboard = lazy(() => import('@/components/AnalyticsDashboard'));
const LazyNewsManager = lazy(() => import('@/components/NewsManager'));
const LazyRSSManager = lazy(() => import('@/components/RSSManager'));
const LazySponsorManager = lazy(() => import('@/components/SponsorManager'));
const LazyMediaManager = lazy(() => import('@/components/MediaManager'));
const LazyCategoryManager = lazy(() => import('@/components/CategoryManager'));
const LazyUserManager = lazy(() => import('@/components/UserManager'));
const LazyContactMessagesManager = lazy(() => import('@/components/ContactMessagesManager'));
const LazyCommentManager = lazy(() => import('@/components/CommentManager'));
const LazyNewsletterManager = lazy(() => import('@/components/NewsletterManager'));
const LazyPushNotificationManager = lazy(() => import('@/components/PushNotificationManager'));
const LazySystemSettings = lazy(() => import('@/components/SystemSettings'));
const LazyDatabaseManager = lazy(() => import('@/components/DatabaseManager'));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600">ไม่สามารถโหลดส่วนประกอบนี้ได้ กรุณาลองใหม่อีกครั้ง</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Admin login component
const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('adminToken', token);
        onLogin();
      } else {
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-kanit text-orange-800">
            เข้าสู่ระบบผู้ดูแล
          </CardTitle>
          <CardDescription className="font-sarabun">
            กรุณาเข้าสู่ระบบเพื่อจัดการเว็บไซต์
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 font-sarabun">ชื่อผู้ใช้</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-sarabun">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 font-sarabun"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Menu items configuration
const menuItems = [
  {
    group: 'ภาพรวม',
    items: [
      { id: 'overview', label: 'ภาพรวมระบบ', icon: Home },
      { id: 'analytics', label: 'สถิติและการวิเคราะห์', icon: BarChart3 },
    ]
  },
  {
    group: 'จัดการเนื้อหา',
    items: [
      { id: 'news', label: 'จัดการข่าว', icon: FileText },
      { id: 'rss', label: 'RSS Feeds', icon: Rss },
      { id: 'sponsors', label: 'แบนเนอร์สปอนเซอร์', icon: Image },
      { id: 'categories', label: 'หมวดหมู่', icon: FolderOpen },
      { id: 'media', label: 'จัดการสื่อ', icon: Image },
    ]
  },
  {
    group: 'ผู้ใช้และการสื่อสาร',
    items: [
      { id: 'users', label: 'จัดการผู้ใช้', icon: Users },
      { id: 'messages', label: 'ข้อความติดต่อ', icon: Mail },
      { id: 'comments', label: 'ความคิดเห็น', icon: MessageSquare },
      { id: 'newsletter', label: 'จดหมายข่าว', icon: Mail },
      { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    ]
  },
  {
    group: 'การตั้งค่า',
    items: [
      { id: 'themes', label: 'ธีมและการแสดงผล', icon: Palette },
      { id: 'settings', label: 'การตั้งค่าระบบ', icon: Settings },
      { id: 'database', label: 'จัดการฐานข้อมูล', icon: Database },
    ]
  }
];

// Main admin component
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch database stats
  const { data: databaseStats } = useQuery({
    queryKey: ['database-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/database/stats');
      if (!response.ok) throw new Error('Failed to fetch database stats');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">ภาพรวมระบบ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {databaseStats?.newsCount || 0}
                    </div>
                    <div className="text-sm font-sarabun text-gray-600">ข่าวทั้งหมด</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {databaseStats?.rssFeedsCount || 0}
                    </div>
                    <div className="text-sm font-sarabun text-gray-600">RSS Feeds</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {databaseStats?.sponsorBannersCount || 0}
                    </div>
                    <div className="text-sm font-sarabun text-gray-600">แบนเนอร์</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {databaseStats?.totalUsers || 0}
                    </div>
                    <div className="text-sm font-sarabun text-gray-600">ผู้ใช้งาน</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">สถิติและการวิเคราะห์</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyAnalyticsDashboard />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'news':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการข่าว</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyNewsManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'rss':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการ RSS Feeds</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyRSSManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'sponsors':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการแบนเนอร์สปอนเซอร์</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazySponsorManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการไฟล์มีเดีย</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyMediaManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการหมวดหมู่</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyCategoryManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการผู้ใช้</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyUserManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">ข้อความติดต่อ</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyContactMessagesManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'comments':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">ความคิดเห็น</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyCommentManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'newsletter':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จดหมายข่าว</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyNewsletterManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">การแจ้งเตือน</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyPushNotificationManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'themes':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">ธีมและการแสดงผล</h3>
            <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-kanit text-orange-700">
                  <Palette className="h-5 w-5" />
                  การตั้งค่าธีม
                </CardTitle>
                <CardDescription className="font-sarabun">
                  เปลี่ยนธีมสีของเว็บไซต์
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">ธีมปัจจุบัน</h3>
                    <p className="text-sm text-muted-foreground">
                      เปลี่ยนธีมของเว็บไซต์
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">การตั้งค่าระบบ</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazySystemSettings />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">จัดการฐานข้อมูล</h3>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LazyDatabaseManager />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center">
            <h3 className="text-xl font-bold font-kanit text-orange-800 mb-4">เลือกเมนูที่ต้องการจัดการ</h3>
            <p className="text-gray-600 font-sarabun">กรุณาเลือกเมนูจากแถบด้านซ้าย</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold font-kanit text-orange-800">ระบบจัดการ</h2>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="p-4 space-y-6">
          {menuItems.map((group) => (
            <div key={group.group}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 font-sarabun">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors font-sarabun ${
                        activeTab === item.id
                          ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold font-kanit text-orange-800">
                อัพเดทข่าวอุดร - ระบบจัดการ
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Verify token with server
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(response => {
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('adminToken');
          }
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
        });
    }
  }, []);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboard />;
}
