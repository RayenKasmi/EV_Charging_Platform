import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import {
  CHARGER_TYPES,
  STATION_STATUSES,
  StationQuery,
} from '@core/models/stations.model';
import { StationsService } from '@core/services/stations.service';

@Component({
  selector: 'app-station-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './station-list.html',
  styleUrl: './station-list.scss',
})
export class StationList {
  private stationsService = inject(StationsService);
  private fb = inject(FormBuilder);

  readonly stationStatuses = STATION_STATUSES;
  readonly chargerTypes = CHARGER_TYPES;

  private readonly mutationLoading = signal(false);
  private readonly mutationError = signal('');
  private readonly pageSignal = signal(1);
  private readonly limitSignal = signal(10);

  readonly filtersForm = this.fb.group({
    city: [''],
    status: [''],
    chargerType: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
    radius: [10000 as number],
  });

  private readonly filtersSignal = toSignal(
    this.filtersForm.valueChanges.pipe(
      startWith(this.filtersForm.getRawValue()),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ),
    { initialValue: this.filtersForm.getRawValue() }
  );

  private readonly querySignal = computed<StationQuery>(() => ({
    ...this.normalizeFilters(this.filtersSignal()),
    page: this.pageSignal(),
    limit: this.limitSignal(),
  }));

  readonly stationResource = this.stationsService.stationsResource(this.querySignal);
  readonly stations = computed(() => this.stationResource.value().data);
  readonly meta = computed(() => this.stationResource.value().meta);
  readonly loading = computed(() => this.stationResource.isLoading() || this.mutationLoading());
  readonly errorMessage = computed(() => this.mutationError() || this.stationResource.error()?.message || '');

  resetFilters(): void {
    this.filtersForm.reset({
      city: '',
      status: '',
      chargerType: '',
      latitude: null,
      longitude: null,
      radius: 10000,
    });
    this.geoStatus.set('idle');
    this.geoError.set('');
    this.pageSignal.set(1);
  }

  refresh(): void {
    this.stationResource.reload();
  }

  goToNextPage(): void {
    if (this.meta().page < this.meta().totalPages) {
      this.pageSignal.update(page => page + 1);
    }
  }

  goToPreviousPage(): void {
    if (this.meta().page > 1) {
      this.pageSignal.update(page => page - 1);
    }
  }

  deleteStation(id: string): void {
    if (!confirm('Are you sure you want to delete this station?')) {
      return;
    }

    this.mutationLoading.set(true);
    this.mutationError.set('');
    this.stationsService.deleteStation(id).subscribe({
      next: () => {
        this.mutationLoading.set(false);
        this.stationResource.reload();
      },
      error: (error) => {
        this.mutationLoading.set(false);
        this.mutationError.set(error?.message || 'Failed to delete station');
      }
    });
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-600';
      case 'MAINTENANCE':
        return 'bg-amber-100 text-amber-700';
      case 'OFFLINE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  private normalizeFilters(values: any): StationQuery {
    return {
      city: values.city?.trim() || undefined,
      status: values.status || undefined,
      chargerType: values.chargerType || undefined,
      latitude: this.toNumberOrUndefined(values.latitude),
      longitude: this.toNumberOrUndefined(values.longitude),
      radius: this.toNumberOrUndefined(values.radius),
    };
  }

  private toNumberOrUndefined(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  readonly geoStatus = signal<'idle' | 'locating' | 'ready' | 'error'>('idle');
  readonly geoError = signal('');

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.geoStatus.set('error');
      this.geoError.set('Geolocation is not supported by this browser.');
      return;
    }

    this.geoStatus.set('locating');
    this.geoError.set('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.filtersForm.patchValue({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
        if (!this.filtersForm.controls.radius.value) {
          this.filtersForm.controls.radius.setValue(10000);
        }
        this.geoStatus.set('ready');
      },
      (error) => {
        this.geoStatus.set('error');
        this.geoError.set(error.message || 'Unable to get your location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  clearLocation(): void {
    this.filtersForm.patchValue({ latitude: null, longitude: null });
    this.geoStatus.set('idle');
    this.geoError.set('');
  }
}
