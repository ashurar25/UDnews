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
    <span className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm font-mono bg-orange-50/70 border-orange-200 text-orange-800 dark:bg-gray-700 dark:text-orange-200">
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

export default function LotteryResults() {
  const [data, setData] = React.useState<LotteryResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showMore, setShowMore] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<LotteryResults>('/api/lottery/latest', { auth: false });
        if (mounted) setData(res);
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
  const last2 = data?.last2 ? [data.last2] : [];

  const longSections = [
    { label: 'รางวัลที่ 2', values: data?.prize2 },
    { label: 'รางวัลที่ 3', values: data?.prize3 },
    { label: 'รางวัลที่ 4', values: data?.prize4 },
    { label: 'รางวัลที่ 5', values: data?.prize5 },
  ];

  return (
    <div className="w-full">
      {/* Featured card */}
      <div className="rounded-xl border border-orange-200 dark:border-gray-700 bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-gray-900 p-5 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-sarabun">{loading ? 'กำลังโหลด…' : (error ? <span className='text-red-600'>{error}</span> : (data?.date || ''))}</div>
            <h3 className="text-2xl font-bold font-kanit text-orange-800 dark:text-orange-200">รางวัลที่ 1</h3>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-orange-700 dark:text-orange-300 tracking-widest">
            {first || '— — — — — —'}
          </div>
        </div>
        {data?.nearFirstPrize && data.nearFirstPrize.length > 0 && (
          <div className="mt-3">
            <div className="text-sm font-sarabun text-gray-600 dark:text-gray-300">รางวัลข้างเคียงรางวัลที่ 1</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {data.nearFirstPrize.map((n, i) => <NumberPill key={i}>{n}</NumberPill>)}
            </div>
          </div>
        )}
      </div>

      {/* Quick cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-orange-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="text-sm font-sarabun text-gray-600 dark:text-gray-300">เลขหน้า 3 ตัว</div>
          <div className="mt-2 flex flex-wrap gap-2">{front3.length ? front3.map((n, i) => <NumberPill key={i}>{n}</NumberPill>) : <span className="text-gray-400">-</span>}</div>
        </div>
        <div className="rounded-lg border border-orange-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="text-sm font-sarabun text-gray-600 dark:text-gray-300">เลขท้าย 3 ตัว</div>
          <div className="mt-2 flex flex-wrap gap-2">{last3.length ? last3.map((n, i) => <NumberPill key={i}>{n}</NumberPill>) : <span className="text-gray-400">-</span>}</div>
        </div>
        <div className="rounded-lg border border-orange-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="text-sm font-sarabun text-gray-600 dark:text-gray-300">เลขท้าย 2 ตัว</div>
          <div className="mt-2 flex flex-wrap gap-2">{last2.length ? last2.map((n, i) => <NumberPill key={i}>{n}</NumberPill>) : <span className="text-gray-400">-</span>}</div>
        </div>
      </div>

      {/* Detailed table (collapsible long lists) */}
      <div className="overflow-x-auto rounded-lg border border-orange-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full text-sm">
          <tbody>
            <PrizeRow label="รางวัลที่ 1" values={first ? [first] : []} />
            <PrizeRow label="รางวัลข้างเคียงรางวัลที่ 1" values={data?.nearFirstPrize} />
            <PrizeRow label="เลขหน้า 3 ตัว" values={front3} />
            <PrizeRow label="เลขท้าย 3 ตัว" values={last3} />
            <PrizeRow label="เลขท้าย 2 ตัว" values={last2} />
            {/* Long sections: show first few when collapsed */}
            {longSections.map((sec) => {
              const values = (sec.values || []) as string[];
              const short = values.slice(0, 10);
              const showVals = showMore ? values : short;
              return <PrizeRow key={sec.label} label={sec.label} values={showVals} />
            })}
          </tbody>
        </table>
      </div>

      {/* Toggle for more */}
      {(longSections.some(s => (s.values?.length || 0) > 10)) && (
        <div className="mt-3">
          <button className="text-sm font-sarabun text-orange-700 hover:underline" onClick={() => setShowMore(!showMore)}>
            {showMore ? 'แสดงน้อยลง' : 'แสดงรางวัลทั้งหมด'}
          </button>
        </div>
      )}

      {data?.source && (
        <div className="mt-3 text-xs text-gray-500 font-sarabun">
          แหล่งข้อมูล: <a className="underline" href={data.source} target="_blank" rel="noreferrer">กองสลาก (GLO)</a>
          {data.fetchedAt && <span> • อัปเดตเมื่อ {new Date(data.fetchedAt).toLocaleString('th-TH')}</span>}
        </div>
      )}
    </div>
  );
}
