// Thai calendar utilities: Wan Phra (Buddhist holy days) and Thai holidays
// Wan Phra (วันพระ) requires Thai lunar calculations.

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

// Constants for lunar calculations
const LUNAR_MONTH = 29.530588853; // Synodic month in days
const LUNAR_YEAR = 354.36707; // Lunar year in days
const EPOCH = 2440587.5; // Unix epoch in Julian days (1970-01-01)

// Convert a Date to Julian day
function toJulian(date: Date): number {
  return date.getTime() / 86400000 + EPOCH;
}

// Calculate moon phase (0-1)
function getMoonPhase(julian: number): number {
  const phase = ((julian - 2451550.1) / LUNAR_MONTH) % 1;
  return phase < 0 ? phase + 1 : phase;
}

// Get moon phase name in Thai
function getMoonPhaseName(phase: number): { label: string; isWaxing: boolean } {
  if (phase < 0.03 || phase > 0.97) return { label: 'ขึ้น 15 ค่ำ', isWaxing: false };
  if (phase < 0.22) return { label: 'แรม 1 ค่ำ', isWaxing: false };
  if (phase < 0.28) return { label: 'แรม 8 ค่ำ', isWaxing: false };
  if (phase < 0.5) return { label: 'แรม 15 ค่ำ', isWaxing: false };
  if (phase < 0.53) return { label: 'ขึ้น 1 ค่ำ', isWaxing: true };
  if (phase < 0.72) return { label: 'ขึ้น 8 ค่ำ', isWaxing: true };
  return { label: 'ขึ้น 15 ค่ำ', isWaxing: true };
}

/**
 * Get Buddhist holy days (วันพระ) for a specific month
 */
export async function getWanPhraDates(year: number, month: number): Promise<WanPhraDate[]> {
  const results: WanPhraDate[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const julian = toJulian(date);
    const phase = getMoonPhase(julian);
    const { label } = getMoonPhaseName(phase);
    
    // Only include significant days (1st, 8th, 15th waxing/waning)
    if (label.includes('1') || label.includes('8') || label.includes('15')) {
      results.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        label
      });
    }
  }
  
  return results;
}

/**
 * Get the next Buddhist holy day (วันพระ) from a given date
 */
export async function getNextWanPhra(fromDate: Date = new Date()): Promise<WanPhraDate | null> {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth() + 1;
  const day = fromDate.getDate();
  
  // Check next 60 days for a holy day
  for (let i = 0; i < 60; i++) {
    const currentDate = new Date(year, month - 1, day + i);
    const checkYear = currentDate.getFullYear();
    const checkMonth = currentDate.getMonth() + 1;
    const checkDay = currentDate.getDate();
    
    const julian = toJulian(currentDate);
    const phase = getMoonPhase(julian);
    const { label } = getMoonPhaseName(phase);
    
    // Check if it's a significant day
    if (label.includes('8') || label.includes('15')) {
      return {
        date: `${checkYear}-${String(checkMonth).padStart(2, '0')}-${String(checkDay).padStart(2, '0')}`,
        label
      };
    }
  }
  
  return null;
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
 * Get Thai holidays for a specific month
 */
export function getThaiHolidaysForMonth(year: number, month: number): Array<{ date: string; name: string }> {
  const monthStr = String(month).padStart(2, '0');
  return THAI_HOLIDAYS
    .filter(holiday => holiday.date.startsWith(monthStr))
    .map(holiday => ({
      date: `${year}-${holiday.date}`,
      name: holiday.name
    }));
}
