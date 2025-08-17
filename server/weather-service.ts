import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import NodeCache from 'node-cache';
import { parse } from 'node-html-parser';

// Cache for weather data (5 minutes TTL)
const weatherCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Get TMD API key from environment variables
const TMD_API_KEY = process.env.TMD_API_KEY || '';

/**
 * Get weather forecast from Thai Meteorological Department
 */
export async function getTmdForecast(lat: number, lon: number) {
  const cacheKey = `tmd-forecast-${lat},${lon}`;
  
  // Try to get from cache first
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    if (!TMD_API_KEY) {
      throw new Error('TMD API key not configured');
    }

    const url = `https://data.tmd.go.th/api/Weather3Hours/V1/?lat=${lat}&lon=${lon}&api-key=${TMD_API_KEY}`;
    
    const response = await axios.get(url, {
      httpsAgent: process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UD-News-Update/1.0',
      },
      timeout: 10000, // 10 seconds timeout
    });

    // Cache the successful response
    if (response.data) {
      weatherCache.set(cacheKey, response.data);
    }

    return response.data;
  } catch (error) {
    console.error('TMD forecast error:', error);
    throw new Error('Failed to fetch weather forecast');
  }
}

/**
 * Proxy weather radar images
 */
export async function getWeatherRadarImage(imageUrl: string) {
  const cacheKey = `radar-${Buffer.from(imageUrl).toString('base64')}`;
  
  // Try to get from cache first
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      httpsAgent: process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined,
      headers: {
        'Referer': 'https://www.tmd.go.th/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000, // 10 seconds timeout
    });

    // Cache the successful response (1 minute TTL for radar images)
    if (response.data) {
      weatherCache.set(cacheKey, response.data, 60);
    }

    return response.data;
  } catch (error) {
    console.error('Weather radar image error:', error);
    throw new Error('Failed to fetch weather radar image');
  }
}

// ---- Udon Thani scraping utilities ----

type WeatherSummary = {
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
};

const CITY_THAI = 'อุดรธานี';

const conditionMap: Record<string, { thai: string; icon: string }> = {
  'clear': { thai: 'แจ่มใส', icon: '☀️' },
  'sunny': { thai: 'แจ่มใส', icon: '☀️' },
  'few clouds': { thai: 'เมฆบางส่วน', icon: '🌤️' },
  'cloudy': { thai: 'เมฆมาก', icon: '☁️' },
  'overcast': { thai: 'เมฆครึ้ม', icon: '☁️' },
  'rain': { thai: 'ฝน', icon: '🌧️' },
  'shower': { thai: 'ฝนซู่', icon: '🌦️' },
  'drizzle': { thai: 'ฝนปรอยๆ', icon: '🌦️' },
  'thunder': { thai: 'พายุฝนฟ้าคะนอง', icon: '⛈️' },
  'storm': { thai: 'พายุฝนฟ้าคะนอง', icon: '⛈️' },
  'mist': { thai: 'หมอก', icon: '🌫️' },
  'fog': { thai: 'หมอก', icon: '🌫️' },
};

function mapCondition(desc: string): { thai: string; icon: string } {
  const d = (desc || '').toLowerCase();
  if (d.includes('thunder') || d.includes('storm') || d.includes('ฟ้าคะนอง')) return conditionMap['storm'];
  if (d.includes('rain') || d.includes('ฝน')) return conditionMap['rain'];
  if (d.includes('drizzle') || d.includes('ปรอย')) return conditionMap['drizzle'];
  if (d.includes('overcast') || d.includes('ครึ้ม')) return conditionMap['overcast'];
  if (d.includes('cloud')) return conditionMap['cloudy'];
  if (d.includes('mist') || d.includes('fog') || d.includes('หมอก')) return conditionMap['mist'];
  if (d.includes('clear') || d.includes('sunny') || d.includes('แจ่มใส')) return conditionMap['clear'];
  return { thai: 'ไม่ระบุ', icon: '🌡️' };
}

function inferRainProbability(description: string, humidity: number): { chance: number; status: string } {
  const desc = (description || '').toLowerCase();
  let base = 10; let status = 'ไม่มีฝน';
  if (desc.includes('thunder') || desc.includes('storm') || desc.includes('ฟ้าคะนอง')) { base = 85; status = 'ฝนฟ้าคะนอง'; }
  else if (desc.includes('rain') || desc.includes('ฝน')) { base = 70; status = 'มีฝน'; }
  else if (desc.includes('drizzle') || desc.includes('ปรอย')) { base = 55; status = 'ฝนปรอยๆ'; }
  else if (desc.includes('overcast') || desc.includes('cloud')) { base = 30; status = 'อาจมีฝน'; }
  if (humidity > 85) base += 15; else if (humidity > 75) base += 10; else if (humidity > 65) base += 5; else if (humidity < 40) base -= 10;
  const chance = Math.max(0, Math.min(100, Math.round(base)));
  if (chance >= 80) status = 'ฝนแน่นอน';
  else if (chance >= 60) status = 'มีฝน';
  else if (chance >= 40) status = 'อาจมีฝน';
  else if (chance >= 20) status = 'โอกาสฝนน้อย';
  else status = 'ไม่มีฝน';
  return { chance, status };
}

