import axios from 'axios';

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
  rainChance: number; // เปอร์เซ็นต์โอกาสฝน
  rainStatus: string; // สถานะฝน
}

// ---------- Daily forecast (real 5-day) from OpenWeather (3h steps grouped by day) ----------
export interface DailyForecastDay {
  date: string; // YYYY-MM-DD
  day: string;  // Mon/Tue in TH
  icon: string; // emoji/icon
  conditionThai: string;
  high: number;
  low: number;
  rainChance: number; // approx probability in %
}

export async function getDailyForecast(days: number = 5): Promise<DailyForecastDay[]> {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: `${CITY},${COUNTRY_CODE}`,
        appid: API_KEY,
        units: 'metric',
        lang: 'en'
      }
    });

    const list: any[] = response.data?.list || [];
    const byDate: Record<string, any[]> = {};
    for (const item of list) {
      const dt = new Date(item.dt * 1000);
      const key = dt.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(item);
    }

    // Build daily metrics for the next `days` including today
    const results: DailyForecastDay[] = [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const dates = Object.keys(byDate)
      .filter(d => d >= todayStr)
      .sort()
      .slice(0, days);

    for (const d of dates) {
      const items = byDate[d];
      let hi = -Infinity, lo = Infinity;
      let humidSum = 0, count = 0;
      let desc = '';
      // use midday item for condition when available
      let chosen = items.reduce((best: any, cur: any) => {
        const hour = new Date(cur.dt * 1000).getHours();
        const score = -Math.abs(12 - hour); // prefer around noon
        return !best || score > (best._score ?? -99) ? Object.assign(cur, { _score: score }) : best;
      }, null as any);
      for (const it of items) {
        const main = it.main || {};
        if (typeof main.temp_max === 'number') hi = Math.max(hi, Math.round(main.temp_max));
        if (typeof main.temp_min === 'number') lo = Math.min(lo, Math.round(main.temp_min));
        if (typeof main.humidity === 'number') { humidSum += main.humidity; count++; }
      }
      if (!isFinite(hi)) hi = Math.round(items[0]?.main?.temp_max ?? 0);
      if (!isFinite(lo)) lo = Math.round(items[0]?.main?.temp_min ?? 0);
      desc = chosen?.weather?.[0]?.description || items[0]?.weather?.[0]?.description || '';
      const avgHum = count ? Math.round(humidSum / count) : 60;
      const cond = getWeatherCondition(desc);
      const rain = getRainProbability(desc, avgHum);

      const dateObj = new Date(d);
      results.push({
        date: d,
        day: new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(dateObj),
        icon: cond.icon,
        conditionThai: cond.thai,
        high: hi,
        low: lo,
        rainChance: rain.chance,
      });
    }

    return results;
  } catch (error) {
    console.error('Error fetching daily forecast:', error);
    // Fallback simple sequence
    const today = new Date();
    return Array.from({ length: days }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        date: d.toISOString().slice(0, 10),
        day: new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(d),
        icon: i % 2 ? '🌤️' : '☀️',
        conditionThai: i % 2 ? 'เมฆบางส่วน' : 'แจ่มใส',
        high: 34 - i,
        low: 25 - Math.min(i, 3),
        rainChance: 20 + i * 5,
      } as DailyForecastDay;
    });
  }
}

interface ForecastData {
  yesterday: WeatherData;
  today: WeatherData;
  tomorrow: WeatherData;
}

// OpenWeatherMap API configuration
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '549bd92b3ea0b8be7984b49f5926988c';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const CITY = 'Udon Thani';
const COUNTRY_CODE = 'TH';
// Udon Thani coordinates (approx.) for Open-Meteo
const UDON_LAT = 17.4138;
const UDON_LON = 102.7870;

// Weather condition mapping to Thai and emoji
const weatherConditionMap: Record<string, { thai: string; icon: string }> = {
  'clear sky': { thai: 'แจ่มใส', icon: '☀️' },
  'few clouds': { thai: 'เมฆบางส่วน', icon: '🌤️' },
  'scattered clouds': { thai: 'เมฆกระจาย', icon: '⛅' },
  'broken clouds': { thai: 'เมฆมาก', icon: '☁️' },
  'shower rain': { thai: 'ฝนปรอยๆ', icon: '🌦️' },
  'rain': { thai: 'ฝน', icon: '🌧️' },
  'thunderstorm': { thai: 'พายุฝนฟ้าคะนอง', icon: '⛈️' },
  'snow': { thai: 'หิมะ', icon: '🌨️' },
  'mist': { thai: 'หมอก', icon: '🌫️' },
  'overcast clouds': { thai: 'เมฆครึ้ม', icon: '☁️' },
  'light rain': { thai: 'ฝนเล็กน้อย', icon: '🌦️' },
  'moderate rain': { thai: 'ฝนปานกลาง', icon: '🌧️' },
  'heavy intensity rain': { thai: 'ฝนตกหนัก', icon: '🌧️' },
};

