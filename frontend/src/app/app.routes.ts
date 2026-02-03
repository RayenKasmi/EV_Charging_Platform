import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'stations',
        loadChildren: () => import('./features/stations/stations.routes').then(m => m.STATION_ROUTES),
        data: { preload: true }
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/reservations/reservations.component').then(m => m.ReservationsComponent)
      },
      {
        path: 'active-session',
        loadComponent: () => import('./features/active-session/active-session.component').then(m => m.ActiveSessionComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];