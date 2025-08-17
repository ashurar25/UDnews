// Ambient module declarations for optional packages
declare module 'thai-lunar-date' {
  // Minimal shape used by our code
  export default class ThaiLunarDate {
    constructor(date: Date);
    isWaxing: boolean;
    day: number; // lunar day (1-15)
    isHolyDay?: boolean;
  }
}
declare module 'qrcode';
declare module 'jsdom';
declare module 'web-push';
declare module 'nodemailer';

declare namespace NodeJS {
  interface ProcessEnv {
    ADMIN_USERNAME?: string;
    ADMIN_PASSWORD?: string;
    BASE_URL?: string;
    PROMPTPAY_ID?: string;
    PROMPTPAY_DISPLAY?: string;
  }
}
