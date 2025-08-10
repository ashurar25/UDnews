import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Search, Rss, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useTheme } from "next-themes";
import { getCurrentThaiSpecialDay } from "@/lib/thai-special-days";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { theme } = useTheme();
  const specialDay = getCurrentThaiSpecialDay();

  // Dynamic theme classes based on current theme
  const getThemeClasses = () => {
    if (specialDay && theme === "thai-special") {
      return {
        topBar: `bg-${specialDay.colors.primary}/60 backdrop-blur-md text-white py-1 border-b border-${specialDay.colors.secondary}/20`,
        mainHeader: `container mx-auto px-6 py-6 bg-${specialDay.colors.primary}/25 backdrop-blur-md border-b border-${specialDay.colors.secondary}/30`,
        title: `text-3xl font-bold font-kanit text-${specialDay.colors.accent}`
      }
    }
    if (theme === "dark") {
      return {
        topBar: "bg-gray-800/60 backdrop-blur-md text-white py-1 border-b border-gray-700/20",
        mainHeader: "container mx-auto px-6 py-6 bg-gray-900/25 backdrop-blur-md border-b border-gray-800/30",
        title: "text-3xl font-bold font-kanit text-blue-400"
      }
    }
    return {
      topBar: "bg-orange-600/60 backdrop-blur-md text-white py-1 border-b border-orange-300/20",
      mainHeader: "container mx-auto px-6 py-6 bg-orange-500/25 backdrop-blur-md border-b border-orange-200/30",
      title: "text-3xl font-bold font-kanit text-yellow-400"
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
    <header className="sticky top-0 z-50 w-full border-b bg-orange-50/40 dark:bg-gray-900/40 backdrop-blur-md supports-[backdrop-filter]:bg-orange-100/20 dark:supports-[backdrop-filter]:bg-gray-800/20">
      {/* Top Bar */}
      <div className={themeClasses.topBar}>
        <div className="container mx-auto px-4 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-sarabun">
                {new Date().toLocaleDateString('th-TH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <span className="font-sarabun">📞 092-443-4311</span>
              <span className="font-sarabun">✉️ kenginol.ar@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={themeClasses.mainHeader}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-6 hover:opacity-90 transition-opacity">
            <img 
              src="/logo.jpg" 
              alt="UD News Update Logo"
              className="h-16 w-16 object-contain rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer"
            />
            <div>
              <h1 className={themeClasses.title}>
                {specialDay ? specialDay.name || "อัพเดทข่าวอุดร" : "อัพเดทข่าวอุดร"}
              </h1>
              <p className="text-xl text-black dark:text-white font-sarabun font-bold">
                UD News Update
              </p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="ค้นหาข่าว..." 
                className="pl-10 w-64 font-sarabun"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Search */}
        <div className={`mt-4 ${isMenuOpen ? 'block md:hidden' : 'hidden'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="ค้นหาข่าว..." 
              className="pl-10 w-full font-sarabun"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={`mt-6 ${isMenuOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            {menuItems.map((item, index) => (
              <Link key={index} to={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full md:w-auto justify-start md:justify-center font-sarabun px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-orange-200/50 hover:border-orange-300 ${
                    location === item.href
                      ? "bg-orange-200 text-orange-800 border-orange-300"
                      : "bg-white/80 hover:bg-orange-100 hover:text-orange-700"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        </nav>

      </div>
    </header>
  );
};

export default Header;