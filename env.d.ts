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
