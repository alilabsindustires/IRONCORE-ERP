import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-hr',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-black text-text-main font-display tracking-tight uppercase">HR & PAYROLL</h2>
          <p class="text-[10px] text-text-dim font-black uppercase tracking-widest mt-1">Staff Management • 2 Active Personnel</p>
        </div>
        <button class="bg-accent text-white px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-accent/80 transition-all font-bold shadow-lg shadow-accent/20 text-xs uppercase tracking-widest">
          <mat-icon>person_add</mat-icon>
          <span>Onboard Staff</span>
        </button>
      </div>

      <div class="qubix-card overflow-hidden !p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-black/20 border-b border-border">
                <th class="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest">Employee Name</th>
                <th class="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest">System Role</th>
                <th class="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest">Compensation</th>
                <th class="px-6 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest">Current Status</th>
                <th class="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/50">
              <tr class="hover:bg-white/2 transition-colors group">
                <td class="px-6 py-4 font-bold text-text-main">Ali Ahmed</td>
                <td class="px-6 py-4 text-xs font-medium text-text-dim">Super Admin</td>
                <td class="px-6 py-4 font-black text-text-main font-mono tracking-tight">$2,500.00</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-green/10 text-green border border-green/20">ACTIVE</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="text-text-dim/20 hover:text-text-main transition-colors"><mat-icon>more_vert</mat-icon></button>
                </td>
              </tr>
              <tr class="hover:bg-white/2 transition-colors group">
                <td class="px-6 py-4 font-bold text-text-main">Sarah Khaled</td>
                <td class="px-6 py-4 text-xs font-medium text-text-dim">Head Coach</td>
                <td class="px-6 py-4 font-black text-text-main font-mono tracking-tight">$1,800.00</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-green/10 text-green border border-green/20">ACTIVE</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="text-text-dim/20 hover:text-text-main transition-colors"><mat-icon>more_vert</mat-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class HR {}
