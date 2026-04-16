import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-bg-primary flex items-center justify-center p-6 font-sans">
      <div class="w-full max-w-xl bg-bg-secondary border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-700">
        
        <!-- Header -->
        <div class="bg-black/20 p-10 border-b border-border text-center">
          <div class="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center text-accent mx-auto mb-6 border border-accent/20">
            <mat-icon class="text-5xl h-auto w-auto">settings</mat-icon>
          </div>
          <h1 class="text-3xl font-black text-text-main font-display tracking-tight uppercase">Installation <span class="text-accent">Wizard</span></h1>
          <p class="text-text-dim text-sm mt-2">Initialize your IronCore ERP instance</p>
        </div>

        <div class="p-10">
          @if (step() === 1) {
            <!-- Step 1: Database -->
            <form [formGroup]="dbForm" (ngSubmit)="testDb()" class="space-y-6">
              <div class="grid grid-cols-2 gap-6">
                <div class="col-span-2 space-y-2">
                  <label for="db-host" class="text-[10px] font-black text-text-dim uppercase tracking-widest">Database Host</label>
                  <input id="db-host" formControlName="host" placeholder="localhost" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
                <div class="space-y-2">
                  <label for="db-user" class="text-[10px] font-black text-text-dim uppercase tracking-widest">Postgres User</label>
                  <input id="db-user" formControlName="user" placeholder="postgres" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
                <div class="space-y-2">
                  <label for="db-pass" class="text-[10px] font-black text-text-dim uppercase tracking-widest">Password</label>
                  <input id="db-pass" formControlName="password" type="password" placeholder="••••••••" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
                <div class="space-y-2">
                  <label for="db-name" class="text-[10px] font-black text-text-dim uppercase tracking-widest">Database Name</label>
                  <input id="db-name" formControlName="database" placeholder="qubix_erp" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
                <div class="space-y-2">
                  <label for="db-port" class="text-[10px] font-black text-text-dim uppercase tracking-widest">Port</label>
                  <input id="db-port" formControlName="port" placeholder="5432" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
              </div>

              @if (error()) {
                <div class="p-4 bg-red/10 text-red border border-red/20 rounded-2xl text-xs font-bold">{{ error() }}</div>
              }

              <button type="submit" [disabled]="dbForm.invalid || loading()" class="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:bg-accent/80 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                @if (loading()) { <div class="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div> }
                <span>Test & Initialize DB</span>
              </button>
            </form>
          }

          @if (step() === 2) {
            <!-- Step 2: Admin Account -->
            <form [formGroup]="adminForm" (ngSubmit)="createAdmin()" class="space-y-6">
              <div class="space-y-4">
                <div class="space-y-2">
                  <label for="adm-name" class="text-[10px] font-black text-text-dim uppercase tracking-widest">Super Admin Name</label>
                  <input id="adm-name" formControlName="name" placeholder="John Doe" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
                <div class="space-y-2">
                  <label for="adm-email" class="text-[10px] font-black text-text-dim uppercase tracking-widest">Email Address</label>
                  <input id="adm-email" formControlName="email" type="email" placeholder="admin@gym.com" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
                <div class="space-y-2">
                  <label for="adm-pass" class="text-[10px] font-black text-text-dim uppercase tracking-widest">Admin Password</label>
                  <input id="adm-pass" formControlName="password" type="password" placeholder="••••••••" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
              </div>

              @if (error()) {
                <div class="p-4 bg-red/10 text-red border border-red/20 rounded-2xl text-xs font-bold">{{ error() }}</div>
              }

              <button type="submit" [disabled]="adminForm.invalid || loading()" class="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:bg-accent/80 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                @if (loading()) { <div class="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div> }
                <span>Finalize Setup</span>
              </button>
            </form>
          }

          @if (step() === 3) {
            <!-- Step 3: Success -->
            <div class="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8">
              <div class="w-24 h-24 bg-green/10 rounded-full flex items-center justify-center text-green mx-auto border border-green/20">
                <mat-icon class="text-6xl h-auto w-auto">check_circle</mat-icon>
              </div>
              <div>
                <h2 class="text-2xl font-black text-text-main">SETUP COMPLETE</h2>
                <p class="text-text-dim mt-2">The system is now fully initialized and ready for deployment.</p>
              </div>
              <button (click)="goToLogin()" class="w-full py-5 bg-white text-black font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02] uppercase tracking-widest text-sm">
                Launch Application
              </button>
            </div>
          }
        </div>

        <div class="bg-black/20 p-6 text-center">
          <p class="text-[9px] font-bold text-text-dim uppercase tracking-[0.3em]">IronCore ERP v1.0 • Enterprise Edition</p>
        </div>
      </div>
    </div>
  `
})
export class Setup {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  step = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

  dbForm = this.fb.group({
    host: ['localhost', Validators.required],
    user: ['postgres', Validators.required],
    password: ['alikhaled010', Validators.required],
    database: ['qubix_erp', Validators.required],
    port: [5432, Validators.required]
  });

  adminForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  testDb() {
    this.loading.set(true);
    this.error.set(null);
    this.http.post<void>('/api/setup/db', this.dbForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(2);
      },
      error: (err: { error: { error: string } }) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Connection failed');
      }
    });
  }

  createAdmin() {
    this.loading.set(true);
    this.error.set(null);
    this.http.post<void>('/api/setup/admin', this.adminForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(3);
      },
      error: (err: { error: { error: string } }) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Failed to create account');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
