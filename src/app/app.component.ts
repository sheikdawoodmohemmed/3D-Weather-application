import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from './services/weather.service';
import { GeocodingService } from './services/geocoding.service';
import { GeoResult, CurrentWeather, HourlyPoint, DailyPoint, TempUnit, SpeedUnit } from './models/weather.model';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { UnitToggleComponent } from './components/unit-toggle/unit-toggle.component';
import { WeatherSceneComponent } from './components/weather-scene/weather-scene.component';
import { CurrentWeatherComponent } from './components/current-weather/current-weather.component';
import { HourlyForecastComponent } from './components/hourly-forecast/hourly-forecast.component';
import { DailyForecastComponent } from './components/daily-forecast/daily-forecast.component';
import { WeatherDetailsComponent } from './components/weather-details/weather-details.component';

const FALLBACK_LOCATION: GeoResult = {
  id: 2643743,
  name: 'London',
  country: 'United Kingdom',
  admin1: 'England',
  latitude: 51.5074,
  longitude: -0.1278,
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    UnitToggleComponent,
    WeatherSceneComponent,
    CurrentWeatherComponent,
    HourlyForecastComponent,
    DailyForecastComponent,
    WeatherDetailsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private weatherService = inject(WeatherService);
  private geocodingService = inject(GeocodingService);

  location = signal<GeoResult>(FALLBACK_LOCATION);
  tempUnit = signal<TempUnit>('celsius');
  speedUnit = signal<SpeedUnit>('kmh');

  current = signal<CurrentWeather | null>(null);
  hourly = signal<HourlyPoint[]>([]);
  daily = signal<DailyPoint[]>([]);
  timezone = signal<string>('');

  loading = signal(true);
  error = signal<string | null>(null);
  usedGeolocation = signal(false);

  next24h = computed(() => this.hourly().slice(0, 24));

  constructor() {
    this.tryGeolocation();
  }

  private tryGeolocation() {
    if (!navigator.geolocation) {
      this.loadForecast(this.location());
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.geocodingService.reverse(latitude, longitude).subscribe((place) => {
          const loc: GeoResult = place ?? {
            ...FALLBACK_LOCATION,
            latitude,
            longitude,
            name: 'My Location',
          };
          this.usedGeolocation.set(true);
          this.loadForecast(loc);
        });
      },
      () => {
        // permission denied or unavailable — use fallback city
        this.loadForecast(this.location());
      },
      { timeout: 8000 }
    );
  }

  selectLocation(loc: GeoResult) {
    this.usedGeolocation.set(false);
    this.loadForecast(loc);
  }

  changeUnits(units: { temp: TempUnit; speed: SpeedUnit }) {
    this.tempUnit.set(units.temp);
    this.speedUnit.set(units.speed);
    this.loadForecast(this.location(), false);
  }

  retry() {
    this.loadForecast(this.location());
  }

  private loadForecast(loc: GeoResult, resetLoading = true) {
    this.location.set(loc);
    if (resetLoading) this.loading.set(true);
    this.error.set(null);

    this.weatherService.getForecast(loc.latitude, loc.longitude, this.tempUnit(), this.speedUnit()).subscribe({
      next: (result) => {
        this.current.set(result.current);
        this.hourly.set(result.hourly);
        this.daily.set(result.daily);
        this.timezone.set(result.timezone);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not reach the weather service. Check your connection and try again.');
        this.loading.set(false);
      },
    });
  }
}
