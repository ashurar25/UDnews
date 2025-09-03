import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, Heart, Coins, Briefcase, Shield } from 'lucide-react';

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

interface ZodiacSign {
  thai: string;
  english: string;
  element: string;
  dates: string;
}

const zodiacSigns: ZodiacSign[] = [
  { thai: 'มกราคม', english: 'Capricorn', element: 'ดิน', dates: '22 ธ.ค. - 19 ม.ค.' },
  { thai: 'กุมภาพันธ์', english: 'Aquarius', element: 'ลม', dates: '20 ม.ค. - 18 ก.พ.' },
  { thai: 'มีนาคม', english: 'Pisces', element: 'น้ำ', dates: '19 ก.พ. - 20 มี.ค.' },
  { thai: 'เมษายน', english: 'Aries', element: 'ไฟ', dates: '21 มี.ค. - 19 เม.ย.' },
  { thai: 'พฤษภาคม', english: 'Taurus', element: 'ดิน', dates: '20 เม.ย. - 20 พ.ค.' },
  { thai: 'มิถุนายน', english: 'Gemini', element: 'ลม', dates: '21 พ.ค. - 20 มิ.ย.' },
  { thai: 'กรกฎาคม', english: 'Cancer', element: 'น้ำ', dates: '21 มิ.ย. - 22 ก.ค.' },
  { thai: 'สิงหาคม', english: 'Leo', element: 'ไฟ', dates: '23 ก.ค. - 22 ส.ค.' },
  { thai: 'กันยายน', english: 'Virgo', element: 'ดิน', dates: '23 ส.ค. - 22 ก.ย.' },
  { thai: 'ตุลาคม', english: 'Libra', element: 'ลม', dates: '23 ก.ย. - 22 ต.ค.' },
  { thai: 'พฤศจิกายน', english: 'Scorpio', element: 'น้ำ', dates: '23 ต.ค. - 21 พ.ย.' },
  { thai: 'ธันวาคม', english: 'Sagittarius', element: 'ไฟ', dates: '22 พ.ย. - 21 ธ.ค.' }
];

