
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

type SimpleNews = {
  title: string;
  summary: string;
  category: string;
  time: string;
  views: string;
  isBreaking?: boolean;
};

const Sports = () => {
  const [news, setNews] = useState<SimpleNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNews([
        {
          title: "ทีมฟุตบอลอุดรธานีเฮ! คว้าชัยชนะนัดสำคัญ",
          summary: "ความสำเร็จของทีมฟุตบอลท้องถิ่นในการแข่งขันลีกระดับภูมิภาค",
          category: "กีฬา",
          time: "2 ชั่วโมงที่แล้ว",
          views: "4.1K"
        },
        {
          title: "การแข่งขันวิ่งมาราธอนอุดรธานีครั้งที่ 15",
          summary: "งานวิ่งมาราธอนประจำปีที่จัดขึ้นในเดือนหน้า",
          category: "กีฬา",
          time: "5 ชั่วโมงที่แล้ว",
          views: "2.3K"
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
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold font-kanit">ข่าวกีฬา</h1>
          <Badge className="bg-green-600 text-white font-sarabun">
            กีฬา
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

export default Sports;
