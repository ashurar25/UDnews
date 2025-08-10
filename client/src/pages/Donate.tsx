import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, CreditCard, Smartphone, QrCode } from "lucide-react";
import { useLocation } from "wouter";

const Donate = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับสู่หน้าหลัก
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-8 w-8 text-red-500" />
              <h1 className="text-4xl font-bold font-kanit">สนับสนุนข่าวอุดร</h1>
            </div>
            <p className="text-xl text-muted-foreground font-sarabun leading-relaxed">
              ช่วยสนับสนุนการทำข่าวท้องถิ่นอุดรธานี ให้ประชาชนได้รับข้อมูลข่าวสารที่ถูกต้องและรวดเร็ว
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Why Support Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-kanit">
                  <Heart className="h-5 w-5 text-red-500" />
                  ทำไมต้องสนับสนุน?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 font-sarabun">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-100 text-blue-800 mt-1">1</Badge>
                    <p>รักษาความเป็นอิสระในการรายงานข่าว ไม่พึ่งพาโฆษณาจากนักการเมือง</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-green-100 text-green-800 mt-1">2</Badge>
                    <p>พัฒนาคุณภาพการรายงานข่าวท้องถิ่นให้ครอบคลุมและรวดเร็วยิ่งขึ้น</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-purple-100 text-purple-800 mt-1">3</Badge>
                    <p>สร้างแพลตฟอร์มข่าวที่เข้าถึงง่าย ใช้งานฟรี สำหรับทุกคนในจังหวัดอุดรธานี</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-orange-100 text-orange-800 mt-1">4</Badge>
                    <p>ลงทุนในเทคโนโลยีและอุปกรณ์เพื่อให้บริการข่าวสารที่ดีที่สุด</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-kanit">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  วิธีการสนับสนุน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold font-kanit mb-2">QR Code การบริจาค</h3>
                  <p className="text-muted-foreground font-sarabun">
                    กำลังจัดเตรียม QR Code สำหรับการโอนเงินผ่านแอปธนาคาร
                  </p>
                  <Badge className="mt-3 bg-yellow-100 text-yellow-800">เร็วๆ นี้</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold font-kanit">Mobile Banking</p>
                      <p className="text-sm text-muted-foreground font-sarabun">PromptPay, ธนาคารทุกสาขา</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold font-kanit">โอนเงินธนาคาร</p>
                      <p className="text-sm text-muted-foreground font-sarabun">โอนผ่านเคาน์เตอร์ ATM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support Tiers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center font-kanit">ระดับการสนับสนุน</CardTitle>
              <p className="text-center text-muted-foreground font-sarabun">
                เลือกระดับการสนับสนุนตามความสมัครใจ
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="text-2xl font-bold text-blue-600 mb-2">100 บาท</div>
                  <h3 className="font-semibold font-kanit mb-2">ผู้สนับสนุน</h3>
                  <p className="text-sm text-muted-foreground font-sarabun">
                    ช่วยเหลือค่าใช้จ่ายพื้นฐานในการทำข่าว
                  </p>
                </div>
                
                <div className="text-center p-6 border-2 border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="text-2xl font-bold text-primary mb-2">500 บาท</div>
                  <h3 className="font-semibold font-kanit mb-2">ผู้อุปถัมภ์</h3>
                  <p className="text-sm text-muted-foreground font-sarabun">
                    สนับสนุนการพัฒนาเว็บไซต์และเทคโนโลยี
                  </p>
                  <Badge className="mt-2">แนะนำ</Badge>
                </div>
                
                <div className="text-center p-6 border rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="text-2xl font-bold text-green-600 mb-2">1,000+ บาท</div>
                  <h3 className="font-semibold font-kanit mb-2">ผู้สนับสนุนพิเศษ</h3>
                  <p className="text-sm text-muted-foreground font-sarabun">
                    มีส่วนร่วมในการพัฒนาข่าวท้องถิ่นอย่างยั่งยืน
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="font-kanit">ติดต่อสอบถาม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 font-sarabun">
                <p>
                  <span className="font-semibold">อีเมล:</span> support@udnews.local
                </p>
                <p>
                  <span className="font-semibold">โทรศัพท์:</span> 042-xxx-xxxx
                </p>
                <p>
                  <span className="font-semibold">ที่อยู่:</span> อุดรธานี, ประเทศไทย
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  ขอบคุณทุกท่านที่ให้การสนับสนุนข่าวอุดร เราจะใช้เงินบริจาคอย่างโปร่งใสและมีประสิทธิภาพสูงสุด
                  เพื่อการพัฒนาการรายงานข่าวท้องถิ่นที่ดีที่สุด
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Donate;