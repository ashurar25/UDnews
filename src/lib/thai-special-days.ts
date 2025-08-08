import { format } from "date-fns"
import { th } from "date-fns/locale"

export type ThaiSpecialDay = {
  id: string
  name: string
  date: string // MM-DD format
  theme: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

export const THAI_SPECIAL_DAYS: ThaiSpecialDay[] = [
  {
    id: "kings-birthday",
    name: "วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว",
    date: "07-28", // 28 กรกฎาคม
    theme: "royal-yellow",
    description: "ธีมสีเหลืองเพื่อเฉลิมพระเกียรติ",
    colors: {
      primary: "45 93% 58%", // Royal Yellow
      secondary: "43 74% 66%", // Light Yellow
      accent: "38 92% 50%" // Golden
    }
  },
  {
    id: "mothers-day",
    name: "วันแม่แห่งชาติ",
    date: "08-12", // 12 สิงหาคม
    theme: "mothers-blue",
    description: "ธีมสีฟ้าเพื่อเทิดพระเกียรติสมเด็จพระนางเจ้าสิริกิติ์ พระบรมราชินีนาถ",
    colors: {
      primary: "214 100% 59%", // Royal Blue
      secondary: "213 94% 68%", // Light Blue
      accent: "212 100% 45%" // Deep Blue
    }
  },
  {
    id: "fathers-day",
    name: "วันพ่อแห่งชาติ",
    date: "12-05", // 5 ธันวาคม
    theme: "fathers-yellow",
    description: "ธีมสีเหลืองเพื่อเทิดพระเกียรติพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร",
    colors: {
      primary: "45 93% 58%", // Royal Yellow
      secondary: "43 74% 66%", // Light Yellow
      accent: "38 92% 50%" // Golden
    }
  },
  {
    id: "national-day",
    name: "วันชาติ",
    date: "12-05", // 5 ธันวาคม (same as Father's Day)
    theme: "national-tricolor",
    description: "ธีมสีธงชาติไทย แดง ขาว น้ำเงิน",
    colors: {
      primary: "0 72% 51%", // Thai Red
      secondary: "220 100% 50%", // Thai Blue
      accent: "0 0% 100%" // White
    }
  },
  {
    id: "constitution-day",
    name: "วันรัฐธรรมนูญ",
    date: "12-10", // 10 ธันวาคม
    theme: "constitution-gold",
    description: "ธีมสีทองและขาวเพื่อเฉลิมฉลอง",
    colors: {
      primary: "38 92% 50%", // Gold
      secondary: "45 93% 58%", // Light Gold
      accent: "0 0% 95%" // Off White
    }
  },
  {
    id: "makha-bucha",
    name: "วันมาघบูชา",
    date: "variable", // วันขึ้น 15 ค่ำ เดือน 3 (เปลี่ยนทุกปี)
    theme: "buddhist-saffron",
    description: "ธีมสีเหลืองกุหลาบตามประเพณีพุทธศาสนา",
    colors: {
      primary: "33 100% 50%", // Saffron
      secondary: "35 85% 60%", // Light Saffron
      accent: "30 95% 40%" // Deep Saffron
    }
  },
  {
    id: "songkran",
    name: "วันสงกรานต์",
    date: "04-13", // 13 เมษายน
    theme: "songkran-blue",
    description: "ธีมสีฟ้าและขาวเฉลิมฉลองปีใหม่ไทย",
    colors: {
      primary: "195 100% 50%", // Water Blue
      secondary: "200 100% 70%", // Light Blue
      accent: "190 100% 42%" // Deep Blue
    }
  }
]

export function getCurrentThaiSpecialDay(): ThaiSpecialDay | null {
  const now = new Date()
  const currentDate = format(now, "MM-dd")
  
  return THAI_SPECIAL_DAYS.find(day => day.date === currentDate) || null
}

export function isThaiSpecialDay(): boolean {
  return getCurrentThaiSpecialDay() !== null
}

export function getThaiSpecialDayTheme(): string {
  const specialDay = getCurrentThaiSpecialDay()
  return specialDay ? specialDay.theme : 'default'
}

export function formatThaiDate(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: th })
}