function getWeatherCondition(description: string): { thai: string; icon: string } {
  const condition = weatherConditionMap[description.toLowerCase()];
  return condition || { thai: 'ไม่ระบุ', icon: '🌡️' };
}

function getRainProbability(description: string, humidity: number): { chance: number; status: string } {
  const desc = description.toLowerCase();
  
  // คำนวณโอกาสฝนตามสภาพอากาศ
  let baseChance = 0;
  let status = 'ไม่มีฝน';
  
  if (desc.includes('thunder') || desc.includes('storm')) {
    baseChance = 85;
    status = 'ฝนฟ้าคะนอง';
  } else if (desc.includes('rain') || desc.includes('shower')) {
    baseChance = 75;
    status = 'มีฝน';
  } else if (desc.includes('drizzle')) {
    baseChance = 60;
    status = 'ฝนปรอยๆ';
  } else if (desc.includes('overcast') || desc.includes('broken clouds')) {
    baseChance = 35;
    status = 'อาจมีฝน';
  } else if (desc.includes('clouds')) {
    baseChance = 20;
    status = 'โอกาสฝนน้อย';
  } else if (desc.includes('clear')) {
    baseChance = 5;
    status = 'ไม่มีฝน';
  }
  
  // ปรับตามความชื้น
  if (humidity > 80) baseChance += 15;
  else if (humidity > 70) baseChance += 10;
  else if (humidity > 60) baseChance += 5;
  else if (humidity < 40) baseChance -= 10;
  
  // จำกัดค่าระหว่าง 0-100
  const finalChance = Math.max(0, Math.min(100, baseChance));
  
  // ปรับสถานะตามเปอร์เซ็นต์
  if (finalChance >= 80) status = 'ฝนแน่นอน';
  else if (finalChance >= 60) status = 'มีฝน';
  else if (finalChance >= 40) status = 'อาจมีฝน';
  else if (finalChance >= 20) status = 'โอกาสฝนน้อย';
  else status = 'ไม่มีฝน';
  
  return { chance: finalChance, status };
}

function convertToWeatherData(data: any, type: 'current' | 'forecast' = 'current'): WeatherData {
  const temp = Math.round(data.main?.temp || data.temp?.day || 0);
  const high = Math.round(data.main?.temp_max || data.temp?.max || temp + 3);
  const low = Math.round(data.main?.temp_min || data.temp?.min || temp - 5);
  const description = data.weather?.[0]?.description || '';
  const windSpeed = Math.round((data.wind?.speed || 0) * 3.6); // Convert m/s to km/h
  const humidity = data.main?.humidity || data.humidity || 0;

  const condition = getWeatherCondition(description);
  const rainData = getRainProbability(description, humidity);

  return {
    temp,
    high,
    low,
    condition: description,
    conditionThai: condition.thai,
    icon: condition.icon,
    humidity,
    wind: windSpeed,
    city: CITY,
    rainChance: rainData.chance,
    rainStatus: rainData.status
  };
}

export async function getCurrentWeather(): Promise<WeatherData> {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: `${CITY},${COUNTRY_CODE}`,
        appid: API_KEY,
        units: 'metric',
        lang: 'en'
      }
    });

    return convertToWeatherData(response.data);
  } catch (error) {
    console.error('Error fetching current weather:', error);
    // Return mock data if API fails
    return {
      temp: 32,
      high: 35,
      low: 26,
      condition: 'clear sky',
      conditionThai: 'แจ่มใส',
      icon: '☀️',
      humidity: 65,
      wind: 12,
      city: CITY,
      rainChance: 15,
      rainStatus: 'โอกาสฝนน้อย'
    };
  }
}

