import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    queryKey: ['admin-daily-summary', date],
    queryFn: () => api.get(`/api/ai/daily-summary?date=${encodeURIComponent(date)}`),
  });
}

export default function DailySummaryAdmin() {
  const [date, setDate] = React.useState<string>(toLocalDateString());
  const { data, isLoading, isError, refetch } = useDailySummary(date);
  const [regenLoading, setRegenLoading] = React.useState(false);

  const regenerate = async () => {
    try {
      setRegenLoading(true);
      await api.post('/api/ai/daily-summary/regenerate', { date });
      await refetch();
      alert('สร้างสรุปข่าวใหม่สำเร็จ');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'ไม่สามารถสร้างสรุปข่าวใหม่ได้');
    } finally {
      setRegenLoading(false);
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 font-kanit text-orange-700">
          จัดการสรุปข่าวรายวัน (AI)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-sarabun">วันที่</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48" />
          <Button variant="outline" onClick={() => setDate(toLocalDateString())}>วันนี้</Button>
          <Button onClick={regenerate} disabled={regenLoading}>
            {regenLoading ? 'กำลังสร้างใหม่...' : 'สร้างสรุปใหม่'}
          </Button>
          <Button variant="secondary" onClick={() => refetch()} disabled={isLoading}>รีเฟรช</Button>
        </div>

        {isLoading && <div>กำลังโหลด...</div>}
        {isError && !isLoading && <div className="text-red-600">โหลดข้อมูลไม่สำเร็จ</div>}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="font-semibold mb-2">สรุปแบบ bullet</div>
              {data?.bullets?.length ? (
                <ul className="list-disc pl-5 space-y-1">
                  {data.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              ) : <div className="text-gray-500">ไม่มีข้อมูล</div>}

              <div className="font-semibold mt-4 mb-2">ไฮไลต์</div>
              {data?.highlights?.length ? (
                <ul className="list-disc pl-5 space-y-1">
                  {data.highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              ) : <div className="text-gray-500">ไม่มีข้อมูล</div>}
            </div>

            <div>
              <div className="font-semibold mb-2">ข่าวแนะนำ</div>
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
