import {Routes} from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.navigate(['/login']);
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/layout').then(m => m.Layout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'members',
        loadComponent: () => import('./components/members/members').then(m => m.Members)
      },
      {
        path: 'finance',
        loadComponent: () => import('./components/finance/finance').then(m => m.Finance)
      },
      {
        path: 'hr',
        loadComponent: () => import('./components/hr/hr').then(m => m.HR)
      }
    ]
  }
];
