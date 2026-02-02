import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  CHARGER_STATUSES,
  CHARGER_TYPES,
  CONNECTOR_TYPES,
  STATION_STATUSES,
  CreateChargerPayload,
  CreateStationPayload,
  Station,
  StationStatus,
  UpdateStationPayload,
} from '@core/models/stations.model';
import { StationsService } from '@core/services/stations.service';
import { minFormArrayLength, noWhitespaceValidator, uniqueChargerIds, chargerIdUniqueAsyncValidator } from '@core/validators/station.validators';

@Component({
  selector: 'app-station-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './station-form.html',
  styleUrl: './station-form.scss',
})
export class StationForm {
  private stationsService = inject(StationsService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly stationStatuses = STATION_STATUSES;
  readonly chargerStatuses = CHARGER_STATUSES;
  readonly chargerTypes = CHARGER_TYPES;
  readonly connectorTypes = CONNECTOR_TYPES;

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly submitted = signal(false);

  readonly stationId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id'))),
    { initialValue: null }
  );

  readonly stationResource = this.stationsService.stationResource(this.stationId);
  private readonly stationPatched = signal(false);

  readonly isEditMode = computed(() => !!this.stationId());

  readonly form = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(20), noWhitespaceValidator],
    ],
    address: ['', [Validators.required, noWhitespaceValidator]],
    city: ['', [Validators.required, Validators.maxLength(50), noWhitespaceValidator]],
    latitude: [null as number | null, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [null as number | null, [Validators.required, Validators.min(-180), Validators.max(180)]],
    status: ['ACTIVE'],
    isActive: [true],
    chargers: this.fb.array([], {
      validators: [minFormArrayLength(1), uniqueChargerIds],
    }),
  });

  constructor() {
    this.initializeChargers();

    // patch the form when station data is loaded
    effect(() => {
        
        if (this.stationResource.status() !== 'resolved') {
            if (this.stationResource.status() === 'loading' || this.stationResource.status() === 'reloading') {
            this.loading.set(true);
            }
            return;
        }

        const station = this.stationResource.value();
        if (!station || this.stationPatched()) {
            return;
        }

        this.patchStation(station);
        this.chargers.clear();
        this.form.controls.chargers.disable();
        this.stationPatched.set(true);
        this.loading.set(false);
    });

    effect(() => {
      const error = this.stationResource.error();
      if (error) {
        this.errorMessage.set(error.message || 'Failed to load station');
        this.loading.set(false);
      }
    });
  }

  get chargers(): FormArray {
    return this.form.controls.chargers as FormArray;
  }

  addCharger(): void {
    this.chargers.push(
      this.fb.group({
        chargerId: [
          '',
          [Validators.required, noWhitespaceValidator, Validators.pattern(/^[A-Za-z0-9_-]{3,30}$/)],
          [
                chargerIdUniqueAsyncValidator((chargerId) =>
                this.stationsService.checkChargerIdAvailability(chargerId)
                ),
            ],
            { updateOn: 'blur' },
        ],
        type: ['LEVEL_2', Validators.required],
        connectorType: ['CCS', Validators.required],
        powerKW: [22, [Validators.required, Validators.min(1)]],
        currentRate: [null as number | null, Validators.min(0)],
        status: ['AVAILABLE'],
      })
    );
  }

  removeCharger(index: number): void {
    if (this.chargers.length > 1) {
      this.chargers.removeAt(index);
    }
  }

  submit(): void {
    this.submitted.set(true);
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    if (this.isEditMode()) {
      const payload = this.buildUpdatePayload();
      this.stationsService.updateStation(this.stationId()!, payload).subscribe({
        next: () => this.router.navigate(['/stations', this.stationId()!]),
        error: (error: any) => {
          this.errorMessage.set(error?.message || 'Failed to update station');
          this.loading.set(false);
        }
      });
      return;
    }

    const payload = this.buildCreatePayload();
    this.stationsService.createStation(payload).subscribe({
      next: (station: Station) => this.router.navigate(['/stations', station.id]),
      error: (error: any) => {
        this.errorMessage.set(error?.message || 'Failed to create station');
        this.loading.set(false);
      }
    });
  }

  private initializeChargers(): void {
    if (this.chargers.length === 0) {
      this.addCharger();
    }
  }

  private patchStation(station: Station): void {
    this.form.patchValue({
      name: station.name,
      address: station.address,
      city: station.city,
      latitude: station.latitude,
      longitude: station.longitude,
      status: station.status,
      isActive: station.isActive,
    });
  }

  private buildCreatePayload(): CreateStationPayload {
    const value = this.form.getRawValue();
    const chargers = (value.chargers || []).map((charger: any) => ({
      chargerId: charger.chargerId,
      type: charger.type,
      connectorType: charger.connectorType,
      powerKW: Number(charger.powerKW),
      currentRate: charger.currentRate === null || charger.currentRate === '' ? undefined : Number(charger.currentRate),
      status: charger.status,
    })) as CreateChargerPayload[];

    return {
      name: value.name!,
      address: value.address!,
      city: value.city!,
      latitude: Number(value.latitude),
      longitude: Number(value.longitude),
      status: (value.status as StationStatus) || undefined,
      isActive: value.isActive ?? true,
      chargers,
    };
  }

  private buildUpdatePayload(): UpdateStationPayload {
    const value = this.form.getRawValue();
    return {
      name: value.name!,
      address: value.address!,
      city: value.city!,
      latitude: Number(value.latitude),
      longitude: Number(value.longitude),
      status: (value.status as StationStatus) || undefined,
      isActive: value.isActive ?? true,
    };
   }

    showError(control: AbstractControl | null): boolean {
      return !!control && control.invalid && (control.touched || this.submitted());
    }

  }
