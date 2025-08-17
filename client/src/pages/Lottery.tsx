import React from 'react';
import ThaiLotteryChecker from '@/components/ThaiLotteryChecker';
import { api } from '@/lib/api';
import LotteryResults from '@/components/LotteryResults';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Lottery() {
  const [rss, setRss] = React.useState<{ items: Array<{ title: string; link: string; pubDate?: string; isoDate?: string; summary?: string }> } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await api.get<{ items: any[] }>('/api/lottery/thai/rss/dailynews', { auth: false });
        if (mounted) setRss({ items: data?.items || [] });
      } catch (e: any) {
        if (mounted) setError(e?.message || 'โหลดฟีดข่าวหวยไม่สำเร็จ');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="outline" className="font-sarabun gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ArrowLeft className="h-4 w-4" /> กลับหน้าแรก
            </Button>
          </Link>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-kanit text-orange-800 dark:text-orange-300 drop-shadow-sm">ผลสลากกินแบ่งรัฐบาล</h1>
          <p className="text-gray-700 dark:text-gray-300 font-sarabun">แสดงผลงวดล่าสุดจากกองสลาก (อ่านอย่างเดียว)</p>
        </div>

        {/* Read-only latest results table */}
        <div className="mb-10">
          <LotteryResults />
        </div>

        {/* Optional: keep checker tool below */}
        <div className="mb-6">
          <h2 className="text-xl font-bold font-kanit text-orange-700">ตรวจเลขของคุณ</h2>
          <p className="text-gray-600 font-sarabun">ใส่เลขสลากเพื่อเทียบกับงวดล่าสุด</p>
        </div>
        <div className="rounded-lg border border-orange-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <ThaiLotteryChecker />
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold font-kanit text-orange-700 mb-3">ข่าวหวยจากเดลินิวส์</h2>
          {loading && (
            <p className="text-gray-500 font-sarabun">กำลังโหลดข้อมูล…</p>
          )}
          {error && (
            <p className="text-red-600 font-sarabun">{error}</p>
          )}
          {!loading && !error && (
            <ul className="space-y-3">
              {(rss?.items || []).slice(0, 12).map((item, idx) => (
                <li key={idx} className="border rounded-md p-3 hover:bg-orange-50 transition">
                  <a href={item.link} target="_blank" rel="noreferrer" className="block">
                    <div className="font-kanit font-semibold text-orange-900">{item.title}</div>
                    <div className="text-sm text-gray-500 font-sarabun">
                      {item.isoDate ? new Date(item.isoDate).toLocaleString('th-TH') : (item.pubDate || '')}
                    </div>
                    {item.summary && (
                      <p className="mt-1 text-gray-700 line-clamp-2 font-sarabun" dangerouslySetInnerHTML={{ __html: item.summary }} />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
