
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold font-kanit">ติดต่อเรา</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-kanit">ส่งข้อความถึงเรา</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-sarabun text-sm">ชื่อ</label>
                <Input placeholder="ใส่ชื่อของคุณ" className="font-sarabun" />
              </div>
              <div>
                <label className="font-sarabun text-sm">อีเมล</label>
                <Input type="email" placeholder="your@email.com" className="font-sarabun" />
              </div>
              <div>
                <label className="font-sarabun text-sm">ข้อความ</label>
                <Textarea placeholder="ข้อความของคุณ..." className="font-sarabun" rows={5} />
              </div>
              <Button className="w-full font-sarabun">ส่งข้อความ</Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-kanit">ข้อมูลติดต่อ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="font-sarabun">092-443-4311</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="font-sarabun">kenginol.ar@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-sarabun">อุดรธานี, ประเทศไทย</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-kanit">เวลาทำการ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="font-sarabun">
                    <p>จันทร์ - ศุกร์: 08:00 - 18:00</p>
                    <p>เสาร์ - อาทิตย์: 09:00 - 17:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
