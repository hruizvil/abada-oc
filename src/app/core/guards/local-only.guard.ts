import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export const localOnlyGuard = () => {
  if (!environment.production) return true;
  return inject(Router).createUrlTree(['']);
};
