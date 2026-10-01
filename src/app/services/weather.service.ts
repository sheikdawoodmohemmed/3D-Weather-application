import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CurrentWeather, DailyPoint, HourlyPoint, SpeedUnit, TempUnit } from '../models/weather.model';

interface RawForecastResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    is_day: number;
    pressure_msl: number;
    uv_index?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: number[];
  };
}

export interface ForecastResult {
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}

/**
 * Real weather data from the free Open-Meteo Forecast API.
 * No API key required: https://open-meteo.com/en/docs
 */
@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';

  getForecast(
    latitude: number,
    longitude: number,
    tempUnit: TempUnit = 'celsius',
    speedUnit: SpeedUnit = 'kmh'
  ): Observable<ForecastResult> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day,pressure_msl,uv_index',
      hourly: 'temperature_2m,weather_code,precipitation_probability',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum',
      timezone: 'auto',
      temperature_unit: tempUnit,
      wind_speed_unit: speedUnit,
      forecast_days: '7',
    });
    const url = `${this.baseUrl}?${params.toString()}`;

    return this.http.get<RawForecastResponse>(url).pipe(
      map((res) => {
        const current: CurrentWeather = {
          time: res.current.time,
          temperature: Math.round(res.current.temperature_2m),
          apparentTemperature: Math.round(res.current.apparent_temperature),
          humidity: res.current.relative_humidity_2m,
          windSpeed: Math.round(res.current.wind_speed_10m),
          windDirection: res.current.wind_direction_10m,
          weatherCode: res.current.weather_code,
          isDay: res.current.is_day === 1,
          pressure: Math.round(res.current.pressure_msl),
          uvIndex: res.current.uv_index ?? 0,
        };

        const hourly: HourlyPoint[] = res.hourly.time.map((t, i) => ({
          time: t,
          temperature: Math.round(res.hourly.temperature_2m[i]),
          weatherCode: res.hourly.weather_code[i],
          precipitationProbability: res.hourly.precipitation_probability?.[i] ?? 0,
        }));

        const daily: DailyPoint[] = res.daily.time.map((t, i) => ({
          time: t,
          weatherCode: res.daily.weather_code[i],
          tempMax: Math.round(res.daily.temperature_2m_max[i]),
          tempMin: Math.round(res.daily.temperature_2m_min[i]),
          sunrise: res.daily.sunrise[i],
          sunset: res.daily.sunset[i],
          precipitationSum: res.daily.precipitation_sum[i],
        }));

        return { timezone: res.timezone, current, hourly, daily };
      })
    );
  }
}
