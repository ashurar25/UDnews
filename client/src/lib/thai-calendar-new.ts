// Thai calendar utilities: Wan Phra (Buddhist holy days) and Thai holidays
// Now fetch Wan Phra from server endpoint backed by MyHora JSON

import { api } from '@/lib/api';
import { getWanPhraFallback } from '@/data/wanphra';

export interface WanPhraDate {
  date: string; // YYYY-MM-DD
  label: string; // e.g., 'ขึ้น 15 ค่ำ', 'แรม 8 ค่ำ'
}

// Thai holidays data (you can expand this list)
interface ThaiHoliday {
  date: string; // MM-DD
  name: string;
  type: 'public' | 'religious' | 'observance';
}

/**
 * Get Buddhist holy days (วันพระ) for a specific month using server API.
 */
export async function getWanPhraDates(year: number, month: number): Promise<WanPhraDate[]> {
  try {
    const items = await api.get<WanPhraDate[]>(`/api/wanphra?year=${year}&month=${month}`, { auth: false });
    return Array.isArray(items) ? items : [];
  } catch (e) {
    const fallback = getWanPhraFallback(year, month);
    return fallback.map(x => ({ date: x.date, label: x.label }));
  }
}

/**
 * Get the next Buddhist holy day (วันพระ) from a given date by checking
 * current and next month via the server API.
 */
export async function getNextWanPhra(fromDate: Date = new Date()): Promise<WanPhraDate | null> {
  const y = fromDate.getFullYear();
  const m = fromDate.getMonth() + 1;
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const todayStr = formatDate(fromDate);

  try {
    const [thisM, nextM] = await Promise.all([
      getWanPhraDates(y, m),
      getWanPhraDates(nextYear, nextMonth),
    ]);
    const all = [...thisM, ...nextM];
    const upcoming = all
      .filter(d => d.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] || null;
  } catch {
    const fb = [
      ...getWanPhraFallback(y, m),
      ...getWanPhraFallback(nextYear, nextMonth),
    ].map(x => ({ date: x.date, label: x.label }));
    const upcoming = fb
      .filter(d => d.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] || null;
  }
}

const THAI_HOLIDAYS: ThaiHoliday[] = [
  // Fixed date holidays
  { date: '01-01', name: 'วันขึ้นปีใหม่', type: 'public' },
  { date: '01-16', name: 'วันครู', type: 'observance' },
  { date: '02-14', name: 'วันวาเลนไทน์', type: 'observance' },
  { date: '04-06', name: 'วันจักรี', type: 'public' },
  { date: '04-13', name: 'วันสงกรานต์', type: 'public' },
  { date: '04-14', name: 'วันสงกรานต์', type: 'public' },
  { date: '04-15', name: 'วันสงกรานต์', type: 'public' },
  { date: '05-01', name: 'วันแรงงาน', type: 'public' },
  { date: '05-04', name: 'วันฉัตรมงคล', type: 'public' },
  { date: '05-15', name: 'วันวิสาขบูชา', type: 'religious' },
  { date: '06-03', name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ', type: 'public' },
  { date: '07-28', name: 'วันเฉลิมพระชนมพรรษา', type: 'public' },
  { date: '08-12', name: 'วันแม่แห่งชาติ', type: 'public' },
  { date: '10-13', name: 'วันคล้ายวันสวรรคต', type: 'public' },
  { date: '10-23', name: 'วันปิยมหาราช', type: 'public' },
  { date: '12-05', name: 'วันพ่อแห่งชาติ', type: 'public' },
  { date: '12-10', name: 'วันรัฐธรรมนูญ', type: 'public' },
  { date: '12-25', name: 'วันคริสต์มาส', type: 'observance' },
  { date: '12-31', name: 'วันสิ้นปี', type: 'public' },
];

/**
 * Get Thai holidays for a specific month via server API with static fallback
 */
export async function getThaiHolidaysForMonth(year: number, month: number): Promise<Array<{ date: string; name: string }>> {
  try {
    const items = await api.get<Array<{ date: string; name: string }>>(`/api/thai-holidays?year=${year}&month=${month}`, { auth: false });
    if (Array.isArray(items)) return items;
  } catch (e) {
    // fall through to fallback
  }
  const monthStr = String(month).padStart(2, '0');
  return THAI_HOLIDAYS
    .filter(holiday => holiday.date.startsWith(monthStr))
    .map(holiday => ({ date: `${year}-${holiday.date}`, name: holiday.name }));
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
