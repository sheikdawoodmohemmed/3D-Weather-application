import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HourlyPoint, TempUnit } from '../../models/weather.model';
import { weatherEmoji } from '../../utils/weather-code.util';

@Component({
  selector: 'app-hourly-forecast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hourly-forecast.component.html',
  styleUrl: './hourly-forecast.component.scss',
})
export class HourlyForecastComponent {
  @Input({ required: true }) hours: HourlyPoint[] = [];
  @Input() tempUnit: TempUnit = 'celsius';

  get unitSymbol(): string {
    return this.tempUnit === 'celsius' ? '°' : '°';
  }

  emoji(code: number): string {
    return weatherEmoji(code);
  }

  formatHour(iso: string, index: number): string {
    if (index === 0) return 'Now';
    try {
      return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric' });
    } catch {
      return iso;
    }
  }

  barHeight(temp: number): number {
    const temps = this.hours.map((h) => h.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    if (max === min) return 50;
    return 20 + ((temp - min) / (max - min)) * 60;
  }
}
