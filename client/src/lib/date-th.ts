export function pad(n: number) { return String(n).padStart(2, '0'); }
export function toISO(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }
export function formatThaiDateISO(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(d);
}
export function formatThaiMonthYear(y: number, m: number) {
  return new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: 'long' }).format(new Date(y, m - 1, 1));
}
