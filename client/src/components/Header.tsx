import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Search, Rss, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: "ข่าวทั้งหมด", category: "all" },
    { name: "ข่าวท้องถิ่น", category: "local" },
    { name: "ข่าวการเมือง", category: "politics" },
    { name: "ข่าวกีฬา", category: "sports" },
    { name: "ข่าวบันเทิง", category: "entertainment" },
    { name: "ข่าวเศรษฐกิจ", category: "business" },
    { name: "แอดมิน", href: "/admin" }
  ];

  const handleMenuClick = (item: any) => {
    if (item.href) {
      window.location.href = item.href;
    } else if (item.category) {
      // Dispatch custom event to filter news by category
      window.dispatchEvent(new CustomEvent('filterNews', { 
        detail: { category: item.category } 
      }));
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-orange-50/40 backdrop-blur-md supports-[backdrop-filter]:bg-orange-100/20">
      {/* Top Bar */}
      <div className="bg-orange-600/60 backdrop-blur-md text-white py-1 border-b border-orange-300/20">
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
      <div className="container mx-auto px-6 py-6 bg-orange-500/25 backdrop-blur-md border-b border-orange-200/30">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <img 
              src="/logo.jpg" 
              alt="UD News Update Logo"
              className="h-16 w-16 object-contain rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer"
            />
            <div>
              <h1 className="text-3xl font-bold font-kanit text-yellow-400">
                อัพเดทข่าวอุดร
              </h1>
              <p className="text-xl text-black font-sarabun font-bold">
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
          <div className="md:hidden">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative z-50"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="ค้นหาข่าว..." 
              className="pl-10 font-sarabun"
            />
          </div>
        </div>

        {/* Navigation Menu - Desktop */}
        <nav className="hidden md:block mt-6">
          <div className="flex flex-row gap-4 justify-center flex-wrap">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="justify-center font-sarabun hover:bg-orange-100 hover:text-orange-700 transition-colors px-4 py-2 rounded-lg"
                onClick={() => handleMenuClick(item)}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </nav>

        {/* Mobile Hamburger Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
            <div className="fixed top-0 left-0 w-80 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold font-kanit text-orange-600">เมนูหลัก</h2>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ✕
                  </Button>
                </div>
                <nav className="space-y-3">
                  {menuItems.map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start font-sarabun hover:bg-orange-50 hover:text-orange-600 transition-colors text-left"
                      onClick={() => handleMenuClick(item)}
                    >
                      {item.name}
                    </Button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;