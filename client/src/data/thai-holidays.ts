// Thai national and cultural holidays (fixed-date and simple computed) in Gregorian calendar.
// Note: Buddhist holidays based on lunar calendar (Makha/Visakha/Asalha/Khao Phansa) are not included here,
// they will be provided by the lunar module in thai-calendar.ts when available.

export interface ThaiHoliday {
  date: string; // YYYY-MM-DD
  name: string; // Thai name
  type: 'public' | 'cultural' | 'observance';
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function d(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Some rules for movable observances could be added as needed.
export function getThaiHolidays(year: number, month?: number): ThaiHoliday[] {
  const list: ThaiHoliday[] = [];

  const add = (m: number, day: number, name: string, type: ThaiHoliday['type'] = 'public') => {
    list.push({ date: d(year, m, day), name, type });
  };

  // Fixed-date public holidays
  add(1, 1, 'วันขึ้นปีใหม่');
  add(4, 6, 'วันจักรี');
  add(4, 13, 'วันสงกรานต์');
  add(4, 14, 'วันสงกรานต์');
  add(4, 15, 'วันสงกรานต์');
  add(5, 1, 'วันแรงงานแห่งชาติ');
  add(5, 4, 'วันฉัตรมงคล');
  add(6, 3, 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว');
  add(7, 28, 'วันเฉลิมพระชนมพรรษารัชกาลที่ 10');
  add(8, 12, 'วันแม่แห่งชาติ');
  add(10, 13, 'วันคล้ายวันสวรรคตรัชกาลที่ 9');
  add(10, 23, 'วันปิยมหาราช');
  add(12, 5, 'วันพ่อแห่งชาติ');
  add(12, 10, 'วันรัฐธรรมนูญ');
  add(12, 31, 'วันสิ้นปี');

  // Cultural/observance (non-exhaustive)
  add(6, 24, 'วันเปลี่ยนแปลงการปกครอง', 'observance');
  add(7, 29, 'วันภาษาไทยแห่งชาติ', 'observance');
  add(2, 14, 'วันวาเลนไทน์', 'observance');
  add(6, 5, 'วันสิ่งแวดล้อมโลก', 'observance');
  add(3, 13, 'วันช้างไทย', 'observance');
  add(9, 24, 'วันมหิดล', 'observance');
  add(9, 28, 'วันพระราชทานธงชาติไทย', 'observance');
  add(12, 26, 'วันสมเด็จพระเจ้าตากสินมหาราช', 'observance');
  add(2, 3, 'วันทหารผ่านศึก', 'observance');
  add(6, 1, 'วันไหว้ครู (ประมาณ)', 'observance');

  // Filter by month if provided
  return month ? list.filter(h => h.date.slice(5, 7) === pad(month)) : list;
}

export function isSameISODate(a: string, b: string) {
  return a === b;
}

export function getTodayHoliday(today = new Date()): ThaiHoliday | null {
  const iso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const all = getThaiHolidays(today.getFullYear());
  return all.find(h => h.date === iso) || null;
}
