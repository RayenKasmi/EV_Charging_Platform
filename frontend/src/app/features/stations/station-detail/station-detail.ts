import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  CHARGER_STATUSES,
  CHARGER_TYPES,
  CONNECTOR_TYPES,
  Charger,
  ChargerStatus,
  ChargerType,
  ConnectorType,
} from '@core/models/stations.model';
import { StationsService } from '@core/services/stations.service';
import {
  chargerIdUniqueAsyncValidator,
  noWhitespaceValidator,
} from '@core/validators/station.validators';

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './station-detail.html',
  styleUrl: './station-detail.scss',
})
export class StationDetail {
  private stationsService = inject(StationsService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly chargerStatuses = CHARGER_STATUSES;
  readonly chargerTypes = CHARGER_TYPES;
  readonly connectorTypes = CONNECTOR_TYPES;

  private readonly mutationLoading = signal(false);
  private readonly mutationError = signal('');
  readonly editingChargerId = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly chargerForm = this.fb.group({
    chargerId: [
      '',
      [
        Validators.required,
        noWhitespaceValidator,
        Validators.pattern(/^[A-Za-z0-9_-]{3,30}$/),
      ],
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
    status: ['AVAILABLE', Validators.required],
  });

  readonly stationId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id'))),
    { initialValue: null }
  );

  readonly stationResource = this.stationsService.stationResource(this.stationId);
  readonly availabilityResource = this.stationsService.availabilityResource(this.stationId);
  readonly chargersResource = this.stationsService.chargersResource(this.stationId);

  readonly station = computed(() => this.stationResource.value());
  readonly availability = computed(() => this.availabilityResource.value());
  readonly chargers = computed(() => this.chargersResource.value());
  readonly loading = computed(
    () =>
      this.stationResource.isLoading() ||
      this.availabilityResource.isLoading() ||
      this.chargersResource.isLoading() ||
      this.mutationLoading()
  );
  readonly errorMessage = computed(
    () =>
      this.mutationError() ||
      this.stationResource.error()?.message ||
      this.availabilityResource.error()?.message ||
      this.chargersResource.error()?.message ||
      ''
  );

  refresh(): void {
    this.stationResource.reload();
    this.availabilityResource.reload();
    this.chargersResource.reload();
  }

  startEditCharger(charger: Charger): void {
    this.editingChargerId.set(charger.id);
    this.chargerForm.reset({
      chargerId: charger.chargerId,
      type: charger.type,
      connectorType: charger.connectorType,
      powerKW: charger.powerKW,
      currentRate: charger.currentRate ?? null,
      status: charger.status,
    });
    this.chargerForm.controls.chargerId.disable();
  }

  constructor() {
    effect(() => {
      this.chargers();
      // revalidate chargerId when chargers list changes
      this.chargerForm.controls.chargerId.updateValueAndValidity({ emitEvent: false }); 
      // prevents valueChanges events freom firing and thus prenvents infinite loop
    });
  }

  cancelEdit(): void {
    this.editingChargerId.set(null);
    this.chargerForm.reset({
      chargerId: '',
      type: 'LEVEL_2',
      connectorType: 'CCS',
      powerKW: 22,
      currentRate: null,
      status: 'AVAILABLE',
    });
    this.chargerForm.controls.chargerId.enable();
  }

  submitCharger(): void {
    this.submitted.set(true);
    const station = this.station();
    if (this.chargerForm.invalid || !station) {
      this.chargerForm.markAllAsTouched();
      return;
    }

    const stationId = station.id;
    const formValue = this.chargerForm.getRawValue();

    if (this.editingChargerId()) {
      this.mutationLoading.set(true);
      this.mutationError.set('');
      this.stationsService
        .updateCharger(stationId, this.editingChargerId()!, {
          type: formValue.type as ChargerType,
          connectorType: formValue.connectorType as ConnectorType,
          powerKW: Number(formValue.powerKW),
          currentRate: formValue.currentRate === null ? undefined : Number(formValue.currentRate),
          status: formValue.status as ChargerStatus,
        })
        .subscribe({
          next: () => {
            this.cancelEdit();
            this.mutationLoading.set(false);
            this.refresh();
          },
          error: (error) => {
            this.mutationLoading.set(false);
            this.mutationError.set(error?.message || 'Failed to update charger');
          }
        });
      return;
    }

    this.mutationLoading.set(true);
    this.mutationError.set('');
    this.stationsService.addCharger(stationId, {
      chargerId: formValue.chargerId!,
      type: formValue.type as ChargerType,
      connectorType: formValue.connectorType as ConnectorType,
      powerKW: Number(formValue.powerKW),
      currentRate: formValue.currentRate === null ? undefined : Number(formValue.currentRate),
      status: formValue.status as ChargerStatus,
    }).subscribe({
      next: () => {
        this.cancelEdit();
        this.mutationLoading.set(false);
        this.refresh();
      },
      error: (error) => {
        this.mutationLoading.set(false);
        this.mutationError.set(error?.message || 'Failed to add charger');
      }
    });
  }

  deleteCharger(chargerId: string): void {
    const station = this.station();
    if (!station) {
      return;
    }
    if (!confirm('Delete this charger?')) {
      return;
    }

    this.mutationLoading.set(true);
    this.mutationError.set('');
    this.stationsService.deleteCharger(station.id, chargerId).subscribe({
      next: () => {
        this.mutationLoading.set(false);
        this.refresh();
      },
      error: (error) => {
        this.mutationLoading.set(false);
        this.mutationError.set(error?.message || 'Failed to delete charger');
      }
    });
  }

  deleteStation(): void {
    const station = this.station();
    if (!station) {
      return;
    }
    if (!confirm('Delete this station?')) {
      return;
    }

    this.mutationLoading.set(true);
    this.mutationError.set('');
    this.stationsService.deleteStation(station.id).subscribe({
      next: () => {
        this.mutationLoading.set(false);
        this.router.navigate(['/stations']);
      },
      error: (error) => {
        this.mutationLoading.set(false);
        this.mutationError.set(error?.message || 'Failed to delete station');
      }
    });
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-700';
      case 'OCCUPIED':
        return 'bg-blue-100 text-blue-700';
      case 'OFFLINE':
        return 'bg-red-100 text-red-700';
      case 'MAINTENANCE':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  showError(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.touched || this.submitted());
  }

}
