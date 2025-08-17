// Thai calendar utilities: Wan Phra (Buddhist holy days) and Thai holidays
// Wan Phra (วันพระ) requires Thai lunar calculations. We try to use 'thai-lunar-date' dynamically.
// If unavailable, functions will gracefully fallback.

import { getThaiHolidays, type ThaiHoliday } from "@/data/thai-holidays";

export interface WanPhraDate {
  date: string; // YYYY-MM-DD (Gregorian)
  label: string; // e.g., 'ขึ้น 15 ค่ำ', 'แรม 8 ค่ำ'
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }

// Attempt to compute Wan Phra dates using thai-lunar-date if installed
export async function getWanPhraDates(year: number, month: number): Promise<WanPhraDate[]> {
  try {
    // Dynamic import to avoid build-time error if package is missing
    const mod: any = await import('thai-lunar-date');
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
    // Fallback: return empty; UI will handle and show guidance
    return [];
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
