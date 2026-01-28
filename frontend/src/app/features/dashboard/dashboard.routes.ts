import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./pages/overview.component').then((m) => m.OverviewComponent),
      },
      {
        path: 'stations',
        loadChildren: () =>
          import('../stations/stations.routes').then((m) => m.STATIONS_ROUTES),
      },
      {
        path: 'reservations',
        loadChildren: () =>
          import('../reservations/reservations.routes').then(
            (m) => m.RESERVATIONS_ROUTES
          ),
      },
      {
        path: 'sessions',
        loadChildren: () =>
          import('../sessions/sessions.routes').then((m) => m.SESSIONS_ROUTES),
      },
      {
        path: 'pricing',
        loadChildren: () =>
          import('../pricing/pricing.routes').then((m) => m.PRICING_ROUTES),
      },
      {
        path: 'queue',
        loadChildren: () =>
          import('../queue/queue.routes').then((m) => m.QUEUE_ROUTES),
      },
      {
        path: 'analytics',
        loadChildren: () =>
          import('../analytics/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
];
