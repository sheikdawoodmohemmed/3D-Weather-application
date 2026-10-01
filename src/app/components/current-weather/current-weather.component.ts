import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentWeather, GeoResult, TempUnit } from '../../models/weather.model';
import { weatherEmoji, weatherLabel } from '../../utils/weather-code.util';

@Component({
  selector: 'app-current-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-weather.component.html',
  styleUrl: './current-weather.component.scss',
})
export class CurrentWeatherComponent {
  @Input({ required: true }) location!: GeoResult;
  @Input({ required: true }) current!: CurrentWeather;
  @Input() tempUnit: TempUnit = 'celsius';
  @Input() usedGeolocation = false;

  get emoji(): string {
    return weatherEmoji(this.current.weatherCode);
  }

  get label(): string {
    return weatherLabel(this.current.weatherCode);
  }

  get unitSymbol(): string {
    return this.tempUnit === 'celsius' ? '°C' : '°F';
  }

  get placeLabel(): string {
    return [this.location.name, this.location.country].filter(Boolean).join(', ');
  }

  get formattedTime(): string {
    try {
      return new Date(this.current.time).toLocaleString(undefined, {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return this.current.time;
    }
  }
}
