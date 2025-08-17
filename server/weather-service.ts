import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import NodeCache from 'node-cache';

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
