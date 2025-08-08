
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";

const Local = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fast loading - in real app, fetch from API
    const timer = setTimeout(() => {
      setNews([
        {
          title: "อุดรธานีเตรียมจัดเทศกาลประจำปี 2024",
          summary: "เทศบาลเมืองอุดรธานีเตรียมจัดงานเทศกาลประจำปีครั้งใหญ่",
          category: "ข่าวท้องถิ่น",
          time: "1 ชั่วโมงที่แล้ว",
          views: "2.1K"
        },
        {
          title: "โครงการปรับปรุงถนนสายหลักเริ่มแล้ว",
          summary: "การดำเนินโครงการปรับปรุงโครงสร้างพื้นฐานของเมือง",
          category: "ข่าวท้องถิ่น", 
          time: "3 ชั่วโมงที่แล้ว",
          views: "1.8K"
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
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold font-kanit">ข่าวท้องถิ่น</h1>
          <Badge className="bg-primary text-primary-foreground font-sarabun">
            อุดรธานี
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

export default Local;
