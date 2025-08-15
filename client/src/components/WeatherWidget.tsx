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
      <div className="flex items-center text-sm text-white/80">
        <div className="animate-spin mr-2">🌡️</div>
        <span>กำลังโหลด...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="flex items-center text-sm text-white/90 bg-white/10 rounded-lg px-3 py-1">
      <span className="mr-2 text-base leading-none">{weather.icon}</span>
      <span className="ml-1">
        {weather.city} {weather.temp}°C | {weather.conditionThai}
      </span>
    </div>
  );
};

export default WeatherWidget;