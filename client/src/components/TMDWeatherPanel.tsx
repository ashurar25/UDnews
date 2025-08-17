import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, PROVINCES } from '../store/location';
import { useTMDWeatherSummary } from '../hooks/useTMDForecast';

type ImageCandidate = {
  label: string;
  urls: string[]; // absolute URLs to proxy via server
};

function proxied(src: string) {
  return `/api/tmd/image-proxy?src=${encodeURIComponent(src)}`;
}

function useFirstWorkingImage(urls: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setActive(null);

    (async () => {
      for (const u of urls) {
        try {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('load-failed'));
            img.src = proxied(u);
          });
          if (mounted) {
            setActive(u);
            break;
          }
        } catch {
          // try next
        }
      }
      if (mounted) setLoading(false);
    })();

    return () => { mounted = false; };
  }, [urls.join('|')]);

  return { active: active ? proxied(active) : null, loading } as const;
}

const cardBase = 'rounded-xl border border-white/20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md shadow-md overflow-hidden';

const PanelCard: React.FC<{ title: string; subtitle?: string; candidate: ImageCandidate; height?: number; onOpen?: (src: string, meta?: { type?: 'radar' }) => void }> = ({ title, subtitle, candidate, height = 220, onOpen }) => {
  const { active, loading } = useFirstWorkingImage(candidate.urls);

  if (!active && !loading) {
    return (
      <div className={`${cardBase}`}>
        <div className="px-3 py-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-kanit font-bold">{title}</div>
            {subtitle && <div className="text-[11px] text-muted-foreground font-sarabun">{subtitle}</div>}
          </div>
          <div className="text-[10px] text-muted-foreground font-sarabun">แหล่งข้อมูล: TMD</div>
        </div>
        <div className="p-4 text-xs font-sarabun text-muted-foreground">ไม่พบข้อมูลรูปภาพจาก TMD ในขณะนี้</div>
      </div>
    );
  }

  return (
    <div className={`${cardBase}`}>
      <div className="px-3 py-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-kanit font-bold">{title}</div>
          {subtitle && <div className="text-[11px] text-muted-foreground font-sarabun">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <a href={active} target="_blank" rel="noopener noreferrer" className="text-[10px] underline text-primary font-sarabun">
              เปิดภาพเต็ม
            </a>
          )}
          <div className="text-[10px] text-muted-foreground font-sarabun">แหล่งข้อมูล: TMD</div>
        </div>
      </div>
      <div className="relative w-full" style={{ height }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-sarabun text-muted-foreground">กำลังโหลด...</div>
        ) : (
          <>
            <img
              src={active!}
              alt={title}
              className="w-full h-full object-cover cursor-pointer"
              loading="lazy"
              decoding="async"
              onClick={() => active && onOpen?.(active, { type: title.includes('เรดาร์') ? 'radar' : undefined })}
            />
          </>
        )}
      </div>
    </div>
  );
};

