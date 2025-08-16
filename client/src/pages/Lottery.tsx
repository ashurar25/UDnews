import React from 'react';
import ThaiLotteryChecker from '@/components/ThaiLotteryChecker';

export default function Lottery() {
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold font-kanit text-orange-800">ตรวจหวยรัฐบาลไทย</h1>
          <p className="text-gray-600 font-sarabun">เช็คผลสลากกินแบ่งรัฐบาลไทย งวดล่าสุดและตรวจเลขของคุณ</p>
        </div>
        <ThaiLotteryChecker />
      </div>
    </div>
  );
}
