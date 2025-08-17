import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { getThaiHolidaysForMonth, getNextWanPhra, getWanPhraDates } from '@/lib/thai-calendar';

interface NextItem { date: string; label: string; }

function formatThaiDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(d);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const ThaiHolyDaysWidget: React.FC = () => {
  const now = useMemo(() => new Date(), []);
  const [wanPhraNext, setWanPhraNext] = useState<NextItem | null>(null);
  const [wanPhraThisMonth, setWanPhraThisMonth] = useState<NextItem[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const [next, list, hlist] = await Promise.all([
          getNextWanPhra(now),
          getWanPhraDates(y, m),
          Promise.resolve(getThaiHolidaysForMonth(y, m))
        ]);
        if (!mounted) return;
        setWanPhraNext(next ? { date: next.date, label: next.label } : null);
        setWanPhraThisMonth(list.map(x => ({ date: x.date, label: x.label })));
        setHolidays(hlist.map(h => ({ date: h.date, name: h.name })));
      } catch {
        if (!mounted) return;
        setWanPhraNext(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [now]);

  return (
    <div className="bg-card rounded-lg p-6 shadow-news border border-orange-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold font-kanit">ปฏิทินวันพระ & วันสำคัญ</h3>
        <Link href="/thai-calendar" className="text-sm text-primary hover:underline font-sarabun">ดูทั้งหมด</Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground font-sarabun">กำลังโหลด...</div>
      ) : (
        <>
          {/* Next Wan Phra */}
          <div className="mb-5">
            <div className="text-sm font-sarabun text-muted-foreground mb-1">วันพระถัดไป</div>
            {wanPhraNext ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="font-kanit font-semibold text-amber-700">{formatThaiDate(wanPhraNext.date)}</div>
                <div className="text-sm font-sarabun text-amber-700/90">{wanPhraNext.label}</div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted text-sm font-sarabun text-muted-foreground">
                ข้อมูลวันพระยังไม่พร้อม (รอติดตั้งโมดูลจันทรคติ)
              </div>
            )}
          </div>

          {/* Wan Phra in current month */}
          <div className="mb-5">
            <div className="text-sm font-sarabun text-muted-foreground mb-2">วันพระเดือนนี้</div>
            <div className="space-y-2">
              {wanPhraThisMonth.length > 0 ? (
                wanPhraThisMonth.slice(0, 6).map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="font-sarabun">{formatThaiDate(d.date)}</span>
                    <span className="font-sarabun text-muted-foreground">{d.label}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm font-sarabun text-muted-foreground">ไม่มีข้อมูล</div>
              )}
            </div>
          </div>

          {/* Thai holidays in current month */}
          <div>
            <div className="text-sm font-sarabun text-muted-foreground mb-2">วันสำคัญเดือนนี้</div>
            <div className="space-y-2">
              {holidays.length > 0 ? (
                holidays.slice(0, 6).map((h, idx) => {
                  const today = new Date();
                  const isToday = isSameDay(new Date(h.date), today);
                  return (
                    <div key={idx} className={`flex items-center justify-between text-sm ${isToday ? 'text-primary font-semibold' : ''}`}>
                      <span className="font-sarabun">{formatThaiDate(h.date)}</span>
                      <span className="font-sarabun text-muted-foreground">{h.name}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm font-sarabun text-muted-foreground">ไม่มีข้อมูล</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThaiHolyDaysWidget;
