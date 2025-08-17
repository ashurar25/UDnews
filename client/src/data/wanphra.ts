export interface WanPhraEntry { date: string; label: string }

// Precomputed Wan Phra dates by year-month (YYYY-MM) -> entries
// NOTE: Fill with accurate data as needed. Example structure provided.
const DATA: Record<string, WanPhraEntry[]> = {
  // Example entries (placeholders) — replace with accurate dates for production
  // '2025-08': [
  //   { date: '2025-08-04', label: 'แรม 8 ค่ำ' },
  //   { date: '2025-08-11', label: 'แรม 15 ค่ำ' },
  //   { date: '2025-08-19', label: 'ขึ้น 8 ค่ำ' },
  //   { date: '2025-08-26', label: 'ขึ้น 15 ค่ำ' },
  // ],
};

export function getWanPhraFallback(year: number, month: number): WanPhraEntry[] {
  const key = `${year}-${String(month).padStart(2,'0')}`;
  return DATA[key] || [];
}
