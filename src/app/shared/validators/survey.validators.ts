import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Erlaubt leere Werte (für optionale Felder),
 * lehnt aber reine Leerzeichen ab.
 */
export function noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  return value.trim().length > 0 ? null : { whitespace: true };
}

/** Deadline muss in der Zukunft liegen. */
export function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  return new Date(value) > new Date() ? null : { pastDate: true };
}
