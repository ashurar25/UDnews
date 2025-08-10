import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import SponsorBanner from "./SponsorBanner";
import SponsorBannerBar from "./SponsorBannerBar";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-gradient-subtle border-t border-border transition-colors duration-300">
      <div className="container max-w-6xl mx-auto py-12 px-6">
        {/* Centered Logo and Description */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src="/logo.jpg" 
              alt="UD News Logo" 
              className="h-16 w-16 rounded-full shadow-lg animate-pulse border-2 border-primary/20"
              loading="lazy"
            />
            <span className="font-bold font-kanit text-3xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
              อัพเดทข่าวอุดร - UD News Update
            </span>
          </div>
          <p className="text-base text-muted-foreground font-sarabun max-w-2xl mx-auto leading-relaxed">
            แหล่งข่าวสารที่เชื่อถือได้ อัปเดตข่าวใหม่ตลอด 24 ชั่วโมง<br />
            มั่นใจในเรา เพื่อข่าวที่เป็นประโยชน์
          </p>
        </div>

        {/* Main Content Grid - Centered 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-10 max-w-4xl mx-auto">
          {/* Quick Links */}
          <div className="text-center">
            <h3 className="font-semibold font-kanit text-lg text-foreground mb-6 pb-2 border-b-2 border-primary/20 inline-block">
              ลิงก์ด่วน
            </h3>
            <ul className="space-y-4 text-sm font-sarabun">
              <li>
                <Link to="/news/all" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 inline-block">
                  📰 ข่าวทั้งหมด
                </Link>
              </li>
              <li>
                <Link to="/news/breaking" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 inline-block">
                  🚨 ข่าวด่วน
                </Link>
              </li>
              <li>
                <Link to="/news/local" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 inline-block">
                  🏘️ ข่าวท้องถิ่น
                </Link>
              </li>
              <li>
                <Link to="/news/politics" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 inline-block">
                  🏛️ ข่าวการเมือง
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="text-center">
            <h3 className="font-semibold font-kanit text-lg text-foreground mb-6 pb-2 border-b-2 border-primary/20 inline-block">
              หมวดหมู่
            </h3>
            <ul className="space-y-4 text-sm font-sarabun">
              <li>
                <Link to="/news/sports" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 inline-block">
                  ⚽ กีฬา
                </Link>
              </li>
              <li>
                <Link to="/news/entertainment" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 inline-block">
                  🎬 บันเทิง
                </Link>
              </li>
              <li>
                <Link to="/news/crime" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 inline-block">
                  🚔 อาชญากรรม
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 inline-block">
                  📞 ติดต่อเรา
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center">
            <h3 className="font-semibold font-kanit text-lg text-foreground mb-6 pb-2 border-b-2 border-primary/20 inline-block">
              ติดต่อเรา
            </h3>
            <div className="space-y-4 text-sm font-sarabun text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>kenginol.ar@gmail.com</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>092-443-4311</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>อุดรธานี ประเทศไทย</span>
              </div>
              {/* Social Media Icons */}
              <div className="flex justify-center space-x-3 pt-4">
                <Button variant="ghost" size="sm" className="p-2 hover:bg-primary/10">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 hover:bg-primary/10">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 hover:bg-primary/10">
                  <Youtube className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Bottom Footer */}
        <div className="text-center space-y-4">
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8">
            <p className="text-sm text-muted-foreground font-sarabun">
              © 2024 UD News. สงวนลิขสิทธิ์โดย ASHURA STUDIO.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-sarabun">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                นโยบายความเป็นส่วนตัว
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                ข้อกำหนดการใช้งาน
              </Link>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground font-sarabun opacity-70">
            พัฒนาด้วย ❤️ เพื่อประชาชนไทย | 
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;