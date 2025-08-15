import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';

interface DailySummaryData {
  date: string;
  bullets: string[];
  highlights: string[];
  topLinks: { title: string; url: string }[];
  generatedAt: string | null;
}

function toLocalDateString(d = new Date()) {
  const tzMs = 7 * 60 * 60 * 1000; // Asia/Bangkok
  const local = new Date(d.getTime() + tzMs);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function useDailySummary(date: string) {
  return useQuery<DailySummaryData>({
    queryKey: ['daily-summary-page', date],
    queryFn: () => api.get(`/api/ai/daily-summary?date=${encodeURIComponent(date)}`),
  });
}

export default function DailySummary() {
  const [location, setLocation] = useLocation();
  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initDate = search.get('date') || toLocalDateString();
  const [date, setDate] = React.useState(initDate);
  const { data, isLoading, isError, refetch } = useDailySummary(date);

  const onGoToday = () => setDate(toLocalDateString());
  const onShare = async () => {
    const url = `${window.location.origin}/daily-summary?date=${date}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('คัดลอกลิงก์แล้ว');
    } catch {
      // fallback
      window.prompt('คัดลอกลิงก์นี้', url);
    }
  };

  React.useEffect(() => {
    // keep URL in sync
    const url = `/daily-summary?date=${date}`;
    if (location !== url) setLocation(url, { replace: true });
  }, [date]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="font-kanit text-orange-700">สรุปข่าวรายวัน (AI)</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
                <Button variant="outline" size="sm" onClick={onGoToday}>วันนี้</Button>
                <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>รีเฟรช</Button>
                <Button variant="outline" size="sm" onClick={onShare}>แชร์ลิงก์</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading && <div>กำลังโหลด...</div>}
            {isError && !isLoading && <div className="text-red-600">ไม่สามารถโหลดข้อมูลได้</div>}
            {!isLoading && !isError && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <section>
                    <h3 className="font-semibold mb-2">สรุปแบบ Bullet</h3>
                    {data?.bullets?.length ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {data.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    ) : <div className="text-gray-500">ยังไม่มีสรุปสำหรับวันที่เลือก</div>}
                  </section>

                  <section>
                    <h3 className="font-semibold mb-2">ไฮไลต์</h3>
                    {data?.highlights?.length ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {data.highlights.map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    ) : <div className="text-gray-500">ไม่มีข้อมูล</div>}
                  </section>
                </div>

                <aside>
                  <h3 className="font-semibold mb-2">ข่าวแนะนำ</h3>
                  {data?.topLinks?.length ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {data.topLinks.map((l, i) => (
                        <li key={i}>
                          {l.url ? <a className="text-orange-700 hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.title || l.url}</a> : (l.title || '-')}
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-gray-500">ไม่มีข้อมูล</div>}

                  <div className="text-xs text-gray-500 mt-4">อัปเดตล่าสุด: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString('th-TH') : '-'}</div>
                </aside>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
