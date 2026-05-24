import { Route } from '@angular/router';
import { patientSelectedGuard } from './shared/guards/patient-selected.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'select',
    loadComponent: () =>
      import('./features/patient-select/patient-select.component').then(
        (m) => m.PatientSelectComponent,
      ),
  },
  {
    path: 'home',
    canActivate: [patientSelectedGuard],
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'vitals',
    canActivate: [patientSelectedGuard],
    loadComponent: () =>
      import('./features/vitals/vitals.component').then(
        (m) => m.VitalsComponent,
      ),
  },
  {
    path: 'vitals/record',
    canActivate: [patientSelectedGuard],
    loadComponent: () =>
      import('./features/vitals/record-vitals/record-vitals.component').then(
        (m) => m.RecordVitalsComponent,
      ),
  },
  {
    path: 'messages',
    canActivate: [patientSelectedGuard],
    loadComponent: () =>
      import('./features/messages/messages.component').then(
        (m) => m.MessagesComponent,
      ),
  },
  {
    path: 'profile',
    canActivate: [patientSelectedGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
  },
];
