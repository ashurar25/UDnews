
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Music, Clock } from "lucide-react";

const Entertainment = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNews([
        {
          title: "งานแสดงดนตรีท้องถิ่นที่ศูนย์วัฒนธรรม",
          summary: "การจัดงานแสดงดนตรีพื้นบ้านอีสานในสุดสัปดาห์นี้",
          category: "บันเทิง",
          time: "1 ชั่วโมงที่แล้ว",
          views: "1.5K"
        },
        {
          title: "ศิลปินท้องถิ่นได้รับรางวัลดนตรีพื้นบ้าน",
          summary: "การมอบรางวัลเพลงพื้นบ้านอีสานยอดเยี่ยม",
          category: "บันเทิง",
          time: "4 ชั่วโมงที่แล้ว",
          views: "1.2K"
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
          <Music className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold font-kanit">ข่าวบันเทิง</h1>
          <Badge className="bg-purple-600 text-white font-sarabun">
            บันเทิง
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

export default Entertainment;
