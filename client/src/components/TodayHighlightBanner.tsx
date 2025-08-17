import React, { useEffect, useState } from 'react';
import { getTodayHoliday } from '@/data/thai-holidays';
import { getWanPhraDates } from '@/lib/thai-calendar';
import { formatThaiDateISO } from '@/lib/date-th';

const TodayHighlightBanner: React.FC = () => {
  const [todayHoliday, setTodayHoliday] = useState<{ date: string; name: string } | null>(null);
  const [todayWanPhra, setTodayWanPhra] = useState<{ date: string; label: string } | null>(null);

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const hol = getTodayHoliday(now);
    setTodayHoliday(hol ? { date: hol.date, name: hol.name } : null);

    (async () => {
      const wan = await getWanPhraDates(y, m);
      const found = wan.find(w => w.date === iso) || null;
      setTodayWanPhra(found ? { date: found.date, label: found.label } : null);
    })();
  }, []);

  if (!todayHoliday && !todayWanPhra) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📅</div>
        <div className="space-y-1">
          <div className="font-kanit font-bold">วันนี้</div>
          {todayHoliday && (
            <div className="text-sm font-sarabun">
              <span className="font-semibold text-primary">{todayHoliday.name}</span>
              <span className="text-muted-foreground"> — {formatThaiDateISO(todayHoliday.date)}</span>
            </div>
          )}
          {todayWanPhra && (
            <div className="text-sm font-sarabun">
              <span className="font-semibold text-amber-700">วันพระ</span>
              <span className="text-muted-foreground"> — {todayWanPhra.label} • {formatThaiDateISO(todayWanPhra.date)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayHighlightBanner;
