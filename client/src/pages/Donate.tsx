import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, CreditCard, Smartphone, QrCode, Trophy } from "lucide-react";
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 transition-colors">
                  <div className="text-gray-600 text-4xl mb-4">🥉</div>
                  <h3 className="text-xl font-bold font-kanit mb-2">ผู้สนับสนุนใหม่</h3>
                  <p className="text-3xl font-bold text-gray-600 mb-4">20-49 บาท</p>
                  <div className="text-sm text-muted-foreground font-sarabun space-y-1">
                    <p>• แสดงชื่อในหน้าสนับสนุน</p>
                    <p>• รับ Badge "ผู้สนับสนุน"</p>
                  </div>
                </div>

                <div className="text-center p-6 border-2 border-orange-400 bg-orange-50 dark:bg-orange-950/20 rounded-lg hover:shadow-lg transition-all">
                  <div className="text-orange-600 text-4xl mb-4">🥈</div>
                  <h3 className="text-xl font-bold font-kanit mb-2">ผู้สนับสนุนเงิน</h3>
                  <p className="text-3xl font-bold text-orange-600 mb-4">50-199 บาท</p>
                  <div className="text-sm text-muted-foreground font-sarabun space-y-1">
                    <p>• ประโยชน์ระดับก่อนหน้า</p>
                    <p>• รับ Badge "ผู้สนับสนุนเงิน"</p>
                    <p>• แสดงชื่อขนาดใหญ่กว่า</p>
                  </div>
                </div>

                <div className="text-center p-6 border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg hover:shadow-lg transition-all">
                  <div className="text-yellow-600 text-4xl mb-4">🥇</div>
                  <h3 className="text-xl font-bold font-kanit mb-2">ผู้สนับสนุนทอง</h3>
                  <p className="text-3xl font-bold text-yellow-600 mb-4">200-499 บาท</p>
                  <div className="text-sm text-muted-foreground font-sarabun space-y-1">
                    <p>• ประโยชน์ระดับก่อนหน้า</p>
                    <p>• รับ Badge "ผู้สนับสนุนทอง"</p>
                    <p>• แสดงชื่อใน Top Supporters</p>
                    <p>• ได้รับการขอบคุณพิเศษ</p>
                  </div>
                </div>

                <div className="text-center p-6 border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg hover:shadow-lg transition-all relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-xs bg-purple-500 text-white px-2 py-1 rounded-full">VIP</div>
                  <div className="text-purple-600 text-4xl mb-4">💎</div>
                  <h3 className="text-xl font-bold font-kanit mb-2">ผู้สนับสนุนเพชร</h3>
                  <p className="text-3xl font-bold text-purple-600 mb-4">500+ บาท</p>
                  <div className="text-sm text-muted-foreground font-sarabun space-y-1">
                    <p>• ประโยชน์ระดับก่อนหน้าทั้งหมด</p>
                    <p>• รับ Badge "ผู้สนับสนุนเพชร"</p>
                    <p>• อันดับ 1 ใน Hall of Fame</p>
                    <p>• ได้รับการขอบคุณพิเศษ</p>
                    <p>• สิทธิ์แนะนำข่าวพิเศษ</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hall of Fame & Top Supporters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Hall of Fame */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-kanit">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Hall of Fame
                </CardTitle>
                <p className="text-sm text-muted-foreground font-sarabun">
                  ผู้สนับสนุนระดับเพชรและทองคำ
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
                    <div className="text-2xl">💎</div>
                    <div>
                      <p className="font-semibold font-kanit">คุณสมชาย ใจดี</p>
                      <p className="text-sm text-muted-foreground font-sarabun">ผู้สนับสนุนเพชร • 1,000 บาท</p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        #1
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg">
                    <div className="text-2xl">🥇</div>
                    <div>
                      <p className="font-semibold font-kanit">คุณวิไล สนับสนุน</p>
                      <p className="text-sm text-muted-foreground font-sarabun">ผู้สนับสนุนทอง • 350 บาท</p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        #2
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg">
                    <div className="text-2xl">🥈</div>
                    <div>
                      <p className="font-semibold font-kanit">คุณประยุทธ ช่วยเหลือ</p>
                      <p className="text-sm text-muted-foreground font-sarabun">ผู้สนับสนุนเงิน • 150 บาท</p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        #3
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Supporters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-kanit">
                  <Heart className="h-5 w-5 text-red-500" />
                  ผู้สนับสนุนล่าสุด
                </CardTitle>
                <p className="text-sm text-muted-foreground font-sarabun">
                  ขอบคุณผู้สนับสนุนใหม่ล่าสุด
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="text-sm">🥉</div>
                      <span className="font-sarabun text-sm">คุณสมหญิง</span>
                    </div>
                    <Badge variant="outline" className="text-xs">25 บาท</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="text-sm">🥈</div>
                      <span className="font-sarabun text-sm">คุณอนันต์</span>
                    </div>
                    <Badge variant="outline" className="text-xs">80 บาท</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="text-sm">🥉</div>
                      <span className="font-sarabun text-sm">คุณมาลี</span>
                    </div>
                    <Badge variant="outline" className="text-xs">30 บาท</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="text-sm">🥇</div>
                      <span className="font-sarabun text-sm">คุณสุรชัย</span>
                    </div>
                    <Badge variant="outline" className="text-xs">250 บาท</Badge>
                  </div>

                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm" className="font-sarabun">
                      ดูผู้สนับสนุนทั้งหมด
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center font-kanit">สถิติการสนับสนุน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">127</div>
                  <div className="text-sm text-muted-foreground font-sarabun">ผู้สนับสนุนทั้งหมด</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">15,750</div>
                  <div className="text-sm text-muted-foreground font-sarabun">บาท ที่ได้รับ</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">85%</div>
                  <div className="text-sm text-muted-foreground font-sarabun">เป้าหมายประจำเดือน</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">23</div>
                  <div className="text-sm text-muted-foreground font-sarabun">วัน ที่เหลือ</div>
                </div>
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