import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, DashboardStats, Shift } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  stats: DashboardStats = {
    totalSavings: '0.00',
    totalShifts: '0',
    currentShifts: '0'
  };

  recentShifts: Shift[] = [];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.getDashboardStats().subscribe(stats => this.stats = stats);
    this.api.getShifts().subscribe(shifts => this.recentShifts = shifts);
  }

  createShift() {
    const staffName = this.auth.user()?.name || 'Admin';
    this.api.createShift(staffName).subscribe(() => this.loadData());
  }
}
