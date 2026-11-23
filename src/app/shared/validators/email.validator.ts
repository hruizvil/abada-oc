import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

/** Validators.email accepts dotless domains (a@b, name@gmailcom); a reachable inbox needs a TLD after the last dot. */
export function strictEmail(control: AbstractControl): ValidationErrors | null {
  const base = Validators.email(control);
  if (base) return base;
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return /@[^@\s]+\.[a-z]{2,}$/i.test(value) ? null : { email: true };
}
