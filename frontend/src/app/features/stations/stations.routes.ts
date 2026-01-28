import { Routes } from '@angular/router';

export const STATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/station-list.component').then((m) => m.StationListComponent),
  },
];
