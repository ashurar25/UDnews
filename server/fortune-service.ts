import { db } from './db';
import { sql } from 'drizzle-orm';

interface ZodiacSign {
  id: number;
  thai: string;
  english: string;
  element: string;
  dates: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

interface FortuneReading {
  overall: {
    score: number;
    message: string;
    color: string;
  };
  love: {
    score: number;
    message: string;
  };
  career: {
    score: number;
    message: string;
  };
  money: {
    score: number;
    message: string;
  };
  health: {
    score: number;
    message: string;
  };
  luckyNumbers: number[];
  luckyColors: string[];
  advice: string;
}

const zodiacSigns: ZodiacSign[] = [
  { id: 1, thai: 'มกราคม', english: 'Capricorn', element: 'ดิน', dates: '22 ธ.ค. - 19 ม.ค.', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { id: 2, thai: 'กุมภาพันธ์', english: 'Aquarius', element: 'ลม', dates: '20 ม.ค. - 18 ก.พ.', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { id: 3, thai: 'มีนาคม', english: 'Pisces', element: 'น้ำ', dates: '19 ก.พ. - 20 มี.ค.', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
  { id: 4, thai: 'เมษายน', english: 'Aries', element: 'ไฟ', dates: '21 มี.ค. - 19 เม.ย.', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { id: 5, thai: 'พฤษภาคม', english: 'Taurus', element: 'ดิน', dates: '20 เม.ย. - 20 พ.ค.', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { id: 6, thai: 'มิถุนายน', english: 'Gemini', element: 'ลม', dates: '21 พ.ค. - 20 มิ.ย.', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { id: 7, thai: 'กรกฎาคม', english: 'Cancer', element: 'น้ำ', dates: '21 มิ.ย. - 22 ก.ค.', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { id: 8, thai: 'สิงหาคม', english: 'Leo', element: 'ไฟ', dates: '23 ก.ค. - 22 ส.ค.', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { id: 9, thai: 'กันยายน', english: 'Virgo', element: 'ดิน', dates: '23 ส.ค. - 22 ก.ย.', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { id: 10, thai: 'ตุลาคม', english: 'Libra', element: 'ลม', dates: '23 ก.ย. - 22 ต.ค.', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { id: 11, thai: 'พฤศจิกายน', english: 'Scorpio', element: 'น้ำ', dates: '23 ต.ค. - 21 พ.ย.', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { id: 12, thai: 'ธันวาคม', english: 'Sagittarius', element: 'ไฟ', dates: '22 พ.ย. - 21 ธ.ค.', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 }
];

export class FortuneService {
  
  // Get zodiac sign by birth date
  getZodiacByDate(birthDate: Date): ZodiacSign | null {
    const month = birthDate.getMonth() + 1; // JavaScript months are 0-indexed
    const day = birthDate.getDate();
    
    for (const zodiac of zodiacSigns) {
      // Handle zodiac signs that cross year boundary (like Capricorn)
      if (zodiac.startMonth > zodiac.endMonth) {
        if ((month === zodiac.startMonth && day >= zodiac.startDay) || 
            (month === zodiac.endMonth && day <= zodiac.endDay)) {
          return zodiac;
        }
      } else {
        if ((month === zodiac.startMonth && day >= zodiac.startDay) || 
            (month === zodiac.endMonth && day <= zodiac.endDay) ||
            (month > zodiac.startMonth && month < zodiac.endMonth)) {
          return zodiac;
        }
      }
    }
    
    return null;
  }

  // Get zodiac sign by Thai name
  getZodiacByName(thaiName: string): ZodiacSign | null {
    return zodiacSigns.find(zodiac => zodiac.thai === thaiName) || null;
  }

  // Get all zodiac signs
  getAllZodiacs(): ZodiacSign[] {
    return zodiacSigns;
  }

  // Generate daily fortune reading
  generateDailyFortune(zodiac: ZodiacSign, date: Date = new Date()): FortuneReading {
    // Create a deterministic seed based on zodiac and date
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const seed = this.hashCode(zodiac.thai + dateString);
    
    // Seeded random number generator
    const random = (min: number, max: number, offset: number = 0) => {
      const x = Math.sin((seed + offset) * 9999) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    const overallScore = random(60, 95);
    const getScoreColor = (score: number) => {
      if (score >= 85) return 'text-green-600';
      if (score >= 70) return 'text-yellow-600';
      return 'text-red-600';
    };

    // Fortune messages based on zodiac element and current conditions
    const fortuneMessages = this.getFortuneMessages(zodiac.element);
    
    const loveScore = random(50, 100, 1);
    const careerScore = random(50, 100, 2);
    const moneyScore = random(50, 100, 3);
    const healthScore = random(50, 100, 4);

    return {
      overall: {
        score: overallScore,
        message: overallScore >= 85 ? 'วันนี้เป็นวันที่ดีมาก โชคดีในทุกเรื่อง!' : 
                overallScore >= 70 ? 'วันนี้เป็นวันที่ดีพอสมควร มีโอกาสดีๆ เข้ามา' : 
                'วันนี้ควรระมัดระวังมากขึ้น คิดก่อนทำทุกอย่าง',
        color: getScoreColor(overallScore)
      },
      love: {
        score: loveScore,
        message: fortuneMessages.love[random(0, fortuneMessages.love.length - 1, 5)]
      },
      career: {
        score: careerScore,
        message: fortuneMessages.career[random(0, fortuneMessages.career.length - 1, 6)]
      },
      money: {
        score: moneyScore,
        message: fortuneMessages.money[random(0, fortuneMessages.money.length - 1, 7)]
      },
      health: {
        score: healthScore,
        message: fortuneMessages.health[random(0, fortuneMessages.health.length - 1, 8)]
      },
      luckyNumbers: [
        random(1, 99, 9),
        random(1, 99, 10),
        random(1, 99, 11)
      ],
      luckyColors: this.getLuckyColors(zodiac.element, random(0, 2, 12)).split(', '),
      advice: this.getAdvice(zodiac.element, overallScore, random(0, 4, 13))
    };
  }

  // Hash function for consistent seeding
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get fortune messages based on element
  private getFortuneMessages(element: string) {
    const baseMessages = {
      love: [
        'ความรักราบรื่น มีโอกาสพบเจอคนใหม่ที่น่าสนใจ',
        'ควรระวังเรื่องความเข้าใจผิดกับคนรัก สื่อสารให้ชัดเจน',
        'วันนี้เหมาะกับการแสดงความรู้สึกที่แท้จริงต่อคนที่รัก',
        'มีโอกาสได้รับข่าวดีเรื่องความรัก หรือได้พบคนพิเศษ',
        'ควรใช้เวลากับครอบครัวและคนที่รักมากขึ้น'
      ],
      career: [
        'งานราชการมีความคืบหน้า มีโอกาสเลื่อนตำแหน่งหรือได้รับการยอมรับ',
        'ควรระวังการตัดสินใจเรื่องงานในวันนี้ คิดให้รอบคอบ',
        'มีโอกาสได้รับโปรเจกต์ใหม่ที่น่าสนใจและท้าทาย',
        'เหมาะกับการเจรจาธุรกิจและทำสัญญาสำคัญ',
        'ควรหาความรู้เพิ่มเติมเพื่อพัฒนาตนเองในการทำงาน'
      ],
      money: [
        'การเงินมั่นคง มีรายได้เสริมหรือโบนัสเข้ามา',
        'ควรระวังการใช้จ่ายฟุ่มเฟือย วางแผนการเงินให้ดี',
        'มีโอกาสได้เงินจากการลงทุนหรือการซื้อขาย',
        'เหมาะกับการออมเงินและวางแผนการเงินระยะยาว',
        'ควรหลีกเลี่ยงการให้เงินกู้ยืมหรือการเสี่ยงโชค'
      ],
      health: [
        'สุขภาพแข็งแรง ควรออกกำลังกายสม่ำเสมอเพื่อรักษาสุขภาพ',
        'ควรระวังเรื่องการนอนหลับไม่เพียงพอ พักผ่อนให้เพียงพอ',
        'เหมาะกับการดูแลสุขภาพจิตใจ ทำสิ่งที่ทำให้ผ่อนคลาย',
        'ควรดื่มน้ำให้เพียงพอและทานอาหารที่มีประโยชน์',
        'หลีกเลี่ยงความเครียดและหาเวลาพักผ่อนในธรรมชาติ'
      ]
    };

    // Customize messages based on element
    switch (element) {
      case 'ไฟ':
        return {
          ...baseMessages,
          love: [...baseMessages.love, 'พลังงานความรักสูง เหมาะกับการแสดงออกอย่างกล้าหาญ'],
          career: [...baseMessages.career, 'ความมุ่งมั่นและพลังงานสูงจะช่วยให้ประสบความสำเร็จ']
        };
      case 'ดิน':
        return {
          ...baseMessages,
          money: [...baseMessages.money, 'ความมั่นคงทางการเงินเป็นจุดแข็ง ควรลงทุนระยะยาว'],
          career: [...baseMessages.career, 'ความอดทนและความมั่นคงจะนำมาซึ่งความสำเร็จ']
        };
      case 'ลม':
        return {
          ...baseMessages,
          career: [...baseMessages.career, 'ความคิดสร้างสรรค์และการสื่อสารดีจะเป็นประโยชน์'],
          love: [...baseMessages.love, 'การสื่อสารที่ดีจะช่วยให้ความสัมพันธ์แน่นแฟ้น']
        };
      case 'น้ำ':
        return {
          ...baseMessages,
          health: [...baseMessages.health, 'ควรดูแลสุขภาพจิตใจและอารมณ์ให้สมดุล'],
          love: [...baseMessages.love, 'ความเข้าใจและความเห็นอกเห็นใจจะเสริมสร้างความรัก']
        };
      default:
        return baseMessages;
    }
  }

  // Get lucky colors based on element
  private getLuckyColors(element: string, variant: number): string {
    const colorSets = {
      'ไฟ': [['แดง', 'ส้ม'], ['ทอง', 'เหลือง'], ['ชมพู', 'แดงเข้ม']],
      'ดิน': [['น้ำตาล', 'เหลือง'], ['ครีม', 'ทอง'], ['เขียวอ่อน', 'น้ำตาล']],
      'ลม': [['ขาว', 'เงิน'], ['ฟ้า', 'เทา'], ['เขียวอ่อน', 'ขาว']],
      'น้ำ': [['น้ำเงิน', 'ดำ'], ['เขียว', 'น้ำเงิน'], ['ม่วง', 'น้ำเงินเข้ม']]
    };

    const colors = colorSets[element as keyof typeof colorSets] || colorSets['ไฟ'];
    const selectedColors = colors[variant % colors.length];
    return selectedColors.join(', ');
  }

  // Get advice based on element and overall score
  private getAdvice(element: string, overallScore: number, variant: number): string {
    const adviceByElement = {
      'ไฟ': [
        'ใช้พลังงานในทางที่สร้างสรรค์ หลีกเลี่ยงการใช้อารมณ์',
        'ความมั่นใจในตนเองจะนำพาไปสู่ความสำเร็จ',
        'การแสดงออกอย่างกล้าหาญจะได้รับการตอบรับที่ดี',
        'ควรควบคุมอารมณ์และใช้เหตุผลในการตัดสินใจ',
        'พลังงานสูงวันนี้ ใช้ประโยชน์ให้เต็มที่'
      ],
      'ดิน': [
        'ความอดทนและความมั่นคงจะนำมาซึ่งผลดี',
        'การวางแผนระยะยาวจะให้ผลตอบแทนที่ดี',
        'ความซื่อสัตย์และความน่าเชื่อถือเป็นจุดแข็ง',
        'ควรยึดมั่นในหลักการและไม่หวั่นไหวง่าย',
        'การทำงานหนักจะได้รับการยอมรับ'
      ],
      'ลม': [
        'การสื่อสารที่ดีจะช่วยแก้ปัญหาได้มากมาย',
        'ความคิดสร้างสรรค์จะเป็นกุญแจสู่ความสำเร็จ',
        'ควรเปิดใจรับฟังความคิดเห็นจากผู้อื่น',
        'การเรียนรู้สิ่งใหม่จะเป็นประโยชน์',
        'ความยืดหยุ่นจะช่วยให้ปรับตัวได้ดี'
      ],
      'น้ำ': [
        'ความเข้าใจและความเห็นอกเห็นใจจะสร้างสัมพันธ์ที่ดี',
        'การฟังเสียงหัวใจจะนำทางที่ถูกต้อง',
        'ควรดูแลสุขภาพจิตใจให้สมดุล',
        'การช่วยเหลือผู้อื่นจะนำโชคดีมาให้',
        'ความอ่อนโยนและความเข้าใจจะเป็นพลัง'
      ]
    };

    const advice = adviceByElement[element as keyof typeof adviceByElement] || adviceByElement['ไฟ'];
    let selectedAdvice = advice[variant % advice.length];

    // Add score-based prefix
    if (overallScore >= 85) {
      selectedAdvice = 'วันนี้เป็นวันดี ' + selectedAdvice.toLowerCase();
    } else if (overallScore >= 70) {
      selectedAdvice = 'วันนี้โอเค ' + selectedAdvice;
    } else {
      selectedAdvice = 'ควรระวัง ' + selectedAdvice;
    }

    return selectedAdvice;
  }

  // Get weekly fortune summary
  getWeeklyFortune(zodiac: ZodiacSign): any {
    const today = new Date();
    const weekFortune = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayFortune = this.generateDailyFortune(zodiac, date);
      
      weekFortune.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('th-TH', { weekday: 'long' }),
        overall: dayFortune.overall.score,
        summary: dayFortune.overall.message
      });
    }
    
    return {
      zodiac: zodiac,
      week: weekFortune,
      weeklyAdvice: this.getWeeklyAdvice(zodiac)
    };
  }

  private getWeeklyAdvice(zodiac: ZodiacSign): string {
    const weeklyAdviceByElement = {
      'ไฟ': 'สัปดาห์นี้เหมาะกับการเริ่มต้นโปรเจกต์ใหม่ แต่ควรระวังการใช้อารมณ์มากเกินไป',
      'ดิน': 'สัปดาห์ที่เหมาะกับการวางแผนระยะยาว ความอดทนจะนำมาซึ่งผลดี',
      'ลม': 'การสื่อสารและการเรียนรู้สิ่งใหม่จะเป็นประโยชน์ในสัปดาห์นี้',
      'น้ำ': 'ควรดูแลสุขภาพจิตใจและสร้างสัมพันธ์ที่ดีกับคนรอบข้าง'
    };

    return weeklyAdviceByElement[zodiac.element as keyof typeof weeklyAdviceByElement] || 
           'สัปดาห์นี้เป็นสัปดาห์ที่ดี ควรใช้โอกาสให้เป็นประโยชน์';
  }
}

export const fortuneService = new FortuneService();
