import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    queryKey: ['daily-summary', date],
    queryFn: () => api.get(`/api/ai/daily-summary?date=${encodeURIComponent(date)}`),
  });
}

export default function DailySummaryWidget() {
  const [, setLocation] = useLocation();
  const [date, setDate] = React.useState<string>(toLocalDateString());
  const { data, isLoading, isError, refetch } = useDailySummary(date);

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle className="font-kanit text-orange-700">สรุปข่าวรายวัน</CardTitle>
          <div className="flex items-center gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
            <Button variant="outline" size="sm" onClick={() => setDate(toLocalDateString())}>วันนี้</Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>รีเฟรช</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {isLoading && <div>กำลังโหลด...</div>}
        {isError && !isLoading && <div className="text-red-600">ไม่สามารถโหลดสรุปข่าวได้</div>}
        {!isLoading && !isError && data && (
          <div className="space-y-3">
            {data.bullets?.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {data.bullets.map((b, i) => (<li key={i}>{b}</li>))}
              </ul>
            ) : (
              <div className="text-gray-600">ยังไม่มีสรุปข่าวสำหรับวันที่เลือก</div>
            )}

            {data.highlights?.length > 0 && (
              <div>
                <div className="font-semibold mb-1">ไฮไลต์</div>
                <ul className="list-disc pl-5 space-y-1">
                  {data.highlights.map((h, i) => (<li key={i}>{h}</li>))}
                </ul>
              </div>
            )}

            {data.topLinks?.length > 0 && (
              <div>
                <div className="font-semibold mb-1">ข่าวแนะนำ</div>
                <ul className="list-disc pl-5 space-y-1">
                  {data.topLinks.map((l, i) => (
                    <li key={i}>
                      {l.url ? <a className="text-orange-700 hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.title || l.url}</a> : (l.title || '-')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">อัปเดตล่าสุด: {data.generatedAt ? new Date(data.generatedAt).toLocaleString('th-TH') : '-'}</div>
              <Button size="sm" variant="link" className="text-orange-700" onClick={() => setLocation(`/daily-summary?date=${date}`)}>
                ดูสรุปเต็ม →
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
