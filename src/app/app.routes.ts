import {Routes, CanActivateFn} from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.navigate(['/login']);
};

const setupGuard: CanActivateFn = () => {
  const http = inject(HttpClient);
  const router = inject(Router);
  return http.get<{setupComplete: boolean}>('/api/setup/status').pipe(
    map(res => {
      if (!res.setupComplete) return router.parseUrl('/setup');
      return true;
    }),
    catchError(() => of(true))
  );
};

export const routes: Routes = [
  {
    path: 'setup',
    loadComponent: () => import('./components/setup/setup').then(m => m.Setup)
  },
  {
    path: 'attendance',
    loadComponent: () => import('./components/attendance/attendance').then(m => m.Attendance),
    canActivate: [setupGuard]
  },
  {
    path: 'login',
    canActivate: [setupGuard],
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: '',
    canActivate: [authGuard, setupGuard],
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
        path: 'memberships',
        loadComponent: () => import('./components/membership-plans/membership-plans').then(m => m.MembershipPlans)
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
