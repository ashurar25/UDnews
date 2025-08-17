// Thai calendar utilities: Wan Phra (Buddhist holy days) and Thai holidays
// Wan Phra (วันพระ) requires Thai lunar calculations. We try to use 'thai-lunar-date' dynamically.
// If unavailable, functions will gracefully fallback.

import { getThaiHolidays, type ThaiHoliday } from "@/data/thai-holidays";
import { getWanPhraFallback } from "@/data/wanphra";

export interface WanPhraDate {
  date: string; // YYYY-MM-DD (Gregorian)
  label: string; // e.g., 'ขึ้น 15 ค่ำ', 'แรม 8 ค่ำ'
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }

// Approximate lunar phase helper (fallback without deps)
// Uses a known new moon reference and synodic month to estimate waxing/waning days.
// Reference new moon: 2000-01-06 18:14 UTC (common astronomical epoch)
const SYNODIC_MONTH = 29.530588853; // days
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0, 0); // ms

function lunarAgeInDays(date: Date): number {
  const t = date.getTime();
  const days = (t - REF_NEW_MOON) / 86400000; // ms -> days
  const age = days % SYNODIC_MONTH;
  return age < 0 ? age + SYNODIC_MONTH : age;
}

function approximateWanPhra(year: number, month: number): WanPhraDate[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const results: WanPhraDate[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    const age = lunarAgeInDays(d);
    // Waxing ~ first half (< 14.77), Waning ~ second half
    const isWaxing = age < (SYNODIC_MONTH / 2);
    // Map continuous age (~0..29.53) to lunar day count 1..15
    const dayLength = SYNODIC_MONTH / 30; // ~0.98435
    const lunarDay = Math.min(15, Math.max(1, Math.round((age / dayLength) % 15 || 1)));

    // Holy days around 8th, 15th waxing; 8th, 14/15th waning
    const near = (target: number, tol = 0.8) => Math.abs(age - target) <= tol;
    const W8 = 7.5; // ~8th day
    const W15 = 14.77; // full moon
    const D8 = W8 + (SYNODIC_MONTH / 2); // ~22.27
    const D14 = W15 + (SYNODIC_MONTH / 2) - 1.0; // ~28.3
    const D15 = SYNODIC_MONTH; // ~29.53 (or 0)

    const isHoly = near(W8) || near(W15) || near(D8) || near(D14) || age >= (SYNODIC_MONTH - 0.7) || age <= 0.7;
    if (isHoly || (isWaxing && (lunarDay === 8 || lunarDay === 15)) || (!isWaxing && (lunarDay === 8 || lunarDay === 14 || lunarDay === 15))) {
      const label = `${isWaxing ? 'ขึ้น' : 'แรม'} ${lunarDay} ค่ำ`;
      results.push({ date: toISO(year, month, day), label });
    }
  }
  // Deduplicate same-labeled close days (edge overlaps around 0/29.53)
  return results.filter((item, idx, arr) => idx === 0 || new Date(item.date).getTime() - new Date(arr[idx - 1].date).getTime() > 20 * 3600 * 1000);
}

// Attempt to compute Wan Phra dates using thai-lunar-date if installed
export async function getWanPhraDates(year: number, month: number): Promise<WanPhraDate[]> {
  try {
    // 1) Try server ICS source first (covers all years when calendar is maintained)
    try {
      const resp = await fetch(`/api/wanphra?year=${year}&month=${month}`);
      if (resp.ok) {
        const items = await resp.json();
        if (Array.isArray(items) && items.length > 0) {
          return items.map((x: any) => ({ date: String(x.date), label: String(x.label || x.summary || '') }));
        }
      }
    } catch {}

    // 2) Try local algorithmic library if available
    // Dynamic import of optional dependency. Use computed specifier with Vite ignore
    // so Rollup doesn't try to resolve it at build time. If not present at runtime,
    // this will throw and be caught below.
    const pkg = 'thai-lunar-date';
    const mod: any = await import(/* @vite-ignore */ pkg);
    const Lunar = mod?.ThaiLunarDate || mod?.default || mod;
    if (!Lunar) throw new Error('thai-lunar-date not available');

    const results: WanPhraDate[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      const lunar = new Lunar(d);
      const { isWaxing, day: lunarDay, isHolyDay } = lunar; // common properties in libs
      if (isHolyDay || (isWaxing && (lunarDay === 8 || lunarDay === 15)) || (!isWaxing && (lunarDay === 8 || lunarDay === 14 || lunarDay === 15))) {
        const label = `${isWaxing ? 'ขึ้น' : 'แรม'} ${lunarDay} ค่ำ`;
        results.push({ date: toISO(year, month, day), label });
      }
    }
    return results;
  } catch (e) {
    // 3) Fallback A: approximate lunar calculation (no external deps)
    const approx = approximateWanPhra(year, month);
    if (approx.length > 0) return approx;
    // 4) Fallback B: use precomputed dataset if available
    const fb = getWanPhraFallback(year, month);
    return fb.map(x => ({ date: x.date, label: x.label }));
  }
}

export function getThaiHolidaysForMonth(year: number, month: number): ThaiHoliday[] {
  return getThaiHolidays(year, month).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getNextWanPhra(fromDate = new Date()): Promise<WanPhraDate | null> {
  const y = fromDate.getFullYear();
  const m = fromDate.getMonth() + 1;
  const d = fromDate.getDate();

  // Search current and next month
  const months: Array<[number, number]> = [[y, m], m === 12 ? [y + 1, 1] : [y, m + 1]];
  for (const [yy, mm] of months) {
    const list = await getWanPhraDates(yy, mm);
    const next = list.find(x => new Date(x.date) >= new Date(y, m - 1, d));
    if (next) return next;
  }
  return null;
}