const TMDWeatherPanel: React.FC = () => {
  // Lightbox state
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<'radar' | 'image' | null>(null);
  const closeLightbox = () => setLightboxSrc(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Province selector from global store
  const { province: selectedProv, setProvince } = useLocation();
  const provinces = PROVINCES;

  // Live weather summary (today) to drive background
  const { data: summary } = useTMDWeatherSummary();
  const today = summary?.today;
  const rain = today?.rainChance ?? 0;
  const desc = (today?.condition || '').toLowerCase();
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;

  // Decide background gradient
  const bgClass = useMemo(() => {
    if (!today) return isNight
      ? 'from-slate-800 to-indigo-900'
      : 'from-sky-100 to-blue-200';
    if (desc.includes('thunder')) return 'from-slate-700 to-slate-900';
    if (rain >= 60 || desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle')) {
      return isNight ? 'from-slate-800 to-sky-700' : 'from-sky-200 to-sky-500';
    }
    if (desc.includes('overcast') || desc.includes('broken clouds') || desc.includes('cloud')) {
      return isNight ? 'from-slate-700 to-slate-900' : 'from-gray-200 to-gray-400';
    }
    return isNight ? 'from-slate-800 to-indigo-900' : 'from-sky-100 to-blue-200';
  }, [today, desc, rain, isNight]);
  // Candidate URLs (public TMD endpoints). If any path changes, the component will try alternatives.
  const radarCandidates: ImageCandidate = useMemo(() => ({
    label: 'เรดาร์ฝน (ประเทศไทย)',
    urls: [
      // Common composite radar images (multiple plausible paths)
      'https://weather.tmd.go.th/radar/256km/Composite.png',
      'https://weather.tmd.go.th/radar/Composite.png',
      'https://weather.tmd.go.th/WeatherMap/radar/Composite.png',
      // radar.tmd.go.th variants
      'https://radar.tmd.go.th/256km/Composite.png',
      'https://radar.tmd.go.th/composite/png/latest.png',
    ],
  }), []);

  const satCandidates: ImageCandidate = useMemo(() => ({
    label: 'ภาพถ่ายดาวเทียม (ประเทศไทย)',
    urls: [
      'https://weather.tmd.go.th/satellite/latest_TH.png',
      'https://weather.tmd.go.th/WeatherMap/satellite/latest_TH.png',
      'https://weather.tmd.go.th/satellite/Thailand.png',
      // additional common variants
      'https://weather.tmd.go.th/satellite/latest.jpg',
      'https://weather.tmd.go.th/satellite/ir_th.png',
    ],
  }), []);

  // Meteogram for Udon Thani (try multiple known patterns). These paths may vary by TMD deployment.
  const meteogramCandidates: ImageCandidate = useMemo(() => {
    const { lat, lon, label } = selectedProv;
    const encodedProv = encodeURIComponent(label);
    return {
      label: `Meteogram (${label})`,
      urls: [
        // Image-specific endpoints (if available)
        `https://data.tmd.go.th/nwpapiv1/meteogram/image?lat=${lat}&lon=${lon}`,
        `https://data.tmd.go.th/nwpapiv1/meteogram/image?province=${encodedProv}`,
        `https://data.tmd.go.th/nwpapi/meteogram/image?lat=${lat}&lon=${lon}`,
        `https://data.tmd.go.th/nwpapi/meteogram/image?province=${encodedProv}`,
        // Generic endpoints (some deployments return image directly)
        `https://data.tmd.go.th/nwpapiv1/meteogram/latlon?lat=${lat}&lon=${lon}`,
        `https://data.tmd.go.th/nwpapiv1/meteogram/province?name=${encodedProv}`,
        `https://data.tmd.go.th/nwpapi/meteogram?lat=${lat}&lon=${lon}`,
        `https://data.tmd.go.th/nwpapi/meteogram?province=${encodedProv}`,
      ],
    } as ImageCandidate;
  }, [selectedProv]);

  return (
    <div className={`rounded-2xl p-3 bg-gradient-to-br ${bgClass}`}>
      <div className="space-y-4">
      <div className="px-1">
        <h3 className="text-lg font-kanit font-bold mb-1">สภาพอากาศ TMD</h3>
        <p className="text-[12px] font-sarabun text-muted-foreground">ข้อมูลจากกรมอุตุนิยมวิทยา (อัปเดตอัตโนมัติ)</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <PanelCard title="เรดาร์ฝน" subtitle="อัปเดตล่าสุดจากกรมอุตุนิยมวิทยา" candidate={radarCandidates} onOpen={(src, meta) => { setLightboxSrc(src); setLightboxType(meta?.type === 'radar' ? 'radar' : 'image'); }} />
        <PanelCard title="ภาพดาวเทียม" subtitle="กลุ่มเมฆ/การก่อตัวของฝน" candidate={satCandidates} onOpen={(src) => { setLightboxSrc(src); setLightboxType('image'); }} />
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-sm font-kanit font-bold">พื้นที่แสดงผล Meteogram</div>
            <div className="flex gap-2">
              {provinces.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setProvince(p)}
                  className={`text-xs font-sarabun rounded-full px-3 py-1 border transition-colors ${
                    selectedProv.key === p.key ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/60 border-white/70 hover:bg-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <PanelCard title="Meteogram" subtitle={`แนวโน้มสภาพอากาศแบบชั่วโมง (${selectedProv.label})`} candidate={meteogramCandidates} height={260} onOpen={setLightboxSrc} />
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && lightboxType !== 'radar' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={closeLightbox} role="dialog" aria-modal="true">
          <div className="max-w-5xl max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxSrc} alt="preview" className="w-full h-full object-contain" />
            <div className="text-center mt-2">
              <button onClick={closeLightbox} className="px-4 py-1 text-sm font-sarabun rounded bg-white text-black" aria-label="ปิดภาพเต็ม">ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Radar timeline lightbox */}
      {lightboxType === 'radar' && (
        <RadarTimelineLightbox initialSrc={lightboxSrc!} onClose={closeLightbox} />
      )}
      </div>
    </div>
  );
};

// --- Radar timeline lightbox ---
function buildRecentTimestamps(count = 8, stepMin = 10): string[] {
  // Format: YYYYMMDDHHmm
  const res: string[] = [];
  const now = new Date();
  // Align to previous 10-min slot
  const ms = now.getUTCMinutes();
  const slot = ms - (ms % stepMin);
  now.setUTCMinutes(slot, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getTime() - i * stepMin * 60_000);
    const YYYY = d.getUTCFullYear();
    const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
    const DD = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    res.push(`${YYYY}${MM}${DD}${hh}${mm}`);
  }
  return res;
}

function toProxy(url: string) {
  return `/api/tmd/image-proxy?src=${encodeURIComponent(url)}`;
}

function radarFrameTemplates(ts: string): string[] {
  // Try multiple plausible patterns (some may 404; we'll skip silently)
  return [
    // Example paths (composite Thailand) – may vary by TMD deployment
    `https://weather.tmd.go.th/satellite/radar/composite_${ts}.png`,
    `https://weather.tmd.go.th/satellite/radar/composite/${ts}.png`,
    `https://radar.tmd.go.th/composite/png/${ts}.png`,
    // Fallback with query parameter if the server supports ts param
    `https://weather.tmd.go.th/satellite/composite.png?ts=${ts}`,
  ];
}

function useFirstAvailable(urls: string[]) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let stop = false;
    (async () => {
      for (const u of urls) {
        try {
          const r = await fetch(toProxy(u), { method: 'HEAD' as any });
          if (!stop && r.ok) { setSrc(toProxy(u)); break; }
        } catch {}
      }
    })();
    return () => { stop = true; };
  }, [JSON.stringify(urls)]);
  return src;
}

