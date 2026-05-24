import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PatientSelectService } from '../services/patient-select.service';

export const patientSelectedGuard: CanActivateFn = () => {
  const svc = inject(PatientSelectService);
  if (svc.selectedId()) return true;
  return inject(Router).createUrlTree(['/select']);
};
