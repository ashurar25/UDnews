import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThaiSpecialDayBanner } from "@/components/ThaiSpecialDayBanner";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Calendar } from "lucide-react";
import heroImage from "@/assets/news-hero.jpg";
import localImage from "@/assets/news-local.jpg";
import politicsImage from "@/assets/news-politics.jpg";
import sportsImage from "@/assets/news-sports.jpg";

const Index = () => {
  const breakingNews = [
    "นายกเทศมนตรีอุดรธานีเปิดโครงการพัฒนาเมือง",
    "การประชุมสภาเทศบาลครั้งสำคัญวันนี้",
    "เทศกาลดอกบัวแดงอุดรธานีปีนี้คึกคัก"
  ];

  const featuredNews = [
    {
      title: "อุดรธานีเตรียมจัดเทศกาลประจำปี 2024 คาดมีนักท่องเที่ยวแห่เที่ยวชม",
      summary: "เทศบาลเมืองอุดรธานีเตรียมจัดงานเทศกาลประจำปีครั้งใหญ่ คาดว่าจะมีนักท่องเที่ยวทั้งในและต่างประเทศมาร่วมงาน พร้อมกิจกรรมหลากหลายตลอด 7 วัน",
      category: "ข่าวท้องถิ่น",
      time: "2 ชั่วโมงที่แล้ว",
      views: "2.5K",
      image: localImage,
      size: "large" as const
    }
  ];

  const latestNews = [
    {
      title: "รัฐบาลประกาศมาตรการช่วยเหลือเกษตรกรภาคอีสาน",
      summary: "การประกาศมาตรการใหม่เพื่อช่วยเหลือเกษตรกรในภาคอีสาน โดยเฉพาะในจังหวัดอุดรธานี",
      category: "การเมือง",
      time: "4 ชั่วโมงที่แล้ว",
      views: "1.8K",
      image: politicsImage,
      isBreaking: true
    },
    {
      title: "ทีมฟุตบอลอุดรธานีเฮ! คว้าชัยชนะนัดสำคัญ",
      summary: "ความสำเร็จของทีมฟุตบอลท้องถิ่นในการแข่งขันลีกระดับภูมิภาค",
      category: "กีฬา",
      time: "6 ชั่วโมงที่แล้ว",
      views: "3.2K",
      image: sportsImage
    },
    {
      title: "ราคาข้าวในตลาดสดอุดรธานีปรับตัวลง",
      summary: "สถานการณ์ราคาสินค้าอุปโภคบริโภคในตลาดท้องถิ่นสัปดาห์นี้",
      category: "เศรษฐกิจ",
      time: "8 ชั่วโมงที่แล้ว",
      views: "1.2K"
    },
    {
      title: "งานแสดงดนตรีท้องถิ่นที่ศูนย์วัฒนธรรม",
      summary: "การจัดงานแสดงดนตรีพื้นบ้านอีสานในสุดสัปดาห์นี้",
      category: "บันเทิง",
      time: "10 ชั่วโมงที่แล้ว",
      views: "950"
    },
    {
      title: "โครงการปรับปรุงถนนสายหลักเริ่มแล้ว",
      summary: "การดำเนินโครงการปรับปรุงโครงสร้างพื้นฐานของเมือง",
      category: "ข่าวท้องถิ่น",
      time: "12 ชั่วโมงที่แล้ว",
      views: "1.5K"
    },
    {
      title: "มหาวิทยาลัยอุดรธานีเปิดรับสมัครนักศึกษาใหม่",
      summary: "ข้อมูลการรับสมัครและทุนการศึกษาสำหรับปีการศึกษาใหม่",
      category: "การศึกษา",
      time: "1 วันที่แล้ว",
      views: "2.1K"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ThaiSpecialDayBanner />
      
      {/* Breaking News Ticker */}
      <div className="bg-news-urgent text-white py-2 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Badge className="bg-white text-news-urgent whitespace-nowrap font-kanit">
              ข่าวด่วน
            </Badge>
            <div className="flex animate-slide-up">
              {breakingNews.map((news, index) => (
                <span key={index} className="font-sarabun mr-8 whitespace-nowrap">
                  {news}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <img 
          src={heroImage} 
          alt="UD News Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent">
          <div className="container mx-auto px-4 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold font-kanit mb-4 animate-fade-in">
                ข่าวสารอุดรธานี
              </h1>
              <p className="text-lg md:text-xl font-sarabun mb-6 animate-fade-in">
                อัพเดทข่าวสารตลอด 24 ชั่วโมง ถูกต้อง รวดเร็ว น่าเชื่อถือ
              </p>
              <Button className="bg-gradient-primary hover:bg-primary-dark animate-bounce-in">
                <span className="font-sarabun">อ่านข่าวล่าสุด</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        
        {/* Featured News Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold font-kanit">ข่าวเด่นวันนี้</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredNews.map((news, index) => (
              <NewsCard key={index} {...news} />
            ))}
          </div>
        </section>

        {/* Latest News Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main News Feed */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold font-kanit">ข่าวล่าสุด</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestNews.map((news, index) => (
                <NewsCard key={index} {...news} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Popular Today */}
            <div className="bg-card rounded-lg p-6 shadow-news">
              <h3 className="text-xl font-bold font-kanit mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                ยอดนิยมวันนี้
              </h3>
              <div className="space-y-4">
                {latestNews.slice(0, 5).map((news, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded hover:bg-accent transition-colors cursor-pointer">
                    <span className="text-primary font-bold font-kanit text-lg">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold font-kanit text-sm leading-tight mb-1">
                        {news.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="font-sarabun">{news.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather Widget */}
            <div className="relative rounded-lg p-6 shadow-news overflow-hidden bg-gradient-to-br from-orange-200/40 via-yellow-100/30 to-blue-200/40 backdrop-blur-sm border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-300/20 via-transparent to-blue-300/20"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold font-kanit mb-4 text-foreground">
                  สภาพอากาศอุดรธานี
                </h3>
                <div className="text-center">
                  <div className="text-5xl mb-3 drop-shadow-lg">☀️</div>
                  <div className="text-3xl font-bold font-kanit text-orange-600 mb-1">32°C</div>
                  <p className="text-muted-foreground font-sarabun mb-4">แจ่มใส</p>
                  <div className="flex justify-between mt-4 text-sm font-sarabun bg-white/30 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-center">
                      <span className="text-red-500 font-bold">35°C</span>
                      <p className="text-xs text-muted-foreground">สูงสุด</p>
                    </div>
                    <div className="text-center">
                      <span className="text-blue-500 font-bold">26°C</span>
                      <p className="text-xs text-muted-foreground">ต่ำสุด</p>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground font-sarabun bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    อัพเดทล่าสุด: {new Date().toLocaleTimeString('th-TH')}
                  </div>
                </div>
              </div>
            </div>

            {/* RSS Feed */}
            <div className="bg-card rounded-lg p-6 shadow-news">
              <h3 className="text-xl font-bold font-kanit mb-4">
                RSS Feed
              </h3>
              <p className="text-sm text-muted-foreground font-sarabun mb-4">
                ติดตามข่าวสารผ่าน RSS Feed
              </p>
              <Button variant="outline" className="w-full">
                <span className="font-sarabun">สมัครรับข่าว RSS</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;