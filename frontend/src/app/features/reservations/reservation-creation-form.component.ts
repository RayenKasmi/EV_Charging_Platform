import { Component, Output, EventEmitter, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReservationService } from '../../core/services/reservation.service';
import { Station, Charger, CreateReservationData } from '../../core/models/reservation.model';
import { Observable, of, map, catchError, debounceTime, switchMap } from 'rxjs';

@Component({
  selector: 'app-reservation-creation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Reservation</h3>

      @if (isLoadingStations()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      } @else {
        <form [formGroup]="reservationForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Charging Station *
            </label>
            <select
              formControlName="stationId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="isFieldInvalid('stationId')">
              <option value="">Select a station</option>
              @for (station of stations(); track station.id) {
                <option [value]="station.id">{{ station.name }} - {{ station.location }}</option>
              }
            </select>
            @if (isFieldInvalid('stationId')) {
              <p class="mt-1 text-sm text-red-600">Please select a station</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Charger Type *
            </label>
            <select
              formControlName="chargerId"
              [disabled]="!selectedStation()"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
              [class.border-red-500]="isFieldInvalid('chargerId')">
              <option value="">Select a charger</option>
              @for (charger of availableChargers(); track charger.id) {
                <option [value]="charger.id">
                  {{ charger.type }} - {{ charger.powerOutput }}kW ({{ formatCurrency(charger.hourlyRate) }}/hr)
                </option>
              }
            </select>
            @if (isFieldInvalid('chargerId')) {
              <p class="mt-1 text-sm text-red-600">Please select a charger</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                formControlName="date"
                [min]="minDate()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                [class.border-red-500]="isFieldInvalid('date')" />
              @if (isFieldInvalid('date')) {
                <p class="mt-1 text-sm text-red-600">Please select a date</p>
              }
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                formControlName="startTime"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                [class.border-red-500]="isFieldInvalid('startTime')" />
              @if (isFieldInvalid('startTime')) {
                <p class="mt-1 text-sm text-red-600">Please enter a start time</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                formControlName="endTime"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                [class.border-red-500]="isFieldInvalid('endTime')" />
              @if (isFieldInvalid('endTime')) {
                <p class="mt-1 text-sm text-red-600">
                  {{ getEndTimeError() }}
                </p>
              }
            </div>
          </div>

          @if (reservationForm.hasError('timeConflict')) {
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p class="text-sm text-red-700 dark:text-red-400">
                This time slot is already reserved. Please choose a different time.
              </p>
            </div>
          }

          @if (estimatedCost() > 0) {
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Cost</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Duration: {{ duration() }} hours
                  </p>
                </div>
                <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {{ formatCurrency(estimatedCost()) }}
                </p>
              </div>
            </div>
          }

          @if (errorMessage()) {
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p class="text-sm text-red-700 dark:text-red-400">{{ errorMessage() }}</p>
            </div>
          }

          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              [disabled]="reservationForm.invalid || isSubmitting()"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed">
              @if (isSubmitting()) {
                <span class="flex items-center justify-center gap-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </span>
              } @else {
                <span>Create Reservation</span>
              }
            </button>
          </div>
        </form>
      }
    </div>
  `
})
export class ReservationCreationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reservationService = inject(ReservationService);

  @Output() reservationCreated = new EventEmitter<void>();

  reservationForm!: FormGroup;
  stations = signal<Station[]>([]);
  selectedStation = signal<Station | undefined>(undefined);
  availableChargers = signal<Charger[]>([]);
  estimatedCost = signal<number>(0);
  duration = signal<number>(0);

  isLoadingStations = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string>('');

  minDate = computed(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  ngOnInit() {
    this.initForm();
    this.loadStations();
    this.setupFormListeners();
  }

  private initForm() {
    this.reservationForm = this.fb.group({
      stationId: ['', Validators.required],
      chargerId: ['', Validators.required],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', [Validators.required, this.endTimeValidator.bind(this)]]
    }, {
      asyncValidators: [this.timeConflictValidator.bind(this)]
    });
  }

  private loadStations() {
    this.isLoadingStations.set(true);
    this.reservationService.getStations().subscribe({
      next: (stations) => {
        this.stations.set(stations);
        this.isLoadingStations.set(false);
      },
      error: () => {
        this.isLoadingStations.set(false);
        this.errorMessage.set('Failed to load stations');
      }
    });
  }

  private setupFormListeners() {
    this.reservationForm.get('stationId')?.valueChanges.subscribe(stationId => {
      const station = this.stations().find(s => s.id === stationId);
      this.selectedStation.set(station);
      this.availableChargers.set(station?.chargers || []);
      this.reservationForm.patchValue({ chargerId: '' });
      this.updateEstimatedCost();
    });

    this.reservationForm.get('chargerId')?.valueChanges.subscribe(() => {
      this.updateEstimatedCost();
    });

    this.reservationForm.get('date')?.valueChanges.subscribe(() => {
      this.updateEstimatedCost();
    });

    this.reservationForm.get('startTime')?.valueChanges.subscribe(() => {
      this.updateEstimatedCost();
    });

    this.reservationForm.get('endTime')?.valueChanges.subscribe(() => {
      this.updateEstimatedCost();
    });
  }

  private updateEstimatedCost() {
    const values = this.reservationForm.value;

    if (!values.stationId || !values.chargerId || !values.date || !values.startTime || !values.endTime) {
      this.estimatedCost.set(0);
      this.duration.set(0);
      return;
    }

    const startTime = this.parseDateTime(values.date, values.startTime);
    const endTime = this.parseDateTime(values.date, values.endTime);

    if (startTime && endTime && endTime > startTime) {
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      this.duration.set(Math.round(durationHours * 100) / 100);

      const cost = this.reservationService.calculateEstimatedCost(
        values.chargerId,
        values.stationId,
        startTime,
        endTime
      );
      this.estimatedCost.set(cost);
    } else {
      this.estimatedCost.set(0);
      this.duration.set(0);
    }
  }

  private endTimeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || !this.reservationForm) return null;

    const startTime = this.reservationForm.get('startTime')?.value;
    const date = this.reservationForm.get('date')?.value;

    if (!startTime || !date) return null;

    const start = this.parseDateTime(date, startTime);
    const end = this.parseDateTime(date, control.value);

    if (start && end && end <= start) {
      return { invalidEndTime: true };
    }

    return null;
  }

  private timeConflictValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const values = control.value;

    if (!values.stationId || !values.date || !values.startTime || !values.endTime) {
      return of(null);
    }

    const startTime = this.parseDateTime(values.date, values.startTime);
    const endTime = this.parseDateTime(values.date, values.endTime);

    if (!startTime || !endTime || endTime <= startTime) {
      return of(null);
    }

    return of(null).pipe(
      debounceTime(500),
      switchMap(() =>
        this.reservationService.validateConflict(values.stationId, startTime, endTime).pipe(
          map(hasConflict => hasConflict ? { timeConflict: true } : null),
          catchError(() => of(null))
        )
      )
    );
  }

  private parseDateTime(date: string, time: string): Date | null {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);

    return dateTime;
  }

  onSubmit() {
    if (this.reservationForm.invalid || this.isSubmitting()) return;

    const values = this.reservationForm.value;
    const startTime = this.parseDateTime(values.date, values.startTime);
    const endTime = this.parseDateTime(values.date, values.endTime);

    if (!startTime || !endTime) {
      this.errorMessage.set('Invalid date or time');
      return;
    }

    const data: CreateReservationData = {
      stationId: values.stationId,
      chargerId: values.chargerId,
      startTime,
      endTime
    };

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.reservationService.createReservation(data).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.reservationForm.reset();
        this.estimatedCost.set(0);
        this.duration.set(0);
        this.reservationCreated.emit();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.message || 'Failed to create reservation');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.reservationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getEndTimeError(): string {
    const field = this.reservationForm.get('endTime');
    if (field?.hasError('required')) {
      return 'Please enter an end time';
    }
    if (field?.hasError('invalidEndTime')) {
      return 'End time must be after start time';
    }
    return 'Invalid end time';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
