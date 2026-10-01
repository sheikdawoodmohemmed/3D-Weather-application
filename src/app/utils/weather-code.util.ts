// WMO Weather interpretation codes (https://open-meteo.com/en/docs)
export type SceneMood = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

interface CodeInfo {
  label: string;
  emoji: string;
  mood: SceneMood;
}

const CODE_MAP: Record<number, CodeInfo> = {
  0: { label: 'Clear sky', emoji: '☀️', mood: 'clear' },
  1: { label: 'Mainly clear', emoji: '🌤️', mood: 'partly-cloudy' },
  2: { label: 'Partly cloudy', emoji: '⛅', mood: 'partly-cloudy' },
  3: { label: 'Overcast', emoji: '☁️', mood: 'cloudy' },
  45: { label: 'Fog', emoji: '🌫️', mood: 'fog' },
  48: { label: 'Rime fog', emoji: '🌫️', mood: 'fog' },
  51: { label: 'Light drizzle', emoji: '🌦️', mood: 'drizzle' },
  53: { label: 'Drizzle', emoji: '🌦️', mood: 'drizzle' },
  55: { label: 'Dense drizzle', emoji: '🌧️', mood: 'drizzle' },
  56: { label: 'Freezing drizzle', emoji: '🌧️', mood: 'drizzle' },
  57: { label: 'Dense freezing drizzle', emoji: '🌧️', mood: 'drizzle' },
  61: { label: 'Slight rain', emoji: '🌧️', mood: 'rain' },
  63: { label: 'Rain', emoji: '🌧️', mood: 'rain' },
  65: { label: 'Heavy rain', emoji: '🌧️', mood: 'rain' },
  66: { label: 'Freezing rain', emoji: '🌧️', mood: 'rain' },
  67: { label: 'Heavy freezing rain', emoji: '🌧️', mood: 'rain' },
  71: { label: 'Slight snow', emoji: '🌨️', mood: 'snow' },
  73: { label: 'Snow', emoji: '🌨️', mood: 'snow' },
  75: { label: 'Heavy snow', emoji: '❄️', mood: 'snow' },
  77: { label: 'Snow grains', emoji: '❄️', mood: 'snow' },
  80: { label: 'Slight showers', emoji: '🌦️', mood: 'rain' },
  81: { label: 'Showers', emoji: '🌧️', mood: 'rain' },
  82: { label: 'Violent showers', emoji: '⛈️', mood: 'storm' },
  85: { label: 'Slight snow showers', emoji: '🌨️', mood: 'snow' },
  86: { label: 'Heavy snow showers', emoji: '❄️', mood: 'snow' },
  95: { label: 'Thunderstorm', emoji: '⛈️', mood: 'storm' },
  96: { label: 'Thunderstorm, slight hail', emoji: '⛈️', mood: 'storm' },
  99: { label: 'Thunderstorm, heavy hail', emoji: '⛈️', mood: 'storm' },
};

export function weatherLabel(code: number): string {
  return CODE_MAP[code]?.label ?? 'Unknown';
}

export function weatherEmoji(code: number): string {
  return CODE_MAP[code]?.emoji ?? '🌡️';
}

export function weatherMood(code: number): SceneMood {
  return CODE_MAP[code]?.mood ?? 'clear';
}
