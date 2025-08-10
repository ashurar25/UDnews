import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain } from "lucide-react";

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple weather widget for Udon Thani
    // For now, using mock data since we don't have WEATHER_API_KEY
    const mockWeather: WeatherData = {
      temp: 32,
      description: "แจ่มใส",
      humidity: 65
    };
    
    setTimeout(() => {
      setWeather(mockWeather);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center text-sm text-white/80">
        <div className="animate-spin mr-2">☀️</div>
        <span>กำลังโหลด...</span>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const getWeatherIcon = () => {
    if (weather.description.includes('ฝน')) return <CloudRain className="h-4 w-4" />;
    if (weather.description.includes('เมฆ')) return <Cloud className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />;
  };

  return (
    <div className="flex items-center text-sm text-white/90 bg-white/10 rounded-lg px-3 py-1">
      {getWeatherIcon()}
      <span className="ml-2">
        อุดรธานี {weather.temp}°C | {weather.description}
      </span>
    </div>
  );
};

export default WeatherWidget;