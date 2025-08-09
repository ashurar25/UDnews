
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
  'overcast clouds': { thai: 'เมฆครึ้ม', icon: '☁️' }
};

function getWeatherCondition(description: string): { thai: string; icon: string } {
  const condition = weatherConditionMap[description.toLowerCase()];
  return condition || { thai: 'ไม่ระบุ', icon: '🌡️' };
}

function convertToWeatherData(data: any, type: 'current' | 'forecast' = 'current'): WeatherData {
  const temp = Math.round(data.main?.temp || data.temp?.day || 0);
  const high = Math.round(data.main?.temp_max || data.temp?.max || temp + 3);
  const low = Math.round(data.main?.temp_min || data.temp?.min || temp - 5);
  const description = data.weather?.[0]?.description || '';
  const windSpeed = Math.round((data.wind?.speed || 0) * 3.6); // Convert m/s to km/h
  const humidity = data.main?.humidity || data.humidity || 0;
  
  const condition = getWeatherCondition(description);
  
  return {
    temp,
    high,
    low,
    condition: description,
    conditionThai: condition.thai,
    icon: condition.icon,
    humidity,
    wind: windSpeed,
    city: CITY
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
      city: CITY
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
        city: CITY
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
        city: CITY
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
        city: CITY
      }
    };
  }
}
