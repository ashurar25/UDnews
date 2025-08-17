import React from 'react';
import { api } from '@/lib/api';
import { FaTrophy, FaMedal, FaAward, FaStar } from 'react-icons/fa';
import { GiLaurelCrown, GiTrophyCup } from 'react-icons/gi';

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

function NumberPill({ children, highlight = false }: { children: React.ReactNode, highlight?: boolean }) {
  return (
    <div className="relative group">
      <div className={`
        absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg 
        ${highlight ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'} 
        blur transition duration-200 group-hover:duration-200`}
      />
      <span
        className={`
          relative flex items-center justify-center rounded-lg px-4 py-2 text-sm font-mono font-bold
          ${highlight 
            ? 'bg-gradient-to-br from-yellow-100 to-amber-50 text-amber-800 text-base' 
            : 'bg-white/95 text-amber-900'}
          border border-amber-200 shadow-lg shadow-amber-100/50
          transition-all duration-200 group-hover:scale-105`}
      >
        {children}
        {highlight && (
          <FaStar className="ml-1.5 text-amber-400" />
        )}
      </span>
    </div>
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
      {/* Main card with elegant frame */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl border-2 border-amber-300/30
          bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
        
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-30" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-amber-300/20 to-rose-300/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-tr from-yellow-300/20 to-orange-300/20 blur-3xl" />
        
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-amber-300/50 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-amber-300/50 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-amber-300/50 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-amber-300/50 rounded-br-2xl" />

        <div className="relative p-6 sm:p-8">
          {/* Header with trophy icon */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <GiTrophyCup className="text-amber-200 text-2xl" />
              <span className="text-white/90 font-sarabun text-sm">
                {loading ? 'กำลังโหลด…' : (error ? <span className="text-white">{error}</span> : (data?.date || ''))}
              </span>
            </div>
            {usingFallback && !error && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-amber-200/30">
                ข้อมูลสำรอง
              </span>
            )}
          </div>

          {/* Main title */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-4">
            <div>
              {!hideHeaderTitle && (
                <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold font-kanit text-white drop-shadow-lg">
                  ผลสลากกินแบ่งรัฐบาล
                </h2>
              )}
              <div className="flex items-center mt-2">
                <FaAward className="text-amber-200 mr-2" />
                <span className="text-amber-100 font-sarabun">รางวัลที่ 1</span>
              </div>
            </div>
            
            {/* First prize number with shine effect */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-amber-400 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
              <div className="relative text-4xl sm:text-6xl font-black font-mono tracking-widest text-white">
                {first ? (
                  <div className="flex items-center">
                    <NumberPill highlight>{first}</NumberPill>
                  </div>
                ) : (
                  <div className="text-white/70">— — — — — —</div>
                )}
              </div>
            </div>
          </div>

          {/* Prize numbers grid */}
          <div className="mt-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Front 3 */}
              <div>
                <div className="flex items-center text-amber-100 font-sarabun mb-2">
                  <FaMedal className="text-amber-300 mr-2" />
                  <span>เลขหน้า 3 ตัว</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {front3.length ? (
                    front3.map((n, i) => <NumberPill key={i}>{n}</NumberPill>)
                  ) : (
                    <span className="text-amber-100/70">-</span>
                  )}
                </div>
              </div>
              
              {/* Last 3 */}
              <div>
                <div className="flex items-center text-amber-100 font-sarabun mb-2">
                  <FaMedal className="text-amber-300 mr-2" />
                  <span>เลขท้าย 3 ตัว</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {last3.length ? (
                    last3.map((n, i) => <NumberPill key={i}>{n}</NumberPill>)
                  ) : (
                    <span className="text-amber-100/70">-</span>
                  )}
                </div>
              </div>
              
              {/* Last 2 */}
              <div>
                <div className="flex items-center text-amber-100 font-sarabun mb-2">
                  <FaMedal className="text-amber-300 mr-2" />
                  <span>เลขท้าย 2 ตัว</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {last2Arr.length ? (
                    last2Arr.map((n, i) => <NumberPill key={i}>{n}</NumberPill>)
                  ) : (
                    <span className="text-amber-100/70">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-amber-300/20">
            {data?.source && (
              <div className="text-xs text-amber-100/80 font-sarabun">
                แหล่งข้อมูล: <a className="underline hover:text-white transition-colors" href={data.source} target="_blank" rel="noreferrer">
                  {usingFallback ? 'Rayriffy API' : 'กองสลาก (GLO)'}
                </a>
                {data.fetchedAt && (
                  <span> • อัปเดตเมื่อ {new Date(data.fetchedAt).toLocaleString('th-TH')}</span>
                )}
              </div>
            )}
          </div>
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
