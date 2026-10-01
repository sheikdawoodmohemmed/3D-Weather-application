import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyPoint, TempUnit } from '../../models/weather.model';
import { weatherEmoji, weatherLabel } from '../../utils/weather-code.util';

@Component({
  selector: 'app-daily-forecast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-forecast.component.html',
  styleUrl: './daily-forecast.component.scss',
})
export class DailyForecastComponent {
  @Input({ required: true }) days: DailyPoint[] = [];
  @Input() tempUnit: TempUnit = 'celsius';

  get unitSymbol(): string {
    return '°';
  }

  emoji(code: number): string {
    return weatherEmoji(code);
  }

  label(code: number): string {
    return weatherLabel(code);
  }

  dayName(iso: string, index: number): string {
    if (index === 0) return 'Today';
    try {
      return new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
    } catch {
      return iso;
    }
  }

  globalMin(): number {
    return Math.min(...this.days.map((d) => d.tempMin));
  }

  globalMax(): number {
    return Math.max(...this.days.map((d) => d.tempMax));
  }

  rangeLeft(d: DailyPoint): number {
    const span = this.globalMax() - this.globalMin() || 1;
    return ((d.tempMin - this.globalMin()) / span) * 100;
  }

  rangeWidth(d: DailyPoint): number {
    const span = this.globalMax() - this.globalMin() || 1;
    return ((d.tempMax - d.tempMin) / span) * 100;
  }
}
