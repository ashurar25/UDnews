import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Youtube, Mail, Phone, MapPin, Rss } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-subtle border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <span className="text-lg font-bold text-white">UD</span>
              </div>
              <div>
                <h3 className="font-kanit font-bold text-lg">อัพเดทข่าวอุดร</h3>
                <p className="text-sm text-muted-foreground">UD News Update</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-sarabun mb-4">
              แหล่งข่าวสารอุดรธานีที่ถูกต้อง รวดเร็ว และน่าเชื่อถือ 
              อัพเดทข่าวตลอด 24 ชั่วโมง
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Youtube className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Rss className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-kanit font-semibold mb-4">หมวดข่าว</h4>
            <div className="space-y-2">
              {[
                "ข่าวท้องถิ่น",
                "การเมือง", 
                "กีฬา",
                "บันเทิง",
                "เศรษฐกิจ",
                "สังคม"
              ].map((item, index) => (
                <Button 
                  key={index}
                  variant="ghost" 
                  className="h-auto p-0 justify-start text-sm font-sarabun text-muted-foreground hover:text-foreground"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-kanit font-semibold mb-4">ติดต่อเรา</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-sarabun">
                  อุดรธานี, ประเทศไทย 41000
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-sarabun">042-123-456</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-sarabun">news@udnews.com</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-kanit font-semibold mb-4">รับข่าวสารล่าสุด</h4>
            <p className="text-sm text-muted-foreground font-sarabun mb-4">
              สมัครรับข่าวสารและอัพเดทล่าสุดทางอีเมล
            </p>
            <div className="space-y-2">
              <Input 
                placeholder="อีเมลของคุณ"
                className="font-sarabun"
              />
              <Button className="w-full bg-gradient-primary hover:bg-primary-dark">
                <span className="font-sarabun">สมัครสมาชิก</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground font-sarabun">
            © 2024 อัพเดทข่าวอุดร (UD News Update). สงวนลิขสิทธิ์.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button variant="link" className="text-sm font-sarabun p-0 h-auto">
              นโยบายความเป็นส่วนตัว
            </Button>
            <Button variant="link" className="text-sm font-sarabun p-0 h-auto">
              เงื่อนไขการใช้งาน
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;