import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-finance',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-black text-text-main font-display tracking-tight">FINANCIAL REPORTS</h2>
          <p class="text-[10px] text-text-dim font-black uppercase tracking-widest mt-1">Audit Trail • Real-time Monitoring</p>
        </div>
        <div class="flex gap-3">
          <button class="px-5 py-2.5 bg-bg-secondary border border-border rounded-xl text-xs font-bold text-text-main hover:bg-black/20 transition-all uppercase tracking-widest">Export Analysis</button>
          <button class="px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-bold shadow-lg shadow-accent/20 hover:bg-accent/80 transition-all uppercase tracking-widest">Add Ledger Entry</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="qubix-card">
          <h3 class="font-black text-text-main text-sm uppercase tracking-widest mb-6 border-b border-border pb-4">Revenue stream analysis</h3>
          <div class="h-64 bg-bg-primary rounded-2xl flex flex-col items-center justify-center text-text-dim/20 border border-border border-dashed">
            <mat-icon class="text-6xl mb-2">bar_chart</mat-icon>
            <p class="text-[10px] font-black uppercase tracking-widest">Visual data engine ready</p>
          </div>
        </div>
        <div class="qubix-card">
          <h3 class="font-black text-text-main text-sm uppercase tracking-widest mb-6 border-b border-border pb-4">Recent system transactions</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-bg-primary border border-border rounded-2xl hover:bg-black/20 transition-colors cursor-pointer group">
              <div class="flex items-center space-x-4 space-x-reverse">
                <div class="w-10 h-10 rounded-xl bg-green/10 text-green border border-green/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <mat-icon>add_circle</mat-icon>
                </div>
                <div>
                  <p class="font-bold text-text-main text-sm">Membership Renewal</p>
                  <p class="text-[9px] text-text-dim font-black uppercase tracking-widest">Income • System Generated</p>
                </div>
              </div>
              <p class="font-black text-green tracking-tight">+ $150.00</p>
            </div>
            <div class="flex items-center justify-between p-4 bg-bg-primary border border-border rounded-2xl hover:bg-black/20 transition-colors cursor-pointer group">
              <div class="flex items-center space-x-4 space-x-reverse">
                <div class="w-10 h-10 rounded-xl bg-red/10 text-red border border-red/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <mat-icon>remove_circle</mat-icon>
                </div>
                <div>
                  <p class="font-bold text-text-main text-sm">Facility Maintenance</p>
                  <p class="text-[9px] text-text-dim font-black uppercase tracking-widest">Expense • Manual Entry</p>
                </div>
              </div>
              <p class="font-black text-red tracking-tight">- $450.00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Finance {}
