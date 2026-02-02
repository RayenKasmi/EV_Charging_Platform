import { Routes } from '@angular/router';

export const STATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./station-list/station-list').then(m => m.StationList)
  },
  {
    path: 'new',
    loadComponent: () => import('./station-form/station-form').then(m => m.StationForm)
  },
  {
    path: ':id',
    loadComponent: () => import('./station-detail/station-detail').then(m => m.StationDetail)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./station-form/station-form').then(m => m.StationForm)
  }
];
