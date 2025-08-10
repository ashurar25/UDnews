import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Youtube, Mail, Phone, MapPin, Rss, Key } from "lucide-react";
import SponsorBanner from "./SponsorBanner";
import SponsorBannerBar from "./SponsorBannerBar";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-subtle border-t border-border transition-colors duration-300">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/logo.jpg" 
                alt="UD News Logo" 
                className="h-8 w-8 rounded" 
              />
              <span className="font-bold font-kanit text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                UD News
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-sarabun">
              แหล่งข่าวสารที่เชื่อถือได้ อัปเดตข่าวใหม่ตลอด 24 ชั่วโมง
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold font-kanit text-foreground">ลิงก์ด่วน</h3>
            <ul className="space-y-2 text-sm font-sarabun">
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
            <h3 className="font-semibold font-kanit text-foreground">หมวดหมู่</h3>
            <ul className="space-y-2 text-sm font-sarabun">
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
            <h3 className="font-semibold font-kanit text-foreground">ติดต่อเรา</h3>
            <div className="space-y-2 text-sm font-sarabun text-muted-foreground">
              <p>📧 news@udnews.com</p>
              <p>📞 02-XXX-XXXX</p>
              <p>📍 กรุงเทพมหานคร ประเทศไทย</p>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-border" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-flex-row justify-between items-center space-y-4 md:space-y-0">
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