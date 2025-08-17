declare module 'thai-lunar-date' {
  export class ThaiLunarDate {
    constructor(date: Date);
    /** true = ขึ้น (waxing), false = แรม (waning) */
    isWaxing: boolean;
    /** lunar day (1-15) */
    day: number;
    /** convenience flag if the date is Wan Phra */
    isHolyDay: boolean;
  }
  const _default: typeof ThaiLunarDate;
  export default _default;
}
