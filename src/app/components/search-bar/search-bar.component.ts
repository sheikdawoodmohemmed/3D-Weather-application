import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { GeocodingService } from '../../services/geocoding.service';
import { GeoResult } from '../../models/weather.model';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent {
  private geocoding = inject(GeocodingService);
  private input$ = new Subject<string>();

  @Output() locationSelected = new EventEmitter<GeoResult>();

  query = signal('');
  results = signal<GeoResult[]>([]);
  open = signal(false);
  searching = signal(false);

  constructor() {
    this.input$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((q) => {
          this.searching.set(true);
          return this.geocoding.search(q);
        })
      )
      .subscribe((res) => {
        this.results.set(res);
        this.searching.set(false);
      });
  }

  onInput(value: string) {
    this.query.set(value);
    this.open.set(true);
    if (value.trim().length < 2) {
      this.results.set([]);
      return;
    }
    this.input$.next(value);
  }

  choose(result: GeoResult) {
    this.locationSelected.emit(result);
    this.query.set('');
    this.results.set([]);
    this.open.set(false);
  }

  onBlur() {
    setTimeout(() => this.open.set(false), 150);
  }

  placeLabel(r: GeoResult): string {
    return [r.name, r.admin1, r.country].filter(Boolean).join(', ');
  }
}
