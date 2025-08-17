import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentWeather, getDailyForecast } from "@/lib/weather-api";
import { FiDroplet, FiWind, FiSun, FiCloudRain, FiMapPin, FiClock, FiCalendar, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { WiDaySunny, WiRain, WiCloudy, WiDayCloudy, WiThunderstorm, WiFog } from "react-icons/wi";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";

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
  lastUpdated: string;
}

interface ForecastDay {
  date: string;
  day: string;
  icon: string;
  high: number;
  low: number;
  rainChance: number;
}

const getWeatherGradient = (condition: string) => {
  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 18;
  
  if (condition.includes('ฝน') || condition.includes('พายุ')) {
    return 'from-blue-400/80 to-blue-200/90';
  } else if (condition.includes('เมฆ')) {
    return isDaytime 
      ? 'from-blue-200/90 to-blue-300/90' 
      : 'from-blue-100/90 to-blue-200/90';
  } else if (condition.includes('แดด') || condition.includes('แจ่มใส')) {
    return isDaytime 
      ? 'from-yellow-200/90 to-orange-300/90' 
      : 'from-blue-100/90 to-blue-200/90';
  } else {
    return isDaytime 
      ? 'from-blue-200/90 to-cyan-200/90' 
      : 'from-blue-100/90 to-blue-200/90';
  }
};

