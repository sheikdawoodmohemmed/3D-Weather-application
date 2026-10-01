export interface GeoResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  isDay: boolean;
  pressure: number;
  uvIndex: number;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
}

export interface DailyPoint {
  time: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
  precipitationSum: number;
}

export interface WeatherBundle {
  location: GeoResult;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  timezone: string;
}

export type TempUnit = 'celsius' | 'fahrenheit';
export type SpeedUnit = 'kmh' | 'mph';
