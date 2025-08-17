import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TodayHighlightBanner from '@/components/TodayHighlightBanner';
import { getThaiHolidaysForMonth, getWanPhraDates } from '@/lib/thai-calendar';
import { formatThaiDateISO, formatThaiMonthYear, pad, toISO } from '@/lib/date-th';
import { Helmet } from 'react-helmet-async';

const daysTH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const ThaiCalendar: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [wanPhra, setWanPhra] = useState<{ date: string; label: string }[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [wps, hls] = await Promise.all([
          getWanPhraDates(year, month),
          Promise.resolve(getThaiHolidaysForMonth(year, month))
        ]);
        if (!mounted) return;
        setWanPhra(wps.map(w => ({ date: w.date, label: w.label })));
        setHolidays(hls.map(h => ({ date: h.date, name: h.name })));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [year, month]);

  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  const grid: Array<{ iso?: string; d?: number; isToday?: boolean; isWanPhra?: boolean; wanPhraLabel?: string; holidayName?: string }>
    = [];
  // Leading blanks
  for (let i = 0; i < startWeekday; i++) grid.push({});
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d);
    const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d;
    const wp = wanPhra.find(x => x.date === iso);
    const hd = holidays.find(x => x.date === iso);
    grid.push({ iso, d, isToday, isWanPhra: !!wp, wanPhraLabel: wp?.label, holidayName: hd?.name });
  }

  const goPrev = () => {
    const prev = new Date(year, month - 2, 1);
    setYear(prev.getFullYear());
    setMonth(prev.getMonth() + 1);
  };
  const goNext = () => {
    const next = new Date(year, month, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const headerText = formatThaiMonthYear(year, month);

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>ปฏิทินไทย: วันพระและวันสำคัญ | UD News Update</title>
        <meta name="description" content={`ดูวันพระและวันสำคัญของไทย ประจำ${headerText} พร้อมเน้นวันสำคัญและวันหยุดราชการ`} />
        <link rel="canonical" href="https://udnewsupdate.sbs/thai-calendar" />
        <meta property="og:title" content="ปฏิทินไทย: วันพระและวันสำคัญ" />
        <meta property="og:description" content={`ดูวันพระและวันสำคัญของไทย ประจำ${headerText}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://udnewsupdate.sbs/thai-calendar" />
        <meta property="og:image" content="/og-calendar.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ปฏิทินไทย: วันพระและวันสำคัญ" />
        <meta name="twitter:description" content={`ดูวันพระและวันสำคัญของไทย ประจำ${headerText}`} />
        <meta name="twitter:image" content="/og-calendar.svg" />
        {(() => {
          // Build JSON-LD Events for upcoming dates in current month (limit 20)
          const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          const toStartOfDayIso = (d: string) => `${d}T00:00:00+07:00`;
          const upcoming = [
            ...wanPhra
              .filter(w => w.date >= todayIso)
              .map(w => ({
                '@type': 'Event',
                name: `วันพระ (${w.label})`,
                startDate: toStartOfDayIso(w.date),
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
                location: { '@type': 'Place', name: 'Thailand' }
              })),
            ...holidays
              .filter(h => h.date >= todayIso)
              .map(h => ({
                '@type': 'Event',
                name: h.name,
                startDate: toStartOfDayIso(h.date),
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                location: { '@type': 'Place', name: 'Thailand' }
              }))
          ]
          .sort((a, b) => (a.startDate as string).localeCompare(b.startDate as string))
          .slice(0, 20);

          const graph = { '@context': 'https://schema.org', '@graph': upcoming };
          return (
            <script type="application/ld+json">
              {JSON.stringify(graph)}
            </script>
          );
        })()}
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-kanit">ปฏิทินวันพระ & วันสำคัญ</h1>
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="px-3 py-1 rounded bg-muted hover:bg-accent font-sarabun">ก่อนหน้า</button>
            <div className="font-kanit hidden sm:block">{headerText}</div>
            {/* Month/Year pickers */}
            <select
              aria-label="เดือน"
              className="px-2 py-1 rounded border bg-background font-sarabun"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{new Intl.DateTimeFormat('th-TH', { month: 'long' }).format(new Date(2000, i, 1))}</option>
              ))}
            </select>
            <select
              aria-label="ปี"
              className="px-2 py-1 rounded border bg-background font-sarabun"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from({ length: 11 }).map((_, idx) => {
                const y = new Date().getFullYear() - 5 + idx;
                return <option key={y} value={y}>{y + 543}</option>; // BE year
              })}
            </select>
            <button onClick={goNext} className="px-3 py-1 rounded bg-muted hover:bg-accent font-sarabun">ถัดไป</button>
            <button onClick={goToday} className="px-3 py-1 rounded bg-primary text-primary-foreground font-sarabun">ไปยังวันนี้</button>
          </div>
        </div>

        <div className="mb-6">
          <TodayHighlightBanner />
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground font-sarabun">กำลังโหลด...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-7 gap-2">
                {daysTH.map((w, i) => (
                  <div key={i} className="text-center text-sm font-sarabun text-muted-foreground">{w}</div>
                ))}
                {grid.map((cell, idx) => (
                  <div key={idx} className={`h-24 border rounded p-2 flex flex-col ${cell.iso ? 'bg-card' : ''} ${cell.isToday ? 'ring-2 ring-primary' : ''}`}>
                    <div className="text-right text-sm font-kanit">{cell.d || ''}</div>
                    {cell.iso && (
                      <div className="mt-1 space-y-1">
                        {cell.isWanPhra && (
                          <div className="text-xs font-sarabun text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5 inline-block">{cell.wanPhraLabel}</div>
                        )}
                        {cell.holidayName && (
                          <div className="text-xs font-sarabun text-primary bg-orange-50 border border-orange-200 rounded px-1 py-0.5 inline-block">{cell.holidayName}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Side list */}
            <div className="space-y-6">
              <div className="bg-card rounded-lg p-4 border">
                <h3 className="font-kanit font-semibold mb-3">วันพระเดือนนี้</h3>
                {wanPhra.length ? (
                  <ul className="space-y-2">
                    {wanPhra.map((w, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="font-sarabun">{formatThaiDateISO(w.date)}</span>
                        <span className="font-sarabun text-muted-foreground">{w.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground font-sarabun">ไม่มีข้อมูล</div>
                )}
              </div>

              <div className="bg-card rounded-lg p-4 border">
                <h3 className="font-kanit font-semibold mb-3">วันสำคัญเดือนนี้</h3>
                {holidays.length ? (
                  <ul className="space-y-2">
                    {holidays.map((h, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="font-sarabun">{formatThaiDateISO(h.date)}</span>
                        <span className="font-sarabun text-muted-foreground">{h.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground font-sarabun">ไม่มีข้อมูล</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ThaiCalendar;
