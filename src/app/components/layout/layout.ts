import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './layout.html'
})
export class Layout {
  auth = inject(AuthService);

  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', arabic: 'لوحة التحكم' },
    { path: '/members', label: 'Members', icon: 'people', arabic: 'الأعضاء' },
    { path: '/finance', label: 'Finance', icon: 'payments', arabic: 'المالية' },
    { path: '/hr', label: 'HR & Payroll', icon: 'badge', arabic: 'الموارد البشرية' },
    { path: '/settings', label: 'Settings', icon: 'settings', arabic: 'الإعدادات' },
  ];
}
