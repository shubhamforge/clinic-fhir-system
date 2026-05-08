import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'patients',
    pathMatch: 'full',
  },
  {
    path: 'patients',
    loadComponent: () =>
      import(
        './features/patients/patient-roster/patient-roster.component'
      ).then((m) => m.PatientRosterComponent),
  },
  {
    path: 'patients/:id',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
];
