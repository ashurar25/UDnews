import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentWeather } from "@/lib/weather-api";
import { FiDroplet, FiWind, FiSun, FiCloudRain, FiMapPin } from "react-icons/fi";

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
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center text-xs md:text-sm text-white/90 bg-gradient-to-r from-orange-500/20 via-yellow-400/20 to-blue-500/20 rounded-2xl px-4 py-2 backdrop-blur-sm border border-white/20 shadow-md"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-t-transparent border-r-orange-400 border-b-orange-400 border-l-orange-400 rounded-full mr-2"
        />
        <span className="font-sarabun">กำลังโหลดสภาพอากาศ...</span>
      </motion.div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <div className="flex items-center text-sm md:text-base text-white/95 bg-gradient-to-br from-orange-500/60 via-yellow-400/50 to-blue-500/60 rounded-2xl px-4 py-2 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
        <div className="relative">
          <span className="text-2xl leading-none drop-shadow">{weather.icon}</span>
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
        </div>
        <div className="flex items-center gap-2 ml-2">
          <div className="flex items-center">
            <FiMapPin className="w-3.5 h-3.5 mr-1 text-white/90" />
            <span className="font-kanit font-semibold drop-shadow">{weather.city}</span>
          </div>
          <span className="font-kanit text-amber-100 drop-shadow text-lg">{weather.temp}°C</span>
          <span className="hidden md:inline-block w-px h-4 bg-white/40 mx-1"></span>
          <span className="hidden md:inline font-sarabun text-white/90 text-sm">{weather.conditionThai}</span>
        </div>

      <AnimatePresence>
        <motion.div 
          className="absolute left-0 top-full mt-2 w-max min-w-[280px] z-50 origin-top"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="rounded-2xl bg-gradient-to-br from-white/95 to-gray-50/95 text-foreground shadow-2xl ring-1 ring-white/30 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="text-4xl">{weather.icon}</span>
                  <motion.div 
                    className="absolute -inset-1 bg-white/30 rounded-full blur opacity-0 group-hover:opacity-100"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1.2 }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatType: "reverse" 
                    }}
                  />
                </div>
                <div>
                  <div className="font-kanit font-semibold text-lg">{weather.city}</div>
                  <div className="text-xs font-sarabun text-muted-foreground">{weather.conditionThai}</div>
                </div>
              </div>
              <div className="text-3xl font-kanit font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                {weather.temp}°
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <motion.div 
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-100 shadow-sm hover:shadow transition-all"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiSun className="w-4 h-4 text-amber-500" />
                  <div className="text-xs font-sarabun text-muted-foreground">สูงสุด</div>
                </div>
                <div className="font-kanit text-base font-semibold text-orange-600 text-center">{weather.high}°</div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-100 shadow-sm hover:shadow transition-all"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiDroplet className="w-4 h-4 text-blue-500" />
                  <div className="text-xs font-sarabun text-muted-foreground">ต่ำสุด</div>
                </div>
                <div className="font-kanit text-base font-semibold text-blue-600 text-center">{weather.low}°</div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-3 border border-sky-100 shadow-sm hover:shadow transition-all"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiCloudRain className="w-4 h-4 text-sky-500" />
                  <div className="text-xs font-sarabun text-muted-foreground">โอกาสฝน</div>
                </div>
                <div className="font-kanit text-base font-semibold text-sky-600 text-center">{weather.rainChance}%</div>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 border border-emerald-100 shadow-sm hover:shadow transition-all"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiDroplet className="w-4 h-4 text-emerald-500" />
                  <div className="text-xs font-sarabun text-muted-foreground">ความชื้น</div>
                </div>
                <div className="font-kanit text-base font-semibold text-emerald-600 text-center">{weather.humidity}%</div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl p-3 border border-lime-100 shadow-sm hover:shadow transition-all"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiWind className="w-4 h-4 text-lime-500" />
                  <div className="text-xs font-sarabun text-muted-foreground">ความเร็วลม</div>
                </div>
                <div className="font-kanit text-base font-semibold text-lime-700 text-center">{weather.wind} km/h</div>
              </motion.div>
            </div>
            
            {weather.rainStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg text-center"
              >
                <div className="text-xs font-sarabun text-blue-700">{weather.rainStatus}</div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;