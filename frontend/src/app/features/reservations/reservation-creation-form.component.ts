import { Component, Input, Output, EventEmitter, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReservationService } from '@core/services/reservation.service';
import { Station, Charger, CreateReservationData, TimeRange } from '@core/models/reservation.model';
import { Observable, of, map, catchError, debounceTime, switchMap } from 'rxjs';

@Component({
  selector: 'app-reservation-creation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservation-creation-form.component.html'
})
export class ReservationCreationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reservationService = inject(ReservationService);

  @Input() set selectedTimeRange(range: TimeRange | null) {
    if (range) {
      const year = range.start.getFullYear();
      const month = String(range.start.getMonth() + 1).padStart(2, '0');
      const day = String(range.start.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const startHours = String(range.start.getHours()).padStart(2, '0');
      const startMinutes = String(range.start.getMinutes()).padStart(2, '0');
      const startStr = `${startHours}:${startMinutes}`;

      const endHours = String(range.end.getHours()).padStart(2, '0');
      const endMinutes = String(range.end.getMinutes()).padStart(2, '0');
      const endStr = `${endHours}:${endMinutes}`;

      this.reservationForm.patchValue({
        date: dateStr,
        startTime: startStr,
        endTime: endStr
      });
    }
  }

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
