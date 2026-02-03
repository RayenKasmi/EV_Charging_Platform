import { Component, input, effect, Output, EventEmitter, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReservationService } from '@core/services/reservation.service';
import { CreateReservationData, TimeRange } from '@core/models/reservation.model';
import { Station, Charger } from '@core/models/stations.model';
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

  // Signal-based inputs from parent - station, charger, date selection
  stationId = input<string>('');
  chargerId = input<string>('');
  selectedDate = input<Date>(new Date());
  selectedTimeRange = input<TimeRange | null>(null);

  @Output() reservationCreated = new EventEmitter<void>();

  reservationForm!: FormGroup;
  
  // Station/charger data from service for display
  private stations = this.reservationService.stations;
  
  // Computed signals for display - now properly reactive
  selectedStation = computed(() => this.stations().find(s => s.id === this.stationId()));
  selectedCharger = computed(() => this.selectedStation()?.chargers.find((c: Charger) => c.id === this.chargerId()));
  
  selectedStationName = computed(() => this.selectedStation()?.name || 'No station selected');
  selectedChargerInfo = computed(() => {
    const charger = this.selectedCharger();
    if (!charger) return 'No charger selected';
    const rate = charger.currentRate || charger.powerKW * 0.35;
    return `${charger.type} - ${charger.powerKW}kW (${this.formatCurrency(rate)}/hr)`;
  });
  formattedDate = computed(() => {
    const date = this.selectedDate();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  });
  
  hasRequiredInputs = computed(() => !!this.stationId() && !!this.chargerId());

  estimatedCost = signal<number>(0);
  duration = signal<number>(0);
  isSubmitting = signal(false);
  errorMessage = signal<string>('');

  constructor() {
    // Effect to update form when time range changes
    effect(() => {
      const range = this.selectedTimeRange();
      if (range && this.reservationForm) {
        const startHours = String(range.start.getHours()).padStart(2, '0');
        const startMinutes = String(range.start.getMinutes()).padStart(2, '0');
        const startStr = `${startHours}:${startMinutes}`;

        const endHours = String(range.end.getHours()).padStart(2, '0');
        const endMinutes = String(range.end.getMinutes()).padStart(2, '0');
        const endStr = `${endHours}:${endMinutes}`;

        this.reservationForm.patchValue({
          startTime: startStr,
          endTime: endStr
        });
      }
    });

    // Effect to recalculate cost when inputs change
    effect(() => {
      // Track all relevant inputs
      this.stationId();
      this.chargerId();
      this.selectedDate();
      // Recalculate cost
      this.updateEstimatedCost();
    });
  }

  ngOnInit() {
    this.initForm();
    this.setupFormListeners();
  }

  private initForm() {
    this.reservationForm = this.fb.group({
      startTime: ['', Validators.required],
      endTime: ['', [Validators.required, this.endTimeValidator.bind(this)]]
    }, {
      asyncValidators: [this.timeConflictValidator.bind(this)]
    });
  }

  private setupFormListeners() {
    this.reservationForm.get('startTime')?.valueChanges.subscribe(() => {
      this.updateEstimatedCost();
    });

    this.reservationForm.get('endTime')?.valueChanges.subscribe(() => {
      this.updateEstimatedCost();
    });
  }

  private updateEstimatedCost() {
    const values = this.reservationForm?.value;
    const dateStr = this.formatDateForApi(this.selectedDate());

    if (!this.stationId() || !this.chargerId() || !values?.startTime || !values?.endTime) {
      this.estimatedCost.set(0);
      this.duration.set(0);
      return;
    }

    const startTime = this.parseDateTime(dateStr, values.startTime);
    const endTime = this.parseDateTime(dateStr, values.endTime);

    if (startTime && endTime && endTime > startTime) {
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      this.duration.set(Math.round(durationHours * 100) / 100);

      const cost = this.reservationService.calculateEstimatedCost(
        this.chargerId(),
        this.stationId(),
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

    const startTimeValue = this.reservationForm.get('startTime')?.value;
    const dateStr = this.formatDateForApi(this.selectedDate());

    if (!startTimeValue) return null;

    const start = this.parseDateTime(dateStr, startTimeValue);
    const end = this.parseDateTime(dateStr, control.value);

    if (start && end && end <= start) {
      return { invalidEndTime: true };
    }

    return null;
  }

  private timeConflictValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const values = control.value;
    const dateStr = this.formatDateForApi(this.selectedDate());

    if (!this.stationId() || !values.startTime || !values.endTime) {
      return of(null);
    }

    const startTime = this.parseDateTime(dateStr, values.startTime);
    const endTime = this.parseDateTime(dateStr, values.endTime);

    if (!startTime || !endTime || endTime <= startTime) {
      return of(null);
    }

    return of(null).pipe(
      debounceTime(500),
      switchMap(() =>
        this.reservationService.validateConflict(this.stationId(), startTime, endTime).pipe(
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

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit() {
    if (this.reservationForm.invalid || this.isSubmitting() || !this.hasRequiredInputs()) return;

    const values = this.reservationForm.value;
    const dateStr = this.formatDateForApi(this.selectedDate());
    const startTime = this.parseDateTime(dateStr, values.startTime);
    const endTime = this.parseDateTime(dateStr, values.endTime);

    if (!startTime || !endTime) {
      this.errorMessage.set('Invalid date or time');
      return;
    }

    const data: CreateReservationData = {
      stationId: this.stationId(),
      chargerId: this.chargerId(),
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
