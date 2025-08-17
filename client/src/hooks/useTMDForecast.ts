import { useQuery } from '@tanstack/react-query';
import { useLocation } from '../store/location';
import { getDailyForecast, getHourlyForecast, getWeatherForecast, DailyForecastDay, HourlyWeather } from '../lib/weather-api';

// Server cache: daily max-age=120s; hourly max-age=60s

export function useTMDDailyForecast(days = 5) {
  const { province } = useLocation();
  return useQuery<DailyForecastDay[]>({
    queryKey: ['tmd','daily', days, province.lat, province.lon],
    queryFn: () => getDailyForecast(days, { lat: province.lat, lon: province.lon }),
    staleTime: 120_000,
    gcTime: 10 * 60_000,
  });
}

export function useTMDHourlyForecast(limitHours = 24) {
  const { province } = useLocation();
  return useQuery<HourlyWeather[]>({
    queryKey: ['tmd','hourly', limitHours, province.lat, province.lon],
    queryFn: () => getHourlyForecast(limitHours, { lat: province.lat, lon: province.lon }),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useTMDWeatherSummary() {
  const { province } = useLocation();
  return useQuery({
    queryKey: ['tmd','summary', province.lat, province.lon],
    queryFn: () => getWeatherForecast({ lat: province.lat, lon: province.lon }),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}
