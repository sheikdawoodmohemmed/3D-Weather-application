import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentWeather, DailyPoint, SpeedUnit } from '../../models/weather.model';

@Component({
  selector: 'app-weather-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-details.component.html',
  styleUrl: './weather-details.component.scss',
})
export class WeatherDetailsComponent {
  @Input({ required: true }) current!: CurrentWeather;
  @Input() today?: DailyPoint;
  @Input() speedUnit: SpeedUnit = 'kmh';

  get speedLabel(): string {
    return this.speedUnit === 'kmh' ? 'km/h' : 'mph';
  }

  get uvLevel(): string {
    const uv = this.current.uvIndex;
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very High';
    return 'Extreme';
  }

  formatTime(iso?: string): string {
    if (!iso) return '--:--';
    try {
      return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }
}
