import React, { useEffect, useState } from 'react';
import { getWanPhraDates } from '@/lib/thai-calendar';
import { formatThaiDateISO } from '@/lib/date-th';

const WanPhraTodayBanner: React.FC = () => {
  const [todayWanPhra, setTodayWanPhra] = useState<{ date: string; label: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const iso = `${y}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const wan = await getWanPhraDates(y, m); // Uses real server API `/api/wanphra` with fallback
        const found = wan.find(w => w.date === iso) || null;
        setTodayWanPhra(found ? { date: found.date, label: found.label } : null);
      } catch {
        setTodayWanPhra(null);
      }
    })();
  }, []);

  if (!todayWanPhra) return null;

  return (
    <div className="container mx-auto px-4 mt-4">
      <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 shadow-sm">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(1000px 300px at -10% -50%, rgba(255,200,0,0.25), transparent)',
        }} />
        <div className="relative flex items-start gap-3 p-4">
          <div className="text-2xl" aria-hidden>🛕</div>
          <div className="space-y-1">
            <div className="font-kanit font-bold text-amber-800">วันนี้วันพระ</div>
            <div className="text-sm font-sarabun text-amber-900">
              <span className="font-semibold">{todayWanPhra.label}</span>
              <span className="text-muted-foreground"> • {formatThaiDateISO(todayWanPhra.date)}</span>
            </div>
            <div className="text-xs font-sarabun text-amber-700/80">ขอให้มีสติ สดใส ใจสงบ</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WanPhraTodayBanner;
