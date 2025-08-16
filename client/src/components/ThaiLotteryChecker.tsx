import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NormalizedDraw {
  date: string;
  drawDate: string;
  governmentId: string;
  prizes: {
    first: string[];
    nearFirst: string[];
    last2: string[];
    first3: string[];
    last3: string[];
    second: string[];
    third: string[];
    fourth: string[];
    fifth: string[];
  };
}

const PrizeList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <div className="font-semibold mb-2">{title}</div>
    {items?.length ? (
      <div className="flex flex-wrap gap-2">
        {items.map((x, i) => (
          <span key={i} className="px-2 py-1 rounded bg-orange-50 text-orange-800 border border-orange-200 text-sm font-mono">
            {x}
          </span>
        ))}
      </div>
    ) : (
      <div className="text-gray-500">-</div>
    )}
  </div>
);

export default function ThaiLotteryChecker() {
  const [number, setNumber] = React.useState('');
  const [date, setDate] = React.useState('');
  const qc = useQueryClient();

  const { data: latest, isLoading, refetch } = useQuery<NormalizedDraw>({
    queryKey: ['lottery-latest'],
    queryFn: () => api.get('/api/lottery/thai/latest'),
  });

  React.useEffect(() => {
    if (latest?.drawDate) {
      setDate(latest.drawDate);
    }
  }, [latest?.drawDate]);

  const { mutate: checkNumbers, data: checkData, isPending } = useMutation({
    mutationKey: ['lottery-check'],
    mutationFn: (nums: string[]) => api.post('/api/lottery/thai/check', { numbers: nums }),
  });

  const cleanSixDigits = (val: string) => (val || '').replace(/\D/g, '').slice(0, 6);

  const onCheck = () => {
    const n = cleanSixDigits(number);
    if (!n || n.length < 2) return;
    checkNumbers([n]);
  };

  return (
    <Card className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/40 border border-white/30 dark:border-white/10 rounded-xl shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50/70 to-red-50/60 dark:from-orange-900/10 dark:to-red-900/10 rounded-t-xl">
        <CardTitle className="font-kanit text-orange-800">ตรวจหวยรัฐบาลไทย</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-sarabun mb-1">เลขสลาก (6 หลัก)</label>
            <Input
              value={number}
              onChange={(e) => setNumber(cleanSixDigits(e.target.value))}
              placeholder="กรอกเลข 6 หลัก"
              className="w-48 font-mono"
              inputMode="numeric"
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-sarabun mb-1">งวด</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48" />
          </div>
          <Button onClick={onCheck} disabled={isPending} className="bg-orange-600 hover:bg-orange-700">
            {isPending ? 'กำลังตรวจ...' : 'ตรวจผล'}
          </Button>
          <Button variant="secondary" onClick={() => refetch()} disabled={isLoading}>โหลดงวดลองล่าสุด</Button>
        </div>

        {isLoading && <div>กำลังโหลดงวดลองล่าสุด...</div>}

        {latest && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-3">
              <div className="text-sm text-gray-600 font-sarabun">งวด: {latest.date} ({latest.drawDate})</div>
              <PrizeList title="รางวัลที่ 1" items={latest.prizes.first} />
              <PrizeList title="รางวัลข้างเคียงรางวัลที่ 1" items={latest.prizes.nearFirst} />
              <PrizeList title="เลขหน้า 3 ตัว" items={latest.prizes.first3} />
              <PrizeList title="เลขท้าย 3 ตัว" items={latest.prizes.last3} />
              <PrizeList title="เลขท้าย 2 ตัว" items={latest.prizes.last2} />
            </div>
            <div className="space-y-3">
              <PrizeList title="รางวัลที่ 2" items={latest.prizes.second} />
              <PrizeList title="รางวัลที่ 3" items={latest.prizes.third} />
              <PrizeList title="รางวัลที่ 4" items={latest.prizes.fourth} />
              <PrizeList title="รางวัลที่ 5" items={latest.prizes.fifth} />
            </div>
          </div>
        )}

        {checkData?.results && (
          <div className="mt-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10">
            <div className="font-semibold mb-2">ผลการตรวจเลข {checkData.results[0]?.number}</div>
            {checkData.results[0]?.matches?.length ? (
              <ul className="list-disc pl-5 space-y-1">
                {checkData.results[0].matches.map((m: any, i: number) => (
                  <li key={i} className="font-sarabun">{m.prize} — ตรงกับ {m.match}</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-600">ไม่ถูกรางวัล</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