export async function getWeatherForecast(): Promise<ForecastData> {
  try {
    // Get current weather
    const currentResponse = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: `${CITY},${COUNTRY_CODE}`,
        appid: API_KEY,
        units: 'metric',
        lang: 'en'
      }
    });

    // Get 5-day forecast
    const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: `${CITY},${COUNTRY_CODE}`,
        appid: API_KEY,
        units: 'metric',
        lang: 'en'
      }
    });

    const today = convertToWeatherData(currentResponse.data);

    // Get tomorrow's data (24 hours from now)
    const tomorrowData = forecastResponse.data.list.find((item: any) => {
      const itemDate = new Date(item.dt * 1000);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return itemDate.getDate() === tomorrow.getDate();
    });

    // Get yesterday's data (simulate based on today's data)
    const yesterday: WeatherData = {
      ...today,
      temp: today.temp - Math.floor(Math.random() * 4) - 1,
      high: today.high - Math.floor(Math.random() * 3) - 1,
      low: today.low - Math.floor(Math.random() * 2) - 1,
      humidity: Math.max(30, today.humidity + Math.floor(Math.random() * 10) - 5),
      wind: Math.max(5, today.wind + Math.floor(Math.random() * 6) - 3)
    };

    const tomorrow = tomorrowData
      ? convertToWeatherData(tomorrowData, 'forecast')
      : {
          ...today,
          temp: today.temp + Math.floor(Math.random() * 4) - 2,
          high: today.high + Math.floor(Math.random() * 3) - 1,
          low: today.low + Math.floor(Math.random() * 2) - 1,
          conditionThai: 'เมฆบางส่วน',
          icon: '🌤️',
          humidity: Math.min(90, today.humidity + Math.floor(Math.random() * 10) - 5),
          wind: Math.max(5, today.wind + Math.floor(Math.random() * 8) - 4)
        };

    return { yesterday, today, tomorrow };
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    // Return mock data if API fails
    return {
      yesterday: {
        temp: 30,
        high: 33,
        low: 24,
        condition: 'few clouds',
        conditionThai: 'เมฆบางส่วน',
        icon: '🌤️',
        humidity: 72,
        wind: 8,
        city: CITY,
        rainChance: 25,
        rainStatus: 'โอกาสฝนน้อย'
      },
      today: {
        temp: 32,
        high: 35,
        low: 26,
        condition: 'clear sky',
        conditionThai: 'แจ่มใส',
        icon: '☀️',
        humidity: 65,
        wind: 12,
        city: CITY,
        rainChance: 15,
        rainStatus: 'โอกาสฝนน้อย'
      },
      tomorrow: {
        temp: 28,
        high: 31,
        low: 23,
        condition: 'overcast clouds',
        conditionThai: 'เมฆมาก',
        icon: '⛅',
        humidity: 78,
        wind: 15,
        city: CITY,
        rainChance: 45,
        rainStatus: 'อาจมีฝน'
      }
    };
  }
}

// ---------- Hourly Forecast (next ~24h, 3-hour steps from /forecast) ----------
export interface HourlyWeather {
  time: string; // e.g. 09:00
  hour: number; // 0-23 local hour
  temp: number;
  icon: string;
  conditionThai: string;
  rainChance: number;
  humidity: number;
  wind: number; // km/h
}

export async function getHourlyForecast(limitHours: number = 24): Promise<HourlyWeather[]> {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: `${CITY},${COUNTRY_CODE}`,
        appid: API_KEY,
        units: 'metric',
        lang: 'en'
      }
    });

    const list: any[] = response.data.list || [];
    const maxItems = Math.max(1, Math.ceil(limitHours / 3));
    const sliced = list.slice(0, maxItems);

    return sliced.map((item: any) => {
      const dt = new Date(item.dt * 1000);
      const hour = dt.getHours();
      const description = item.weather?.[0]?.description || '';
      const { thai, icon } = getWeatherCondition(description);
      const humidity = item.main?.humidity ?? 0;
      const wind = Math.round((item.wind?.speed || 0) * 3.6);
      const temp = Math.round(item.main?.temp ?? item.temp?.day ?? 0);
      const rain = getRainProbability(description, humidity);

      const hh = String(hour).padStart(2, '0');
      return {
        time: `${hh}:00`,
        hour,
        temp,
        icon,
        conditionThai: thai,
        rainChance: rain.chance,
        humidity,
        wind,
      } as HourlyWeather;
    });
  } catch (error) {
    console.error('Error fetching hourly forecast:', error);
    const now = new Date();
    return Array.from({ length: 8 }).map((_, i) => {
      const hour = (now.getHours() + i * 3) % 24;
      const hh = String(hour).padStart(2, '0');
      return {
        time: `${hh}:00`,
        hour,
        temp: 31 - (i % 3),
        icon: '🌤️',
        conditionThai: 'เมฆบางส่วน',
        rainChance: 20 + (i % 4) * 5,
        humidity: 60 + (i % 3) * 5,
        wind: 10 + (i % 3) * 2,
      } as HourlyWeather;
    });
  }
}

