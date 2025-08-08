import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Search, Rss, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: "หน้าแรก", href: "/" },
    { name: "ข่าวท้องถิ่น", href: "/local" },
    { name: "การเมือง", href: "/politics" },
    { name: "กีฬา", href: "/sports" },
    { name: "บันเทิง", href: "/entertainment" },
    { name: "ติดต่อเรา", href: "/contact" },
    { name: "แอดมิน", href: "/admin" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="bg-orange-600 backdrop-blur-sm text-white py-1">
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
      <div className="container mx-auto px-6 py-6 bg-orange-500/40 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <div className="bg-orange-600 p-4 rounded-xl shadow-lg backdrop-blur-sm">
              <span className="text-3xl font-bold text-white">UD</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold font-kanit text-foreground">
                อัพเดทข่าวอุดร
              </h1>
              <p className="text-base text-muted-foreground font-sarabun">
                UD News Update
              </p>
            </div>
          </div>

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

        {/* Navigation Menu */}
        <nav className={`mt-6 ${isMenuOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-col md:flex-row gap-3 md:gap-8">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="justify-start md:justify-center font-sarabun hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => window.location.href = item.href}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </nav>

        {/* Mobile Search */}
        <div className={`mt-6 ${isMenuOpen ? 'block md:hidden' : 'hidden'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="ค้นหาข่าว..." 
              className="pl-10 w-full font-sarabun"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;