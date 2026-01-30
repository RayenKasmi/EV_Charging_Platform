import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';
import { AuthLayoutComponent } from '../../shared/layouts/auth-layout.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard], // Prevent authenticated users from accessing auth pages
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./login/login').then(m => m.Login)
      },
      {
        path: 'register',
        loadComponent: () => import('./register/register').then(m => m.Register)
      }
    ]
  }
];