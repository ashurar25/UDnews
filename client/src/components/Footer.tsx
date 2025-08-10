import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Youtube, Mail, Phone, MapPin, Rss, Key } from "lucide-react";
import SponsorBanner from "./SponsorBanner";
import SponsorBannerBar from "./SponsorBannerBar";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-gradient-subtle border-t border-border transition-colors duration-300">
      <div className="container py-8">
        {/* Centered Logo and Description */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="/logo.jpg" 
              alt="UD News Logo" 
              className="h-12 w-12 rounded animate-pulse" 
            />
            <span className="font-bold font-kanit text-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
              UD News - ระบบใหม่
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-sarabun max-w-md mx-auto">
            แหล่งข่าวสารที่เชื่อถือได้ อัปเดตข่าวใหม่ตลอด 24 ชั่วโมง - ระบบ RSS ปรับปรุงแล้ว
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold font-kanit text-foreground text-center md:text-left">ลิงก์ด่วน</h3>
            <ul className="space-y-2 text-sm font-sarabun text-center md:text-left">
              <li>
                <Link to="/news/all" className="text-muted-foreground hover:text-primary transition-colors">
                  ข่าวทั้งหมด
                </Link>
              </li>
              <li>
                <Link to="/news/breaking" className="text-muted-foreground hover:text-primary transition-colors">
                  ข่าวด่วน
                </Link>
              </li>
              <li>
                <Link to="/news/local" className="text-muted-foreground hover:text-primary transition-colors">
                  ข่าวท้องถิ่น
                </Link>
              </li>
              <li>
                <Link to="/news/politics" className="text-muted-foreground hover:text-primary transition-colors">
                  ข่าวการเมือง
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold font-kanit text-foreground text-center md:text-left">หมวดหมู่</h3>
            <ul className="space-y-2 text-sm font-sarabun text-center md:text-left">
              <li>
                <Link to="/news/sports" className="text-muted-foreground hover:text-primary transition-colors">
                  กีฬา
                </Link>
              </li>
              <li>
                <Link to="/news/entertainment" className="text-muted-foreground hover:text-primary transition-colors">
                  บันเทิง
                </Link>
              </li>
              <li>
                <Link to="/news/crime" className="text-muted-foreground hover:text-primary transition-colors">
                  อาชญากรรม
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  ติดต่อเรา
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold font-kanit text-foreground text-center md:text-left">ติดต่อเรา</h3>
            <div className="space-y-2 text-sm font-sarabun text-muted-foreground text-center md:text-left">
              <p>📧 news@udnews.com</p>
              <p>📞 02-XXX-XXXX</p>
              <p>📍 กรุงเทพมหานคร ประเทศไทย</p>
            </div>
          </div>

          {/* Admin Access */}
          <div className="space-y-4">
            <h3 className="font-semibold font-kanit text-foreground text-center md:text-left">ผู้ดูแลระบบ</h3>
            <div className="text-center md:text-left">
              <Link to="/admin" data-testid="link-admin">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span className="font-sarabun">เข้าสู่ระบบแอดมิน</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-border" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 text-center">
          <p className="text-sm text-muted-foreground font-sarabun">
            © 2024 UD News. สงวนลิขสิทธิ์.
          </p>
          <div className="flex space-x-4 text-sm font-sarabun">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              ข้อกำหนดการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;