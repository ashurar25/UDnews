import React from 'react';
import LotteryResults from '@/components/LotteryResults';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, CalendarDays, Sparkles } from 'lucide-react';

export default function Lottery() {

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {};
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-black">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-200/50 blur-3xl dark:bg-orange-500/20" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-500/20" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="outline" className="font-sarabun gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ArrowLeft className="h-4 w-4" /> กลับหน้าแรก
            </Button>
          </Link>
        </div>

        {/* Shareable Hero Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50 to-orange-100 shadow-lg dark:from-gray-900 dark:via-gray-900/60 dark:to-gray-800 dark:border-gray-700">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-200/50 via-transparent to-transparent dark:from-orange-500/10" />
          <div className="relative flex flex-col md:flex-row items-center gap-5 p-5 md:p-6">
            <img
              src="/logo.jpg"
              alt="UD News Update"
              className="h-16 w-16 md:h-20 md:w-20 rounded-xl object-cover shadow-md ring-2 ring-white/70 dark:ring-gray-700"
              loading="eager"
            />
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-orange-800 text-xs font-sarabun shadow-sm dark:bg-orange-900/40 dark:text-orange-200">
                <Sparkles className="h-3.5 w-3.5" /> ผลฉลากรัฐบาลงวดล่าสุด
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold font-kanit text-orange-900 drop-shadow-sm dark:text-orange-200">
                อัพเดทข่าวอุดร · ผลสลากกินแบ่งรัฐบาล
              </h1>
              <p className="mt-1 text-sm md:text-base text-gray-700 font-sarabun dark:text-gray-300">
                แสดงข้อมูลอย่างเป็นทางการจากกองสลาก — อ่านอย่างเดียว พร้อมลิงก์ข่าวหวยเดลินิวส์
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <span className="inline-flex items-center gap-1 font-sarabun">
                  <Trophy className="h-4 w-4 text-amber-500" /> รางวัลที่ 1 เด่นชัด อ่านง่าย
                </span>
                <span className="inline-flex items-center gap-1 font-sarabun">
                  <CalendarDays className="h-4 w-4 text-orange-500" /> อัปเดตอัตโนมัติ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Read-only latest results table */}
        <div className="mb-10">
          <LotteryResults />
        </div>

        {/* ตรวจหวย UI ถูกนำออก หน้านี้แสดงผลรางวัลเท่านั้น */}
      </div>
    </div>
  );
}
