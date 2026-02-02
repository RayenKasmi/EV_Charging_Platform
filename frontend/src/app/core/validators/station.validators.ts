import { AbstractControl, AsyncValidatorFn, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const noWhitespaceValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value : '';
  if (!value.trim()) {
    return { whitespace: true };
  }
  return null;
};

export function minFormArrayLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) {
      return null;
    }
    return control.length >= min ? null : { minLengthArray: { required: min, actual: control.length } };
  };
}

export const uniqueChargerIds: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!(control instanceof FormArray)) {
    return null;
  }

  const ids = control.controls
    .map(group => group.get('chargerId')?.value)
    .filter(value => typeof value === 'string')
    .map(value => value.trim().toLowerCase());

  const duplicates = ids.filter((value, index) => ids.indexOf(value) !== index);
  return duplicates.length ? { duplicateChargerId: true } : null;
};

export function chargerIdUniqueAsyncValidator(
  checkFn: (chargerId: string) => Observable<{ available: boolean }>
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';
    if (!value) {
      return of(null);
    }

    if (control.errors?.['duplicateChargerId']) {
      return of(null);
    }

    return checkFn(value).pipe(
      map(result => (result.available ? null : { chargerIdTaken: true })),
      catchError(() => of(null)) //on error, just consider it valid
    );
  };
}
