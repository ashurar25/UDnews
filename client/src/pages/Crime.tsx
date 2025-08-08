
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock } from "lucide-react";

const Crime = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNews([
        {
          title: "ตำรวจอุดรธานีจับกุมผู้ต้องสงสัยคดีโจรกรรม",
          summary: "การจับกุมผู้ต้องสงสัยในคดีโจรกรรมรถจักรยานยนต์หลายคัน",
          category: "อาชญากรรม",
          time: "1 ชั่วโมงที่แล้ว",
          views: "1.8K"
        },
        {
          title: "เตือนภัยการฉ้อโกงออนไลน์เพิ่มขึ้น",
          summary: "ตำรวจเตือนประชาชนระวังการฉ้อโกงผ่านโซเชียลมีเดีย",
          category: "อาชญากรรม",
          time: "3 ชั่วโมงที่แล้ว",
          views: "2.1K"
        }
      ]);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold font-kanit">ข่าวอาชญากรรม</h1>
          <Badge className="bg-red-600 text-white font-sarabun">
            ความปลอดภัย
          </Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article, index) => (
              <NewsCard key={index} {...article} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Crime;