const FortuneWidget = () => {
  const [selectedZodiac, setSelectedZodiac] = useState<ZodiacSign | null>(null);
  const [fortune, setFortune] = useState<FortuneReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const thaiDate = today.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    setTodayDate(thaiDate);
  }, []);

  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const getLuckyColors = (element: string, variant: number): string[] => {
    const colorSets = {
      'ไฟ': [['แดง', 'ส้ม'], ['ทอง', 'เหลือง'], ['ชมพู', 'แดงเข้ม']],
      'ดิน': [['น้ำตาล', 'เหลือง'], ['ครีม', 'ทอง'], ['เขียวอ่อน', 'น้ำตาล']],
      'ลม': [['ขาว', 'เงิน'], ['ฟ้า', 'เทา'], ['เขียวอ่อน', 'ขาว']],
      'น้ำ': [['น้ำเงิน', 'ดำ'], ['เขียว', 'น้ำเงิน'], ['ม่วง', 'น้ำเงินเข้ม']]
    };

    const colors = colorSets[element as keyof typeof colorSets] || colorSets['ไฟ'];
    return colors[variant % colors.length];
  };

  const generateFortune = () => {
    if (!selectedZodiac) return;
    
    setIsLoading(true);
    
    // Create a deterministic seed based on zodiac and date
    const today = new Date().toISOString().split('T')[0];
    const seed = hashCode(selectedZodiac.thai + today);
    
    // Seeded random function
    const random = (min: number, max: number) => Math.floor((Math.sin(seed * 9999) * 10000) % (max - min + 1)) + min;
    
    const overallScore = random(60, 95);
    const getScoreColor = (score: number) => {
      if (score >= 85) return 'text-green-600';
      if (score >= 70) return 'text-yellow-600';
      return 'text-red-600';
    };

    const fortuneMessages = {
      love: [
        'ความรักราบรื่น มีโอกาสพบเจอคนใหม่',
        'ควรระวังเรื่องความเข้าใจผิดกับคนรัก',
        'วันนี้เหมาะกับการแสดงความรู้สึกที่แท้จริง',
        'มีโอกาสได้รับข่าวดีเรื่องความรัก',
        'ควรใช้เวลากับครอบครัวมากขึ้น'
      ],
      career: [
        'งานราชการมีความคืบหน้า โอกาสเลื่อนตำแหน่ง',
        'ควรระวังการตัดสินใจเรื่องงานในวันนี้',
        'มีโอกาสได้รับโปรเจกต์ใหม่ที่น่าสนใจ',
        'เหมาะกับการเจรจาธุรกิจและทำสัญญา',
        'ควรหาความรู้เพิ่มเติมเพื่อพัฒนาตนเอง'
      ],
      money: [
        'การเงินมั่นคง มีรายได้เสริมเข้ามา',
        'ควรระวังการใช้จ่ายฟุ่มเฟือย',
        'มีโอกาสได้เงินจากการลงทุน',
        'เหมาะกับการออมเงินและวางแผนการเงิน',
        'ควรหลีกเลี่ยงการให้เงินกู้ยืม'
      ],
      health: [
        'สุขภาพแข็งแรง ควรออกกำลังกายสม่ำเสมอ',
        'ควรระวังเรื่องการนอนหลับไม่เพียงพอ',
        'เหมาะกับการดูแลสุขภาพจิตใจ',
        'ควรดื่มน้ำให้เพียงพอและทานอาหารตรงเวลา',
        'หลีกเลี่ยงความเครียดและพักผ่อนให้เพียงพอ'
      ]
    };

    const advice = [
      'วันนี้เป็นวันที่ดีสำหรับการเริ่มต้นสิ่งใหม่ๆ',
      'ควรมองโลกในแง่ดีและเชื่อมั่นในตนเอง',
      'การช่วยเหลือผู้อื่นจะนำโชคดีมาให้',
      'ใจเย็นๆ และคิดก่อนพูดจะช่วยให้วันนี้ผ่านไปด้วยดี',
      'การทำบุญและแบ่งปันจะเพิ่มบุญบารมี'
    ];

    const newFortune: FortuneReading = {
      overall: {
        score: overallScore,
        message: overallScore >= 85 ? 'วันนี้เป็นวันที่ดีมาก!' : 
                overallScore >= 70 ? 'วันนี้เป็นวันที่ดีพอสมควร' : 
                'วันนี้ควรระมัดระวังมากขึ้น',
        color: getScoreColor(overallScore)
      },
      love: {
        score: random(50, 100),
        message: fortuneMessages.love[random(0, fortuneMessages.love.length - 1)]
      },
      career: {
        score: random(50, 100),
        message: fortuneMessages.career[random(0, fortuneMessages.career.length - 1)]
      },
      money: {
        score: random(50, 100),
        message: fortuneMessages.money[random(0, fortuneMessages.money.length - 1)]
      },
      health: {
        score: random(50, 100),
        message: fortuneMessages.health[random(0, fortuneMessages.health.length - 1)]
      },
      luckyNumbers: Array.from({length: 3}, () => random(1, 99)),
      luckyColors: getLuckyColors(selectedZodiac.element, Math.floor(random(0, 2))),
      advice: advice[random(0, advice.length - 1)]
    };

    setFortune(newFortune);
    setIsLoading(false);
  };

  const getScoreStars = (score: number) => {
    const stars = Math.floor(score / 20);
    return Array.from({length: 5}, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <CardTitle className="flex items-center gap-2 font-kanit text-xl">
          <Sparkles className="w-6 h-6" />
          ดูดวงฟรี ประจำวัน
        </CardTitle>
        <p className="font-sarabun text-orange-100">{todayDate}</p>
      </CardHeader>
      
      <CardContent className="p-6">
        {!selectedZodiac ? (
          <div>
            <h3 className="text-lg font-bold font-kanit mb-4 text-center">เลือกราศีของคุณ</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {zodiacSigns.map((zodiac, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => setSelectedZodiac(zodiac)}
                >
                  <span className="font-kanit font-bold">{zodiac.thai}</span>
                  <span className="text-xs font-sarabun text-gray-600">{zodiac.dates}</span>
                  <Badge variant="secondary" className="text-xs">{zodiac.element}</Badge>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold font-kanit text-orange-800">
                ดวงประจำวันราศี{selectedZodiac.thai}
              </h3>
              <p className="text-sm font-sarabun text-gray-600 mt-1">
                {selectedZodiac.english} • ธาตุ{selectedZodiac.element}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedZodiac(null);
                  setFortune(null);
                }}
                className="mt-2 text-orange-600 hover:text-orange-700"
              >
                เปลี่ยนราศี
              </Button>
            </div>

            {!fortune ? (
              <div className="text-center">
                <Button
                  onClick={() => generateFortune(selectedZodiac)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      กำลังดูดวง...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      ดูดวงวันนี้
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                  <h4 className="font-kanit font-bold text-lg mb-2">ดวงโดยรวม</h4>
                  <div className={`text-3xl font-bold ${fortune.overall.color} mb-2`}>
                    {fortune.overall.score}/100
                  </div>
                  <div className="flex justify-center gap-1 mb-2">
                    {getScoreStars(fortune.overall.score)}
                  </div>
                  <p className="font-sarabun text-gray-700">{fortune.overall.message}</p>
                </div>

                {/* Detailed Fortune */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                    <Heart className="w-8 h-8 text-pink-500" />
                    <div>
                      <h5 className="font-kanit font-bold text-pink-700">ความรัก</h5>
                      <div className="flex gap-1 my-1">
                        {getScoreStars(fortune.love.score)}
                      </div>
                      <p className="text-sm font-sarabun text-gray-700">{fortune.love.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Briefcase className="w-8 h-8 text-blue-500" />
                    <div>
                      <h5 className="font-kanit font-bold text-blue-700">การงาน</h5>
                      <div className="flex gap-1 my-1">
                        {getScoreStars(fortune.career.score)}
                      </div>
                      <p className="text-sm font-sarabun text-gray-700">{fortune.career.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Coins className="w-8 h-8 text-green-500" />
                    <div>
                      <h5 className="font-kanit font-bold text-green-700">การเงิน</h5>
                      <div className="flex gap-1 my-1">
                        {getScoreStars(fortune.money.score)}
                      </div>
                      <p className="text-sm font-sarabun text-gray-700">{fortune.money.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Shield className="w-8 h-8 text-purple-500" />
                    <div>
                      <h5 className="font-kanit font-bold text-purple-700">สุขภาพ</h5>
                      <div className="flex gap-1 my-1">
                        {getScoreStars(fortune.health.score)}
                      </div>
                      <p className="text-sm font-sarabun text-gray-700">{fortune.health.message}</p>
                    </div>
                  </div>
                </div>

                {/* Lucky Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h5 className="font-kanit font-bold text-yellow-700 mb-2">เลขนำโชค</h5>
                    <div className="flex gap-2">
                      {fortune.luckyNumbers.map((num, index) => (
                        <Badge key={index} className="bg-yellow-500 text-white px-3 py-1">
                          {num}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h5 className="font-kanit font-bold text-indigo-700 mb-2">สีนำโชค</h5>
                    <p className="font-sarabun text-indigo-600">{fortune.luckyColors}</p>
                  </div>
                </div>

                {/* Advice */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                  <h5 className="font-kanit font-bold text-gray-700 mb-2">คำแนะนำประจำวัน</h5>
                  <p className="font-sarabun text-gray-700">{fortune.advice}</p>
                </div>

                {/* Refresh Button */}
                <div className="text-center">
                  <Button
                    onClick={() => generateFortune(selectedZodiac)}
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    ดูดวงใหม่
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FortuneWidget;
