import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';
import { GeoResult } from '../models/weather.model';
import { environment } from '../../environments/environments';
interface RawGeoResponse {
  results?: Array<{
    id: number;
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
}

/**
 * Real geocoding against the free Open-Meteo Geocoding API.
 * No API key required: https://open-meteo.com/en/docs/geocoding-api
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private http = inject(HttpClient);

  search(query: string, count = 6): Observable<GeoResult[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }
    const url = `${environment.baseUrl}?name=${encodeURIComponent(query.trim())}&count=${count}&language=en&format=json`;
    return this.http.get<RawGeoResponse>(url).pipe(
      map((res) =>
        (res.results ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          country: r.country,
          admin1: r.admin1,
          latitude: r.latitude,
          longitude: r.longitude,
        }))
      ),
      catchError(() => of([]))
    );
  }

  reverse(latitude: number, longitude: number): Observable<GeoResult | null> {
    const url = `${environment.reverseUrl}?latitude=${latitude}&longitude=${longitude}&language=en&format=json`;
    return this.http.get<RawGeoResponse>(url).pipe(
      map((res) => {
        const r = res.results?.[0];
        if (!r) return null;
        return {
          id: r.id,
          name: r.name,
          country: r.country,
          admin1: r.admin1,
          latitude: r.latitude,
          longitude: r.longitude,
        };
      }),
      catchError(() => of(null))
    );
  }
}
