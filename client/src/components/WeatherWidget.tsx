import { useState, useEffect } from "react";
import { getCurrentWeather } from "@/lib/weather-api";

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
  rainChance: number;
  rainStatus: string;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getCurrentWeather();
        if (mounted) setWeather(data as WeatherData);
      } catch (e) {
        // swallow: getCurrentWeather already logs and returns fallback
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    // refresh every 30 minutes
    const id = setInterval(load, 30 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center text-xs md:text-sm text-white/90 bg-gradient-to-r from-orange-400/30 via-yellow-300/30 to-blue-400/30 rounded-full px-3 py-1 backdrop-blur-sm border border-white/20">
        <div className="animate-pulse mr-2">🌡️</div>
        <span className="font-sarabun">กำลังโหลดสภาพอากาศ...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="group relative flex items-center text-xs md:text-sm text-white/95 bg-gradient-to-r from-orange-500/50 via-yellow-400/40 to-blue-500/50 rounded-full px-3 py-1 backdrop-blur-sm border border-white/30 shadow-md hover:shadow-lg transition-all duration-300">
      <span className="mr-2 text-base leading-none drop-shadow">{weather.icon}</span>
      <div className="flex items-center gap-2">
        <span className="font-kanit font-semibold drop-shadow">{weather.city}</span>
        <span className="font-kanit text-orange-100/95 drop-shadow">{weather.temp}°C</span>
        <span className="hidden md:inline text-white/90">|</span>
        <span className="hidden md:inline font-sarabun text-white/90">{weather.conditionThai}</span>
      </div>

      {/* Hover card with details (pure CSS) */}
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute left-0 top-full mt-2 w-max min-w-[240px] z-50">
        <div className="rounded-xl bg-gradient-to-br from-white/95 to-gray-50/95 text-foreground shadow-xl ring-1 ring-white/30 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{weather.icon}</span>
              <div>
                <div className="font-kanit font-semibold">{weather.city}</div>
                <div className="text-xs font-sarabun text-muted-foreground">{weather.conditionThai}</div>
              </div>
            </div>
            <div className="text-2xl font-kanit text-orange-600">{weather.temp}°</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2 border border-orange-100 shadow-sm">
              <div className="text-[10px] font-sarabun text-muted-foreground">สูงสุด</div>
              <div className="font-kanit text-sm text-orange-600">{weather.high}°</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-100 shadow-sm">
              <div className="text-[10px] font-sarabun text-muted-foreground">ต่ำสุด</div>
              <div className="font-kanit text-sm text-blue-600">{weather.low}°</div>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg p-2 border border-sky-100 shadow-sm">
              <div className="text-[10px] font-sarabun text-muted-foreground">โอกาสฝน</div>
              <div className="font-kanit text-sm text-sky-600">{weather.rainChance}%</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-center">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-2 border border-emerald-100 shadow-sm">
              <div className="text-[10px] font-sarabun text-muted-foreground">ความชื้น</div>
              <div className="font-kanit text-sm text-emerald-600">{weather.humidity}%</div>
            </div>
            <div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-lg p-2 border border-lime-100 shadow-sm">
              <div className="text-[10px] font-sarabun text-muted-foreground">ลม</div>
              <div className="font-kanit text-sm text-lime-700">{weather.wind} km/h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;