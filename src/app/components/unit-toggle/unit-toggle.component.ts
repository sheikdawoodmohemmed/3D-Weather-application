import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TempUnit, SpeedUnit } from '../../models/weather.model';

@Component({
  selector: 'app-unit-toggle',
  standalone: true,
  templateUrl: './unit-toggle.component.html',
  styleUrl: './unit-toggle.component.scss',
})
export class UnitToggleComponent {
  @Input() tempUnit: TempUnit = 'celsius';
  @Input() speedUnit: SpeedUnit = 'kmh';
  @Output() unitsChanged = new EventEmitter<{ temp: TempUnit; speed: SpeedUnit }>();

  setMetric() {
    this.unitsChanged.emit({ temp: 'celsius', speed: 'kmh' });
  }

  setImperial() {
    this.unitsChanged.emit({ temp: 'fahrenheit', speed: 'mph' });
  }
}