const RadarTimelineLightbox: React.FC<{ initialSrc: string; onClose: () => void }> = ({ initialSrc, onClose }) => {
  const [playing, setPlaying] = useState(true);
  const [index, setIndex] = useState(0);
  const timestamps = useMemo(() => buildRecentTimestamps(10, 10).reverse(), []); // oldest..latest
  // Build one frame source per timestamp lazily
  const frames = timestamps.map(ts => useFirstAvailable(radarFrameTemplates(ts)));

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % frames.length);
    }, 600);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  const current = frames[index] || initialSrc;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="max-w-6xl w-full max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full h-[70vh] bg-black/40 rounded">
          {current ? (
            <img src={current} alt={`radar-${index}`} className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/80">กำลังค้นหารูปภาพเรดาร์...</div>
          )}
          {/* Controls */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 rounded-full px-3 py-1 text-sm">
            <button onClick={() => setIndex(i => (i - 1 + frames.length) % frames.length)} className="px-2">ย้อน</button>
            <button onClick={() => setPlaying(p => !p)} className="px-3 py-0.5 rounded bg-orange-500 text-white">{playing ? 'หยุด' : 'เล่น'}</button>
            <button onClick={() => setIndex(i => (i + 1) % frames.length)} className="px-2">ถัดไป</button>
          </div>
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">เฟรม {index + 1}/{frames.length}</div>
        </div>
        <div className="text-center mt-2">
          <button onClick={onClose} className="px-4 py-1 text-sm font-sarabun rounded bg-white text-black" aria-label="ปิดภาพเรดาร์">ปิด</button>
        </div>
      </div>
    </div>
  );
};

export default TMDWeatherPanel;
