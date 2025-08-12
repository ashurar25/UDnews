import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Search, Rss, Clock, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { getCurrentThaiSpecialDay } from "@/lib/thai-special-days";
import { ThemeToggle } from "./ThemeToggle";
import WeatherWidget from "./WeatherWidget";
import SearchBar from "./SearchBar";
import DisasterAlertWidget from "./DisasterAlertWidget";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { theme } = useTheme();
  const specialDay = getCurrentThaiSpecialDay();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Dynamic theme classes based on current theme
  const getThemeClasses = () => {
    return {
      topBar: "w-full bg-primary/60 backdrop-blur-md text-primary-foreground py-1 border-b border-primary/20",
      mainHeader: "w-full py-6 bg-primary/25 backdrop-blur-md border-b border-primary/30",
      title: "text-3xl font-bold font-kanit text-foreground drop-shadow-lg"
    }
  }

  const themeClasses = getThemeClasses();

  const menuItems = [
    { name: "หน้าแรก", href: "/" },
    { name: "ข่าวทั้งหมด", href: "/news" },
    { name: "ข่าวท้องถิ่น", href: "/category/local" },
    { name: "การเมือง", href: "/category/politics" },
    { name: "กีฬา", href: "/category/sports" },
    { name: "บันเทิง", href: "/category/entertainment" },
    { name: "ติดต่อเรา", href: "/contact" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">


      {/* Top Bar */}
      <div className={themeClasses.topBar}>
        <div className="w-full px-4 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-sarabun">
                {(() => {
                  try {
                    return new Date().toLocaleDateString('th-TH', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                  } catch (error) {
                    return new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    });
                  }
                })()}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <span className="font-sarabun">📞 092-443-4311</span>
              <span className="font-sarabun">✉️ kenginol.ar@gmail.com</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Donation Button */}
            <Link to="/donate">
              <Button
                size="sm"
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-sarabun gap-1 px-3 py-1 text-xs"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <Heart className="h-3 w-3 fill-current animate-pulse" />
                สนับสนุนเรา
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={themeClasses.mainHeader}>
        <div className="flex items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-6 hover:opacity-90 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src="/logo.jpg" 
              alt="UD News Update Logo"
              className="h-16 w-16 object-contain rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer"
              loading="eager"
            />
            <div>
              <h1 className="text-2xl font-bold font-kanit text-primary-foreground drop-shadow-lg">
                {specialDay ? specialDay.name || "อัพเดทข่าวอุดร" : "อัพเดทข่าวอุดร"}
              </h1>
              <p className="text-lg text-primary-foreground/90 font-sarabun font-bold drop-shadow-md">
                UD News Update
              </p>
            </div>
          </Link>

          {/* Right Side - Hamburger Menu Only */}
          <div className="flex items-center gap-4">
              {/* Hamburger Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
        </div>

        {/* Hamburger Menu Dropdown */}
        <div ref={menuRef} className={`absolute top-full right-0 mt-2 w-80 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-orange-200 dark:border-gray-700 z-50 overflow-y-auto ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="p-4 space-y-4">
            {/* Search Bar in Menu */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="ค้นหาข่าว..." 
                className="pl-10 w-full font-sarabun"
              />
            </div>

            {/* Navigation Items */}
            <div className="border-t border-orange-200 dark:border-gray-600 pt-4">
              <nav className="space-y-2">
                {menuItems.map((item, index) => (
                  <Link key={index} to={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start font-sarabun px-4 py-2 rounded-lg transition-all duration-200 ${
                        location === item.href
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          : "hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setIsMenuOpen(false);
                      }}
                    >
                      {item.name}
                    </Button>
                  </Link>
                ))}
              </nav>

              {/* Breaking News Alert */}
              <div className="border-t border-orange-200 dark:border-gray-600 pt-4 mt-4">
                <div className="mb-3">
                  <span className="font-sarabun text-sm text-gray-600 dark:text-gray-400 mb-2 block">ข่าวด่วน:</span>
                  <DisasterAlertWidget compact />
                </div>
              </div>

              {/* Theme and Weather Controls */}
              <div className="border-t border-orange-200 dark:border-gray-600 pt-4 mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-sarabun text-sm text-gray-600 dark:text-gray-400">เปลี่ยนธีม:</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sarabun text-sm text-gray-600 dark:text-gray-400">สภาพอากาศ:</span>
                  <WeatherWidget />
                </div>
              </div>

              {/* Admin Login Button */}
              <div className="pt-2 flex justify-center">
                <Link to="/admin">
                  <Button
                    size="sm"
                    className="w-10 h-10 rounded-full bg-orange-600 hover:bg-orange-700 text-white p-0 flex items-center justify-center text-lg"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setIsMenuOpen(false);
                    }}
                  >
                    🔑
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;