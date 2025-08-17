import React from 'react';
import LotteryResults from '@/components/LotteryResults';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, CalendarDays, Sparkles, ExternalLink, Share2 } from 'lucide-react';
import MetaHead from '@/components/MetaHead';

export default function Lottery() {

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {};
  }, []);

  // Title and SEO handled by <MetaHead>

  // Latest announcement from lottery.co.th RSS
  const [latestPost, setLatestPost] = React.useState<{ title: string; link: string; pubDate: string; isoDate: string; summary: string } | null>(null);
  const [loadingPost, setLoadingPost] = React.useState(true);
  const [errorPost, setErrorPost] = React.useState<string | null>(null);
  const [draw, setDraw] = React.useState<{
    date?: string;
    drawDate?: string;
    governmentId?: string;
    prizes?: {
      first?: string[];
      last2?: string[];
      first3?: string[];
      last3?: string[];
      nearFirst?: string[];
    };
  } | null>(null);
  const [loadingDraw, setLoadingDraw] = React.useState(true);
  const [errorDraw, setErrorDraw] = React.useState<string | null>(null);

  function formatThaiDate(iso: string | undefined) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch {
      return '';
    }
  }

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPost(true);
        const r = await fetch('/api/lottery/thai/rss/lotteryco', { headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error('fetch failed');
        const data = await r.json();
        if (!mounted) return;
        setLatestPost(data?.latest || null);
        setErrorPost(null);
      } catch (e: any) {
        if (!mounted) return;
        setErrorPost('ไม่สามารถโหลดประกาศงวดล่าสุด');
      } finally {
        if (mounted) setLoadingPost(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch normalized latest draw numbers
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingDraw(true);
        const r = await fetch('/api/lottery/thai/latest', { headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error('fetch failed');
        const data = await r.json();
        if (!mounted) return;
        setDraw(data || null);
        setErrorDraw(null);
      } catch (e: any) {
        if (!mounted) return;
        setErrorDraw('โหลดเลขรางวัลล่าสุดไม่ได้');
      } finally {
        if (mounted) setLoadingDraw(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Prepare dynamic SEO fields
  const desc = latestPost?.summary ? latestPost.summary.replace(/<[^>]+>/g, '').slice(0, 240) : 'อัปเดตผลสลากกินแบ่งรัฐบาลงวดล่าสุด แสดงรางวัลสำคัญและลิงก์ประกาศจากแหล่งทางการ';
  const title = (latestPost?.title || 'ผลสลากกินแบ่งรัฐบาล งวดล่าสุด') + ' | UD News Update';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'ผลสลากกินแบ่งรัฐบาล งวดล่าสุด',
    description: desc,
    url: 'https://udnewsupdate.sbs/lottery',
    mainEntity: latestPost?.link
      ? {
          '@type': 'Article',
          headline: latestPost.title,
          datePublished: latestPost.isoDate,
          dateModified: latestPost.isoDate,
          mainEntityOfPage: latestPost.link,
          url: latestPost.link,
          publisher: { '@type': 'Organization', name: 'UD News Update' },
          about: (draw && (draw.date || draw.drawDate)) ? {
            '@type': 'Thing',
            name: 'Thai Lottery Draw',
            description: 'Lottery draw results including first prize and other numbers',
            additionalProperty: [
              ...(draw.prizes?.first ? [{ '@type': 'PropertyValue', name: 'first', value: (draw.prizes.first || []).join(', ') }] : []),
              ...(draw.prizes?.nearFirst ? [{ '@type': 'PropertyValue', name: 'nearFirst', value: (draw.prizes.nearFirst || []).join(', ') }] : []),
              ...(draw.prizes?.first3 ? [{ '@type': 'PropertyValue', name: 'first3', value: (draw.prizes.first3 || []).join(', ') }] : []),
              ...(draw.prizes?.last3 ? [{ '@type': 'PropertyValue', name: 'last3', value: (draw.prizes.last3 || []).join(', ') }] : []),
              ...(draw.prizes?.last2 ? [{ '@type': 'PropertyValue', name: 'last2', value: (draw.prizes.last2 || []).join(', ') }] : []),
            ],
            identifier: draw.governmentId,
            startDate: (draw.date || draw.drawDate),
          } : undefined,
        }
      : undefined,
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-black">
      <MetaHead
        title={title}
        description={desc}
        image="/og-article-default.svg"
        url="/lottery"
        canonical="https://udnewsupdate.sbs/lottery"
        siteName="UD News Update"
        type="website"
        locale="th_TH"
        jsonLd={jsonLd as unknown as Record<string, any>}
      />
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

        {/* Latest Lottery Announcement (from lottery.co.th RSS) */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-lg dark:from-orange-950/40 dark:via-gray-900/40 dark:to-gray-900/40 dark:border-gray-700">
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/10" />
            <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10" />
            <div className="relative p-5 md:p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-600 text-white px-3 py-1 text-xs font-sarabun shadow">
                  <Sparkles className="h-3.5 w-3.5" /> ประกาศผลสลาก งวดล่าสุด
                </div>
                {latestPost?.isoDate && (
                  <div className="text-xs md:text-sm text-orange-900/80 dark:text-orange-200 font-sarabun">
                    อัปเดต: {formatThaiDate(latestPost.isoDate)}
                  </div>
                )}
              </div>

              {/* Content */}
              {loadingPost ? (
                <div className="mt-4 animate-pulse space-y-2">
                  <div className="h-6 w-3/4 rounded bg-orange-200/50 dark:bg-gray-700" />
                  <div className="h-4 w-1/2 rounded bg-orange-200/40 dark:bg-gray-700" />
                </div>
              ) : errorPost ? (
                <div className="mt-4 text-sm text-red-600 dark:text-red-400 font-sarabun">{errorPost}</div>
              ) : latestPost ? (
                <div className="mt-4">
                  <h3 className="text-2xl md:text-3xl font-bold font-kanit text-orange-900 dark:text-orange-100 drop-shadow-sm">
                    {latestPost.title || 'ผลสลากงวดล่าสุด'}
                  </h3>
                  {latestPost.summary && (
                    <p className="mt-2 text-sm md:text-base text-gray-700 dark:text-gray-300 font-sarabun line-clamp-3">
                      {latestPost.summary.replace(/<[^>]+>/g, '')}
                    </p>
                  )}

                  {/* Key numbers preview */}
                  <div className="mt-4">
                    {loadingDraw ? (
                      <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="h-10 rounded bg-orange-200/50 dark:bg-gray-700" />
                        <div className="h-10 rounded bg-orange-200/50 dark:bg-gray-700" />
                        <div className="h-10 rounded bg-orange-200/50 dark:bg-gray-700" />
                        <div className="h-10 rounded bg-orange-200/50 dark:bg-gray-700" />
                      </div>
                    ) : errorDraw ? (
                      <div className="text-xs text-red-600 dark:text-red-400 font-sarabun">{errorDraw}</div>
                    ) : draw?.prizes ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="rounded-lg bg-white/80 dark:bg-gray-800/60 border border-amber-200/70 dark:border-gray-700 px-3 py-2 shadow-sm">
                          <div className="text-[11px] text-gray-600 dark:text-gray-300 font-sarabun">รางวัลที่ 1</div>
                          <div className="text-lg md:text-xl font-kanit text-orange-800 dark:text-orange-200 tracking-wider">{draw.prizes.first?.[0] || '— — — — — —'}</div>
                        </div>
                        <div className="rounded-lg bg-white/80 dark:bg-gray-800/60 border border-amber-200/70 dark:border-gray-700 px-3 py-2 shadow-sm">
                          <div className="text-[11px] text-gray-600 dark:text-gray-300 font-sarabun">เลขท้าย 2 ตัว</div>
                          <div className="text-lg md:text-xl font-kanit text-orange-800 dark:text-orange-200 tracking-wider">{draw.prizes.last2?.[0] || '— —'}</div>
                        </div>
                        <div className="rounded-lg bg-white/80 dark:bg-gray-800/60 border border-amber-200/70 dark:border-gray-700 px-3 py-2 shadow-sm">
                          <div className="text-[11px] text-gray-600 dark:text-gray-300 font-sarabun">เลขหน้า 3 ตัว</div>
                          <div className="text-lg md:text-xl font-kanit text-orange-800 dark:text-orange-200 tracking-wider">{draw.prizes.first3?.[0] || '— — —'}</div>
                        </div>
                        <div className="rounded-lg bg-white/80 dark:bg-gray-800/60 border border-amber-200/70 dark:border-gray-700 px-3 py-2 shadow-sm">
                          <div className="text-[11px] text-gray-600 dark:text-gray-300 font-sarabun">เลขท้าย 3 ตัว</div>
                          <div className="text-lg md:text-xl font-kanit text-orange-800 dark:text-orange-200 tracking-wider">{draw.prizes.last3?.[0] || '— — —'}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <a
                      href={latestPost.link || 'https://www.lottery.co.th'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white shadow hover:bg-orange-700 transition-colors"
                    >
                      อ่านรายละเอียด <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const text = `${latestPost.title}\nอ่านต่อ: ${latestPost.link}`;
                        if (navigator.share) {
                          navigator.share({ title: latestPost.title, text, url: latestPost.link }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(text).catch(() => {});
                          alert('คัดลอกข้อความสำหรับแชร์แล้ว');
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white/70 px-4 py-2 text-orange-800 shadow hover:bg-white transition-colors dark:bg-transparent dark:text-orange-200 dark:border-orange-700"
                    >
                      แชร์ประกาศ <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Read-only latest results table */}
        <div className="mb-10">
          <LotteryResults />
        </div>

        {/* Embedded tools from lottery.co.th */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200/70 bg-white/70 backdrop-blur-sm shadow-sm dark:bg-gray-900/60 dark:border-gray-700">
            <div className="px-5 pt-5">
              <h2 className="text-xl font-bold font-kanit text-orange-900 dark:text-orange-200">ผลสลากรางวัลหลัก</h2>
              <p className="mt-1 text-sm text-gray-600 font-sarabun dark:text-gray-300">แสดงเฉพาะรางวัลสำคัญแบบกระชับ</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-b-2xl">
              <iframe
                title="ผลสลาก รางวัลหลัก"
                src="https://www.lottery.co.th/show"
                width="100%"
                height="340"
                frameBorder="0"
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/70 bg-white/70 backdrop-blur-sm shadow-sm dark:bg-gray-900/60 dark:border-gray-700">
            <div className="px-5 pt-5">
              <h2 className="text-xl font-bold font-kanit text-orange-900 dark:text-orange-200">ตรวจหวยจากหมายเลขสลาก</h2>
              <p className="mt-1 text-sm text-gray-600 font-sarabun dark:text-gray-300">กรอกหมายเลขเพื่อตรวจผล</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-b-2xl">
              <iframe
                title="ตรวจหวย กรอกหมายเลข"
                loading="lazy"
                src="https://www.lottery.co.th/numbers"
                width="100%"
                height="410"
                frameBorder="0"
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/70 bg-white/70 backdrop-blur-sm shadow-sm dark:bg-gray-900/60 dark:border-gray-700">
            <div className="px-5 pt-5">
              <h2 className="text-xl font-bold font-kanit text-orange-900 dark:text-orange-200">ผลหวยย้อนหลัง 10 งวด</h2>
              <p className="mt-1 text-sm text-gray-600 font-sarabun dark:text-gray-300">ดูผลย้อนหลังล่าสุด 10 งวด</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-b-2xl">
              <iframe
                title="ผลหวยย้อนหลัง 10 งวด"
                loading="lazy"
                src="https://www.lottery.co.th/10lotto"
                width="100%"
                height="500"
                frameBorder="0"
                className="w-full"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 font-sarabun">
            ข้อมูล iframe ทั้งหมดเป็นของเว็บไซต์ภายนอก (<a className="underline" href="https://www.lottery.co.th" target="_blank" rel="noreferrer">lottery.co.th</a>) และแสดงผลแบบอ่านอย่างเดียว
          </p>
        </div>

        {/* ตรวจหวย UI ถูกนำออก หน้านี้แสดงผลรางวัลเท่านั้น */}
      </div>
    </div>
  );
}
