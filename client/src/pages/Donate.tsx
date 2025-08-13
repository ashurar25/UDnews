import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, CreditCard, Smartphone, QrCode, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";

const Donate = () => {
  const [, setLocation] = useLocation();

  // Form state
  const [amount, setAmount] = useState<number>(100);
  const [donorName, setDonorName] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Donation session state
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [donationId, setDonationId] = useState<number | null>(null);
  const [reference, setReference] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("idle");

  // Ranking / recent supporters
  const [range, setRange] = useState<"today" | "week" | "all">("all");
  const [ranks, setRanks] = useState<Array<{ name: string; total: number; count: number }>>([]);
  const [recent, setRecent] = useState<Array<{ id: number; donorName: string | null; isAnonymous: boolean; amount: number }>>([]);

  const maskedName = useMemo(() => {
    if (!donorName) return "";
    if (donorName.length <= 1) return "*";
    return donorName[0] + "*".repeat(Math.max(1, donorName.length - 1));
  }, [donorName]);

  useEffect(() => {
    // Fetch initial ranks and recent
    const fetchData = async () => {
      try {
        const [r, rc] = await Promise.all([
          fetch(`/api/donations/rank?range=${range}`).then((res) => res.json()),
          fetch(`/api/donations/recent`).then((res) => res.json()),
        ]);
        setRanks(r || []);
        setRecent(rc || []);
      } catch (e) {
        // noop
      }
    };
    fetchData();
  }, [range]);

  useEffect(() => {
    // Connect SSE for realtime updates
    const es = new EventSource("/api/donations/stream");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === "donation_approved") {
          // refresh recent and ranks
          Promise.all([
            fetch(`/api/donations/rank?range=${range}`).then((res) => res.json()),
            fetch(`/api/donations/recent`).then((res) => res.json()),
          ]).then(([r, rc]) => {
            setRanks(r || []);
            setRecent(rc || []);
          });

          if (donationId && data.donation?.id === donationId) {
            setStatus("approved");
          }
        } else if (data?.type === "ranks") {
          setRanks(data.ranks || []);
        }
      } catch {}
    };
    es.onerror = () => {
      // auto-close; browser may retry
    };
    return () => es.close();
  }, [range, donationId]);

  const createDonation = async () => {
    try {
      setCreating(true);
      setStatus("creating");
      setQrDataUrl("");
      setReference("");
      setDonationId(null);

      const res = await fetch("/api/donations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), donorName, isAnonymous, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "สร้าง QR ไม่สำเร็จ");

      setQrDataUrl(data.qrDataUrl);
      setReference(data.reference);
      setDonationId(data.id);
      setStatus("pending");
    } catch (e) {
      setStatus("error");
    } finally {
      setCreating(false);
    }
  };

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
                  สนับสนุนผ่าน PromptPay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm mb-1 font-sarabun">จำนวนเงิน (บาท)</label>
                    <input
                      type="number"
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full border rounded-md px-3 py-2 bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 font-sarabun">ชื่อผู้สนับสนุน</label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="ไม่กรอกก็ได้"
                      className="w-full border rounded-md px-3 py-2 bg-background"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input id="anon" type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                      <label htmlFor="anon" className="text-sm text-muted-foreground font-sarabun">ไม่เปิดเผยชื่อ</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 font-sarabun">ข้อความกำลังใจ (ตัวเลือก)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full border rounded-md px-3 py-2 bg-background"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={createDonation} disabled={creating} className="font-sarabun">
                      <QrCode className="h-4 w-4 mr-2" /> สร้าง QR เพื่อสแกน
                    </Button>
                    {status === 'pending' && (
                      <Badge variant="secondary" className="font-sarabun">รอสแกนและชำระ</Badge>
                    )}
                    {status === 'approved' && (
                      <Badge className="bg-green-600 text-white font-sarabun">ได้รับการยืนยันแล้ว</Badge>
                    )}
                    {status === 'error' && (
                      <Badge className="bg-red-600 text-white font-sarabun">เกิดข้อผิดพลาด</Badge>
                    )}
                  </div>
                </div>

                {qrDataUrl ? (
                  <div className="mt-4 p-4 rounded-lg border text-center">
                    <div className="mb-2 text-sm text-muted-foreground font-sarabun">สแกนด้วยแอปธนาคาร พร้อมเพย์ไปยัง "อัพเดทข่าวอุดร - UD News Update"</div>
                    <img src={qrDataUrl} alt="PromptPay QR" className="mx-auto w-64 h-64" />
                    <div className="mt-2 text-xs text-muted-foreground font-sarabun">อ้างอิง (reference): {reference}</div>
                    {donorName && !isAnonymous && (
                      <div className="mt-1 text-xs text-muted-foreground font-sarabun">ชื่อที่จะแสดง: {maskedName}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                    <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold font-kanit mb-2">QR Code การบริจาค</h3>
                    <p className="text-muted-foreground font-sarabun">
                      ใส่จำนวนเงินและกด "สร้าง QR เพื่อสแกน"
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold font-kanit">Mobile Banking</p>
                      <p className="text-sm text-muted-foreground font-sarabun">PromptPay, ธนาคารทุกสาขา</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hall of Fame & Top Supporters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Hall of Fame (Top Ranking) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-kanit">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  อันดับผู้สนับสนุน
                </CardTitle>
                <div className="flex gap-2">
                  {(["today","week","all"] as const).map((r) => (
                    <Button key={r} size="sm" variant={range===r?"default":"outline"} onClick={() => setRange(r)} className="font-sarabun">
                      {r === 'today' ? 'วันนี้' : r === 'week' ? 'สัปดาห์นี้' : 'ทั้งหมด'}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ranks.length === 0 && (
                    <div className="text-sm text-muted-foreground font-sarabun">ยังไม่มีรายการ</div>
                  )}
                  {ranks.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">#{idx+1}</Badge>
                      <div className="font-kanit">{r.name}</div>
                      <div className="ml-auto font-sarabun"><Badge variant="outline">{r.total} บาท</Badge></div>
                    </div>
                  ))}
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
                  {recent.length === 0 && (
                    <div className="text-sm text-muted-foreground font-sarabun">ยังไม่มีรายการ</div>
                  )}
                  {recent.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="text-sm">💖</div>
                        <span className="font-sarabun text-sm">{d.isAnonymous ? 'ผู้ไม่ประสงค์ออกนาม' : (d.donorName || 'ผู้สนับสนุน')}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{d.amount} บาท</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics - keep placeholder for now */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center font-kanit">สถิติการสนับสนุน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">—</div>
                  <div className="text-sm text-muted-foreground font-sarabun">ผู้สนับสนุนทั้งหมด</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">—</div>
                  <div className="text-sm text-muted-foreground font-sarabun">บาท ที่ได้รับ</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">—</div>
                  <div className="text-sm text-muted-foreground font-sarabun">เป้าหมายประจำเดือน</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">—</div>
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