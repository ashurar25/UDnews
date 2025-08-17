import React from 'react';
import { api } from '@/lib/api';

type LotteryResults = {
  date?: string;
  firstPrize?: string;
  nearFirstPrize?: string[];
  front3?: string[];
  last3?: string[];
  last2?: string;
  prize2?: string[];
  prize3?: string[];
  prize4?: string[];
  prize5?: string[];
  source: string;
  fetchedAt: string;
};

function NumberPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-mono
                 bg-gradient-to-br from-white/90 via-orange-50/80 to-white/60
                 dark:from-gray-700 dark:via-gray-700/80 dark:to-gray-600/70
                 text-orange-800 dark:text-orange-200
                 border border-white/60 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                 backdrop-blur-sm"
    >
      {children}
    </span>
  );
}

function PrizeRow({ label, values }: { label: string; values?: string[] | string }) {
  const list = Array.isArray(values) ? values : (values ? [values] : []);
  return (
    <tr className="border-b">
      <td className="p-2 font-sarabun font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{label}</td>
      <td className="p-2">
        {list.length ? (
          <div className="flex flex-wrap gap-2">
            {list.map((v, i) => (
              <NumberPill key={i}>{v}</NumberPill>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}

export default function LotteryResults({ hideHeaderTitle = false }: { hideHeaderTitle?: boolean }) {
  const [data, setData] = React.useState<LotteryResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [usingFallback, setUsingFallback] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Try primary backend API first
        const res = await api.get<LotteryResults>('/api/lottery/latest', { auth: false });
        const primaryOk = !!(res && (res.firstPrize || res.last2 || (res.front3 && res.front3.length) || (res.last3 && res.last3.length)));
        if (mounted && primaryOk) {
          setData(res);
          return;
        }

        // Fallback: fetch directly from public Rayriffy API (browser-side)
        try {
          const r = await fetch('https://lotto.api.rayriffy.com/latest', { method: 'GET' });
          if (!r.ok) throw new Error('Rayriffy latest fetch failed: ' + r.status);
          const j = await r.json();
          const resp = (j && (j.response || j.data || j)) || {};

          const running = resp.runningNumbers || resp.running || {};
          const prizes = resp.prizes || {};

          const normalized: LotteryResults = {
            date: resp.date || resp.draw || undefined,
            firstPrize: prizes.first?.number || prizes.first || undefined,
            nearFirstPrize: prizes.nearby || prizes.nearFirst || [],
            front3: running.frontThree || running.front3 || [],
            last3: running.backThree || running.last3 || [],
            last2: running.backTwo || running.last2 || undefined,
            prize2: prizes.second || prizes.prize2 || [],
            prize3: prizes.third || prizes.prize3 || [],
            prize4: prizes.forth || prizes.fourth || prizes.prize4 || [],
            prize5: prizes.fifth || prizes.prize5 || [],
            source: 'https://lotto.api.rayriffy.com/latest',
            fetchedAt: new Date().toISOString(),
          };

          if (mounted) {
            setData(normalized);
            setUsingFallback(true);
          }
        } catch (fallbackErr: any) {
          if (mounted) throw fallbackErr;
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'โหลดผลสลากฯ ไม่สำเร็จ');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const first = data?.firstPrize;
  const front3 = data?.front3 || [];
  const last3 = data?.last3 || [];
  const last2Arr = data?.last2 ? [data.last2] : [];

  return (
    <div className="w-full">
      {/* Single glossy hero card */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl border border-white/20 dark:border-white/10
                      bg-gradient-to-br from-orange-500 via-amber-400 to-rose-400">
        {/* Decorative overlays */}
        <div className="absolute inset-0 opacity-25 mix-blend-overlay bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.6),transparent_60%)]" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/20 blur-2xl" />

        <div className="relative p-6 sm:p-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-white/90 font-sarabun text-sm">
                {loading ? 'กำลังโหลด…' : (error ? <span className="text-white">{error}</span> : (data?.date || ''))}
              </div>
              {!hideHeaderTitle && (
                <>
                  <h3 className="mt-1 text-3xl sm:text-4xl font-extrabold font-kanit text-white drop-shadow">
                    ผลสลากกินแบ่งรัฐบาล
                  </h3>
                  <div className="mt-1 text-white/90 font-sarabun">รางวัลที่ 1</div>
                </>
              )}
              {hideHeaderTitle && (
                <div className="mt-1 text-white/90 font-sarabun">รางวัลที่ 1</div>
              )}
            </div>
            <div className="text-4xl sm:text-6xl font-black font-mono tracking-widest text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
              {first || '— — — — — —'}
            </div>
          </div>

          {/* Divider glass panel */}
          <div className="mt-6 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Front 3 */}
              <div>
                <div className="text-white/90 font-sarabun">เลขหน้า 3 ตัว</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {front3.length ? front3.map((n, i) => <NumberPill key={i}>{n}</NumberPill>) : <span className="text-white/70">-</span>}
                </div>
              </div>
              {/* Last 3 */}
              <div>
                <div className="text-white/90 font-sarabun">เลขท้าย 3 ตัว</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {last3.length ? last3.map((n, i) => <NumberPill key={i}>{n}</NumberPill>) : <span className="text-white/70">-</span>}
                </div>
              </div>
              {/* Last 2 */}
              <div>
                <div className="text-white/90 font-sarabun">เลขท้าย 2 ตัว</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {last2Arr.length ? last2Arr.map((n, i) => <NumberPill key={i}>{n}</NumberPill>) : <span className="text-white/70">-</span>}
                </div>
              </div>
            </div>
          </div>

          {usingFallback && !error && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-sarabun
                            bg-white/30 border border-white/40 text-white shadow">
              ใช้ข้อมูลสำรองจาก Rayriffy API
            </div>
          )}
        </div>
      </div>

      {data?.source && (
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 font-sarabun">
          แหล่งข้อมูล: <a className="underline" href={data.source} target="_blank" rel="noreferrer">{usingFallback ? 'Rayriffy API' : 'กองสลาก (GLO)'}</a>
          {data.fetchedAt && <span> • อัปเดตเมื่อ {new Date(data.fetchedAt).toLocaleString('th-TH')}</span>}
        </div>
      )}
    </div>
  );
}