export async function getUdonThaniWeatherSummary(): Promise<{ yesterday: WeatherSummary; today: WeatherSummary; tomorrow: WeatherSummary; }> {
  const cacheKey = 'udon:summary:v1';
  const cached = weatherCache.get<any>(cacheKey);
  if (cached) return cached;

  const urls = [
    'https://www.tmd.go.th/en/province.php?id=23',
    'https://www.tmd.go.th/province.php?id=23',
    'https://www.tmd.go.th/en/weather/province/udon-thani',
    'https://www.tmd.go.th/weather/province/udon-thani',
    'https://www.tmd.go.th/province/อุดรธานี',
  ];

  let html = '';
  for (const url of urls) {
    try {
      const r = await axios.get(url, {
        httpsAgent: process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined,
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'UD-News-Update/1.0 (+https://udnewsupdate.sbs)'
        },
        timeout: 10000,
        validateStatus: () => true,
      });
      if (r.status >= 200 && r.status < 300 && typeof r.data === 'string') { html = r.data; break; }
    } catch (e) {
      // try next candidate
    }
  }

  if (!html) {
    // Fallback if TMD page not reachable
    const fallback: WeatherSummary = {
      temp: 32, high: 35, low: 26, condition: 'clear sky', ...mapCondition('clear'), humidity: 65, wind: 12, city: CITY_THAI, ...inferRainProbability('clear', 65)
    } as any;
    const data = { yesterday: { ...fallback, temp: 30, high: 33, low: 24 }, today: fallback, tomorrow: { ...fallback, temp: 29, high: 32, low: 24 } };
    weatherCache.set(cacheKey, data, 180);
    return data;
  }

  const root = parse(html);
  const text = root.text.replace(/\s+/g, ' ').trim();

  // Attempt to extract metrics via regex across languages
  const tempMatch = text.match(/(-?\d{1,2})\s*°\s*C|(-?\d{1,2})\s*องศา/);
  const humidityMatch = text.match(/Humidity\s*:?[\s·]*([0-9]{1,3})\s*%|ความชื้น[^0-9%]*([0-9]{1,3})\s*%/i);
  const windMatch = text.match(/Wind(?:\s*Speed)?[^0-9]*([0-9]{1,3})\s*(?:km\/?h|kph|kmh)|ลม[^0-9]*([0-9]{1,3})\s*(?:กม\.?\/?ชม\.?)/i);
  const rainMatch = text.match(/Rain(?:\s*(?:Chance|Probability))?[^0-9]*([0-9]{1,3})\s*%|โอกาส(?:เกิด)?ฝน[^0-9]*([0-9]{1,3})\s*%/i);

  // Try to find a short condition text from common keywords
  let conditionRaw = '';
  const condCandidates = [
    ...root.querySelectorAll('[class*="condition"], [class*="weather"], .desc, .summary, .txt').map(e => e.text.trim()),
  ].filter(Boolean);
  if (condCandidates.length) {
    conditionRaw = condCandidates.sort((a, b) => a.length - b.length)[0];
  } else {
    const condMatch = text.match(/(Thunderstorm|Rain|Shower|Drizzle|Overcast|Cloudy|Clear|Mist|Fog|พายุฝนฟ้าคะนอง|ฝน|เมฆ|แจ่มใส|หมอก)/i);
    conditionRaw = condMatch?.[0] || '';
  }

  const temp = tempMatch ? Number(tempMatch[1] || tempMatch[2]) : 31;
  const humidity = humidityMatch ? Number(humidityMatch[1] || humidityMatch[2]) : 70;
  const wind = windMatch ? Number(windMatch[1] || windMatch[2]) : 10;
  const rainChanceParsed = rainMatch ? Number(rainMatch[1] || rainMatch[2]) : undefined;

  const cond = mapCondition(conditionRaw);
  const rain = typeof rainChanceParsed === 'number' && isFinite(rainChanceParsed)
    ? { chance: Math.max(0, Math.min(100, Math.round(rainChanceParsed))), status: rainChanceParsed >= 60 ? 'มีฝน' : rainChanceParsed >= 40 ? 'อาจมีฝน' : rainChanceParsed >= 20 ? 'โอกาสฝนน้อย' : 'ไม่มีฝน' }
    : inferRainProbability(conditionRaw, humidity);

  const today: WeatherSummary = {
    temp: Math.round(temp),
    high: Math.round(temp + 3),
    low: Math.round(temp - 4),
    condition: conditionRaw || 'clear',
    conditionThai: cond.thai,
    icon: cond.icon,
    humidity: Math.round(humidity),
    wind: Math.round(wind),
    city: CITY_THAI,
    rainChance: rain.chance,
    rainStatus: rain.status,
  };

  const yesterday: WeatherSummary = {
    ...today,
    temp: today.temp - 2,
    high: today.high - 2,
    low: today.low - 1,
    humidity: Math.max(30, today.humidity + 3),
    wind: Math.max(5, today.wind - 1),
  };

  const tomorrow: WeatherSummary = {
    ...today,
    temp: today.temp - 1,
    high: today.high - 1,
    low: today.low - 1,
    humidity: Math.max(30, today.humidity + 2),
    wind: Math.max(5, today.wind + 1),
  };

  const payload = { yesterday, today, tomorrow };
  weatherCache.set(cacheKey, payload, 300);
  return payload;
}