const getWeatherIcon = (icon: string, size = 'text-4xl') => {
  switch(icon) {
    case '☀️':
      return <WiDaySunny className={`${size} text-amber-400`} />;
    case '🌧️':
      return <WiRain className={`${size} text-blue-400`} />;
    case '⛈️':
      return <WiThunderstorm className={`${size} text-indigo-600`} />;
    case '☁️':
      return <WiCloudy className={`${size} text-slate-400`} />;
    case '🌫️':
      return <WiFog className={`${size} text-slate-300`} />;
    case '🌤️':
    case '⛅':
      return <WiDayCloudy className={`${size} text-amber-300`} />;
    default:
      return <WiDaySunny className={`${size} text-amber-400`} />;
  }
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [weatherData, daily] = await Promise.all([
          getCurrentWeather(),
          getDailyForecast(5),
        ]);
        
        if (mounted) {
          setWeather(weatherData as WeatherData);
          // Map real daily forecast
          const mapped = daily.map(d => ({
            date: d.date,
            day: d.day,
            icon: d.icon,
            high: Math.round(d.high),
            low: Math.round(d.low),
            rainChance: Math.round(d.rainChance),
          }));
          setForecast(mapped);
          setLastUpdated(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (e) {
        console.error('Error loading weather data:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    load();

    // Refresh every 30 minutes
    const id = setInterval(load, 30 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center text-xs md:text-sm text-white/90 bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-emerald-500/20 rounded-2xl px-4 py-2 backdrop-blur-sm border border-white/20 shadow-lg"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-t-transparent border-r-white border-b-white border-l-white rounded-full mr-2"
        />
        <span className="font-sarabun">กำลังโหลดสภาพอากาศ...</span>
      </motion.div>
    );
  }

  if (!weather) return null;

  const weatherGradient = getWeatherGradient(weather.conditionThai);
  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 18;
  const textColor = isDaytime ? 'text-gray-800' : 'text-white';
  const bgOpacity = isDaytime ? 'bg-white/90' : 'bg-gray-900/90';
  const borderColor = isDaytime ? 'border-gray-200' : 'border-gray-700';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <div 
        className={`relative flex items-center text-sm md:text-base ${textColor} rounded-2xl px-4 py-2 backdrop-blur-md border ${borderColor} shadow-news hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white/10 dark:bg-white/5`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 rounded-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center">
        <motion.div 
          className="relative"
          animate={{ 
            y: [0, -3, 0],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        >
          {getWeatherIcon(weather.icon, 'text-3xl')}
          <motion.div 
            className="absolute -inset-1 bg-white/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1.2 }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
          />
        </motion.div>
        <div className="flex items-center gap-2 ml-3">
          <div className="flex items-center">
            <FiMapPin className="w-3.5 h-3.5 mr-1.5 text-current opacity-90" />
            <span className="font-kanit font-bold drop-shadow-sm">{weather.city}</span>
          </div>
          <span className="font-kanit font-extrabold text-xl bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent drop-shadow-sm">{Math.round(weather.temp)}°</span>
          <span className="hidden md:inline-block w-px h-5 bg-current/30 mx-1"></span>
          <span className="hidden md:inline font-sarabun text-sm opacity-90">{weather.conditionThai}</span>
          <motion.span 
            className="ml-1"
            animate={{ y: showDetails ? 2 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {showDetails ? (
              <FiChevronUp className="w-4 h-4 opacity-70" />
            ) : (
              <FiChevronDown className="w-4 h-4 opacity-70" />
            )}
          </motion.span>
        </div>
        </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div 
            className="absolute left-0 top-full mt-2 w-full sm:w-[420px] z-50 origin-top"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.2 } }}
            transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.5 }}
          >
            <div className={`relative rounded-2xl ${bgOpacity} text-foreground shadow-2xl ring-1 ring-white/10 p-5 backdrop-blur-lg border ${borderColor}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none"></div>
              <div className="relative z-10">
              {/* Current Weather Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="relative"
                    animate={{ 
                      y: [0, -3, 0],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  >
                    {getWeatherIcon(weather.icon, 'text-5xl')}
                    <motion.div 
                      className="absolute -inset-1 bg-white/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1.2 }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        repeatType: "reverse" 
                      }}
                    />
                  </motion.div>
                  <div>
                    <div className="font-kanit font-bold text-xl">{weather.city}</div>
                    <div className="text-sm font-sarabun text-muted-foreground">{weather.conditionThai}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-kanit font-bold text-4xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    {Math.round(weather.temp)}°
                  </div>
                  <div className="text-xs font-sarabun text-muted-foreground flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    อัปเดตเมื่อ {lastUpdated}
                  </div>
                </div>
              </div>
              
              {/* Current Conditions Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <motion.div 
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30 shadow-sm hover:shadow transition-all"
                >
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-sarabun text-muted-foreground mb-1">สูงสุด</div>
                    <div className="font-kanit text-lg font-bold text-amber-600 dark:text-amber-400">{Math.round(weather.high)}°</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30 shadow-sm hover:shadow transition-all"
                >
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-sarabun text-muted-foreground mb-1">ต่ำสุด</div>
                    <div className="font-kanit text-lg font-bold text-blue-600 dark:text-blue-400">{Math.round(weather.low)}°</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/30 dark:to-sky-800/30 rounded-xl p-3 border border-sky-100 dark:border-sky-800/30 shadow-sm hover:shadow transition-all"
                >
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-sarabun text-muted-foreground mb-1">ความชื้น</div>
                    <div className="font-kanit text-lg font-bold text-sky-600 dark:text-sky-400">{weather.humidity}%</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30 shadow-sm hover:shadow transition-all"
                >
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-sarabun text-muted-foreground mb-1">ลม</div>
                    <div className="font-kanit text-lg font-bold text-emerald-600 dark:text-emerald-400">{weather.wind} กม./ชม.</div>
                  </div>
                </motion.div>
              </div>
              
              {/* 5-Day Forecast */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 text-sm font-kanit font-medium text-muted-foreground">
                  <FiCalendar className="w-4 h-4" />
                  พยากรณ์ 5 วัน
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {forecast.map((day, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center p-2 rounded-lg bg-white/60 dark:bg-gray-800/50 border border-white/30 dark:border-gray-700/50 hover:bg-white/70 transition-colors"
                    >
                      <div className="text-xs font-sarabun text-muted-foreground">
                        {index === 0 ? 'วันนี้' : day.day}
                      </div>
                      <div className="my-1">
                        {getWeatherIcon(day.icon, 'text-2xl')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-kanit font-bold text-sm text-amber-600 dark:text-amber-400">{day.high}°</span>
                        <span className="text-xs text-muted-foreground">/</span>
                        <span className="font-kanit text-xs text-blue-600 dark:text-blue-400">{day.low}°</span>
                      </div>
                      {day.rainChance > 20 && (
                        <div className="mt-0.5 flex items-center text-[10px] text-sky-600 dark:text-sky-400">
                          <FiDroplet className="w-2.5 h-2.5 mr-0.5" />
                          {Math.round(day.rainChance)}%
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Rain Status */}
              {weather.rainStatus && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/30 rounded-lg text-center"
                >
                  <div className="text-sm font-sarabun text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
                    <FiCloudRain className="w-4 h-4 flex-shrink-0" />
                    <span>{weather.rainStatus}</span>
                  </div>
                </motion.div>
              )}
              
              {/* Last Updated */}
              <div className="mt-3 text-right">
                <p className="text-xs text-muted-foreground font-sarabun">
                  อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;