// ---------- True Hourly (1-hour step) using Open-Meteo (no API key required) ----------
// Weather code mapping from Open-Meteo to Thai/icon
const openMeteoCodeMap: Record<number, { thai: string; icon: string }> = {
  0: { thai: 'ท้องฟ้าแจ่มใส', icon: '☀️' },
  1: { thai: 'แดดจัด', icon: '🌤️' },
  2: { thai: 'เมฆบางส่วน', icon: '⛅' },
  3: { thai: 'เมฆครึ้ม', icon: '☁️' },
  45: { thai: 'หมอก', icon: '🌫️' },
  48: { thai: 'น้ำค้างแข็ง', icon: '🌫️' },
  51: { thai: 'ฝนปรอยๆ เบา', icon: '🌦️' },
  53: { thai: 'ฝนปรอยๆ ปานกลาง', icon: '🌦️' },
  55: { thai: 'ฝนปรอยๆ หนัก', icon: '🌧️' },
  56: { thai: 'ฝนเยือกแข็งเบา', icon: '🌧️' },
  57: { thai: 'ฝนเยือกแข็งหนัก', icon: '🌧️' },
  61: { thai: 'ฝนเล็กน้อย', icon: '🌦️' },
  63: { thai: 'ฝนปานกลาง', icon: '🌧️' },
  65: { thai: 'ฝนตกหนัก', icon: '🌧️' },
  66: { thai: 'ฝนเยือกแข็งเล็กน้อย', icon: '🌧️' },
  67: { thai: 'ฝนเยือกแข็งหนัก', icon: '🌧️' },
  71: { thai: 'หิมะเล็กน้อย', icon: '🌨️' },
  73: { thai: 'หิมะปานกลาง', icon: '🌨️' },
  75: { thai: 'หิมะหนัก', icon: '🌨️' },
  77: { thai: 'เกล็ดน้ำแข็ง', icon: '🌨️' },
  80: { thai: 'ฝนซู่เบา', icon: '🌦️' },
  81: { thai: 'ฝนซู่ปานกลาง', icon: '🌧️' },
  82: { thai: 'ฝนซู่หนัก', icon: '⛈️' },
  85: { thai: 'หิมะซู่เบา', icon: '🌨️' },
  86: { thai: 'หิมะซู่หนัก', icon: '🌨️' },
  95: { thai: 'พายุฝนฟ้าคะนอง', icon: '⛈️' },
  96: { thai: 'พายุฝนฟ้าคะนองมีลูกเห็บเล็ก', icon: '⛈️' },
  99: { thai: 'พายุฝนฟ้าคะนองมีลูกเห็บใหญ่', icon: '⛈️' },
};

export async function getHourlyForecastHourly(limitHours: number = 24): Promise<HourlyWeather[]> {
  try {
    // Request hourly data from Open-Meteo for Udon Thani
    const url = 'https://api.open-meteo.com/v1/forecast';
    const params = {
      latitude: UDON_LAT,
      longitude: UDON_LON,
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation_probability',
        'windspeed_10m',
        'weathercode'
      ].join(','),
      forecast_days: 2,
      timezone: 'Asia/Bangkok',
    } as const;

    const response = await axios.get(url, { params });
    const hourly = response.data?.hourly;
    const times: string[] = hourly?.time || [];
    const temps: number[] = hourly?.temperature_2m || [];
    const hums: number[] = hourly?.relative_humidity_2m || [];
    const pops: number[] = hourly?.precipitation_probability || [];
    const winds: number[] = hourly?.windspeed_10m || [];
    const codes: number[] = hourly?.weathercode || [];

    const now = new Date();
    const results: HourlyWeather[] = [];
    for (let i = 0; i < times.length; i++) {
      const dt = new Date(times[i]);
      if (dt < now) continue; // only future/current
      const hour = dt.getHours();
      const hh = String(hour).padStart(2, '0');
      const code = codes[i] ?? 0;
      const map = openMeteoCodeMap[code] || { thai: 'ไม่ระบุ', icon: '🌡️' };
      results.push({
        time: `${hh}:00`,
        hour,
        temp: Math.round(temps[i] ?? 0),
        icon: map.icon,
        conditionThai: map.thai,
        rainChance: Math.max(0, Math.min(100, Math.round(pops[i] ?? 0))),
        humidity: Math.round(hums[i] ?? 0),
        wind: Math.round(winds[i] ?? 0),
      });
      if (results.length >= limitHours) break;
    }

    // Fallback if API returns nothing
    if (results.length === 0) throw new Error('No hourly data');
    return results;
  } catch (err) {
    console.error('Error fetching 1-hourly forecast (Open-Meteo):', err);
    // Fallback to 3-hour forecast as a backup
    const threeHourly = await getHourlyForecast(limitHours);
    // Expand 3-hour steps into per-hour by repeating values
    const expanded: HourlyWeather[] = [];
    for (const block of threeHourly) {
      for (let k = 0; k < 3 && expanded.length < limitHours; k++) {
        const hour = (block.hour + k) % 24;
        const hh = String(hour).padStart(2, '0');
        expanded.push({ ...block, hour, time: `${hh}:00` });
      }
      if (expanded.length >= limitHours) break;
    }
    return expanded.slice(0, limitHours);
  }
}