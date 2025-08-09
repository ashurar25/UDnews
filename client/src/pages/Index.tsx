import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThaiSpecialDayBanner } from "@/components/ThaiSpecialDayBanner";
import NewsCard from "@/components/NewsCard";
import SponsorBanner from "@/components/SponsorBanner";
import SponsorBannerBar from "@/components/SponsorBannerBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWeatherForecast } from "@/lib/weather-api";
import heroImage from "@/assets/news-hero.jpg";
import localImage from "@/assets/news-local.jpg";
import politicsImage from "@/assets/news-politics.jpg";
import sportsImage from "@/assets/news-sports.jpg";

interface WeatherData {
  temp: number;
  high: number;
  low: number;
  condition: string;
  conditionThai: string;
  icon: string;
  humidity: number;
  wind: number;
  city: string;
}

interface ForecastData {
  yesterday: WeatherData;
  today: WeatherData;
  tomorrow: WeatherData;
}

const Index = () => {
  const [selectedDay, setSelectedDay] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [weatherData, setWeatherData] = useState<ForecastData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  // Load weather data when component mounts
  useEffect(() => {
    const loadWeather = async () => {
      try {
        setIsLoadingWeather(true);
        const forecast = await getWeatherForecast();
        setWeatherData(forecast);
      } catch (error) {
        console.error('Failed to load weather data:', error);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    loadWeather();
    
    // Refresh weather data every 30 minutes
    const interval = setInterval(loadWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentWeather = weatherData?.[selectedDay] || {
    temp: 0,
    high: 0,
    low: 0,
    condition: '',
    conditionThai: 'กำลังโหลด...',
    icon: '🌡️',
    humidity: 0,
    wind: 0,
    city: 'อุดรธานี'
  };

  // Fetch real news data from API
  const { data: newsData, isLoading: isLoadingNews } = useQuery({
    queryKey: ['/api/news'],
    queryFn: async () => {
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    }
  });

  // Helper function to calculate time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'เมื่อสักครู่';
    if (diffInHours === 1) return '1 ชั่วโมงที่แล้ว';
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 วันที่แล้ว';
    return `${diffInDays} วันที่แล้ว`;
  };

  // Process news data
  const allNews = newsData || [];
  const breakingNews = allNews.filter((news: any) => news.isBreaking).map((news: any) => news.title);
  const featuredNews = allNews.slice(0, 1).map((news: any) => ({
    id: news.id,
    title: news.title,
    summary: news.summary,
    category: news.category,
    time: getTimeAgo(news.createdAt),
    views: `${Math.floor(Math.random() * 5000 + 1000)}`, // Random views for demo
    image: news.imageUrl || localImage,
    isBreaking: news.isBreaking,
    size: "large" as const
  }));
  
  const latestNews = allNews.slice(1, 9).map((news: any, index: number) => ({
    id: news.id,
    title: news.title,
    summary: news.summary,
    category: news.category,
    time: getTimeAgo(news.createdAt),
    views: `${Math.floor(Math.random() * 3000 + 500)}`, // Random views for demo
    image: news.imageUrl || (index % 4 === 0 ? politicsImage : index % 4 === 1 ? sportsImage : index % 4 === 2 ? localImage : undefined),
    isBreaking: news.isBreaking
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header Sponsor Banner Bar */}
      <div className="bg-muted/30 py-3">
        <div className="container mx-auto px-4">
          <SponsorBannerBar position="header" className="justify-center" autoPlay={true} showNavigation={true} bannerCount={5} />
        </div>
      </div>
      
      <ThaiSpecialDayBanner />
      
      {/* Breaking News Ticker */}
      <div className="bg-red-600 text-white py-2 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Badge className="bg-white text-red-600 whitespace-nowrap font-kanit">
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
          className="w-full h-full object-cover object-center"
          style={{ objectPosition: 'center 75%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent">
          <div className="container mx-auto px-4 h-full flex items-start pt-16">
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
          
          {/* Between News Sponsor Banner Bar */}
          <div className="mt-8 mb-4">
            <SponsorBannerBar position="between_news" autoPlay={true} showNavigation={false} bannerCount={3} />
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
            
            {/* Sidebar Sponsor Banner Bar */}
            <SponsorBannerBar position="sidebar" autoPlay={true} showNavigation={false} bannerCount={3} />
            
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
                
                {/* Weather Navigation */}
                <div className="flex justify-center mb-4">
                  <div className="flex bg-white/20 backdrop-blur-sm rounded-full p-1">
                    <button 
                      onClick={() => setSelectedDay('yesterday')}
                      className={`px-3 py-1 text-xs font-sarabun rounded-full transition-colors ${
                        selectedDay === 'yesterday' 
                          ? 'bg-white/50 text-foreground' 
                          : 'text-muted-foreground hover:bg-white/30'
                      }`}
                    >
                      เมื่อวาน
                    </button>
                    <button 
                      onClick={() => setSelectedDay('today')}
                      className={`px-3 py-1 text-xs font-sarabun rounded-full transition-colors ${
                        selectedDay === 'today' 
                          ? 'bg-white/50 text-foreground' 
                          : 'text-muted-foreground hover:bg-white/30'
                      }`}
                    >
                      วันนี้
                    </button>
                    <button 
                      onClick={() => setSelectedDay('tomorrow')}
                      className={`px-3 py-1 text-xs font-sarabun rounded-full transition-colors ${
                        selectedDay === 'tomorrow' 
                          ? 'bg-white/50 text-foreground' 
                          : 'text-muted-foreground hover:bg-white/30'
                      }`}
                    >
                      พรุ่งนี้
                    </button>
                  </div>
                </div>

                {/* Current Weather Display */}
                <div className="text-center mb-4">
                  {isLoadingWeather ? (
                    <div className="animate-pulse">
                      <div className="text-5xl mb-3">🌡️</div>
                      <div className="text-3xl font-bold font-kanit text-orange-600 mb-1">--°C</div>
                      <p className="text-muted-foreground font-sarabun mb-2">กำลังโหลด...</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-5xl mb-3 drop-shadow-lg">{currentWeather.icon}</div>
                      <div className="text-3xl font-bold font-kanit text-orange-600 mb-1">{currentWeather.temp}°C</div>
                      <p className="text-muted-foreground font-sarabun mb-2">{currentWeather.conditionThai}</p>
                    </>
                  )}
                  
                  {/* High/Low Temps */}
                  <div className="flex justify-between mt-2 text-sm font-sarabun bg-white/30 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-center">
                      <span className="text-red-500 font-bold">{currentWeather.high}°C</span>
                      <p className="text-xs text-muted-foreground">สูงสุด</p>
                    </div>
                    <div className="text-center">
                      <span className="text-blue-500 font-bold">{currentWeather.low}°C</span>
                      <p className="text-xs text-muted-foreground">ต่ำสุด</p>
                    </div>
                  </div>
                </div>

                {/* 3-Day Weather Summary */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {weatherData ? (
                    <>
                      {/* Yesterday */}
                      <div 
                        className={`text-center backdrop-blur-sm rounded-lg p-2 cursor-pointer transition-all ${
                          selectedDay === 'yesterday' 
                            ? 'bg-white/40 border-2 border-orange-300/50' 
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                        onClick={() => setSelectedDay('yesterday')}
                      >
                        <p className="text-xs font-sarabun text-muted-foreground mb-1">เมื่อวาน</p>
                        <div className="text-lg mb-1">{weatherData.yesterday.icon}</div>
                        <div className="text-sm font-bold font-kanit text-orange-500">{weatherData.yesterday.temp}°C</div>
                        <p className="text-xs font-sarabun text-muted-foreground">{weatherData.yesterday.conditionThai}</p>
                      </div>
                      
                      {/* Today */}
                      <div 
                        className={`text-center backdrop-blur-sm rounded-lg p-2 cursor-pointer transition-all ${
                          selectedDay === 'today' 
                            ? 'bg-white/40 border-2 border-orange-300/50' 
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                        onClick={() => setSelectedDay('today')}
                      >
                        <p className={`text-xs font-sarabun mb-1 ${selectedDay === 'today' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>วันนี้</p>
                        <div className="text-lg mb-1">{weatherData.today.icon}</div>
                        <div className="text-sm font-bold font-kanit text-orange-600">{weatherData.today.temp}°C</div>
                        <p className="text-xs font-sarabun text-muted-foreground">{weatherData.today.conditionThai}</p>
                      </div>
                      
                      {/* Tomorrow */}
                      <div 
                        className={`text-center backdrop-blur-sm rounded-lg p-2 cursor-pointer transition-all ${
                          selectedDay === 'tomorrow' 
                            ? 'bg-white/40 border-2 border-orange-300/50' 
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                        onClick={() => setSelectedDay('tomorrow')}
                      >
                        <p className="text-xs font-sarabun text-muted-foreground mb-1">พรุ่งนี้</p>
                        <div className="text-lg mb-1">{weatherData.tomorrow.icon}</div>
                        <div className="text-sm font-bold font-kanit text-orange-500">{weatherData.tomorrow.temp}°C</div>
                        <p className="text-xs font-sarabun text-muted-foreground">{weatherData.tomorrow.conditionThai}</p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-3 text-center text-muted-foreground font-sarabun">
                      กำลังโหลดข้อมูลพยากรณ์อากาศ...
                    </div>
                  )}
                </div>

                {/* Additional Weather Info */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-xs font-sarabun text-muted-foreground">ความชื้น</p>
                    <p className="text-sm font-bold font-kanit text-blue-600">{currentWeather.humidity}%</p>
                  </div>
                  <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-xs font-sarabun text-muted-foreground">ลม</p>
                    <p className="text-sm font-bold font-kanit text-green-600">{currentWeather.wind} km/h</p>
                  </div>
                </div>

                {/* Update Time */}
                <div className="text-center">
                  <div className="text-xs text-muted-foreground font-sarabun bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
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