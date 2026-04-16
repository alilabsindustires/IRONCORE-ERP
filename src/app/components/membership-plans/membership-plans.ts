import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, MembershipType } from '../../services/api';

@Component({
  selector: 'app-membership-plans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="p-8 font-sans animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex items-center justify-between mb-10">
        <div>
          <h1 class="text-3xl font-black text-text-main font-display tracking-tight uppercase">Membership <span class="text-accent">Plans</span></h1>
          <p class="text-text-dim text-sm mt-1">Configure your product tiers and benefits</p>
        </div>
        <button (click)="showAddModal = true" class="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/80 transition-all">
          <mat-icon class="text-lg">add</mat-icon>
          Create New Plan
        </button>
      </div>

      <!-- Plans Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        @for (plan of plans(); track plan.id) {
          <div class="bg-bg-secondary border border-border rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-accent/40 transition-all">
            <!-- Decoration -->
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-all"></div>
            
            <div class="flex items-start justify-between mb-6">
              <div class="w-14 h-14 bg-bg-primary border border-border rounded-2xl flex items-center justify-center text-accent shadow-inner">
                <mat-icon class="text-3xl h-auto w-auto">workspace_premium</mat-icon>
              </div>
              <div class="flex gap-2">
                <button (click)="editPlan(plan)" class="w-8 h-8 rounded-lg bg-bg-primary border border-border flex items-center justify-center text-text-dim hover:text-accent transition-colors">
                  <mat-icon class="text-sm">edit</mat-icon>
                </button>
                <button (click)="deletePlan(plan.id!)" class="w-8 h-8 rounded-lg bg-bg-primary border border-border flex items-center justify-center text-text-dim hover:text-red transition-colors">
                  <mat-icon class="text-sm">delete</mat-icon>
                </button>
              </div>
            </div>

            <h3 class="text-2xl font-black text-text-main uppercase tracking-tight mb-2">{{ plan.name }}</h3>
            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-4xl font-black text-accent">{{ plan.price | currency:'USD' }}</span>
              <span class="text-text-dim text-xs font-bold uppercase tracking-widest">/ {{ plan.duration_days }} Days</span>
            </div>

            <!-- Features -->
            <div class="flex-1 space-y-4 mb-8">
              <div class="flex items-center gap-3 text-xs font-bold text-text-main uppercase tracking-widest">
                <mat-icon class="text-green text-sm">check_circle</mat-icon>
                {{ plan.freeze_days_allowed }} Freeze Days
              </div>
              <div class="p-4 bg-bg-primary/50 rounded-2xl border border-border/50">
                <p class="text-[10px] font-bold text-text-dim uppercase mb-2 tracking-widest">Included Benefits</p>
                <p class="text-xs text-text-main/80 leading-relaxed font-medium">{{ plan.benefits || 'No additional benefits listed.' }}</p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Add/Edit Modal -->
      @if (showAddModal) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div class="bg-bg-secondary w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div class="bg-black/20 p-8 border-b border-border flex items-center justify-between">
              <h2 class="text-xl font-black text-text-main uppercase tracking-tight">
                {{ editingId ? 'Edit Membership Plan' : 'New Membership Plan' }}
              </h2>
              <button (click)="closeModal()" class="text-text-dim hover:text-text-main transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <form [formGroup]="planForm" (ngSubmit)="onSubmit()" class="p-8 space-y-6">
              <div class="space-y-2">
                <label for="p-name" class="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Plan Name</label>
                <input id="p-name" formControlName="name" placeholder="Gold Membership" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label for="p-price" class="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Price ($)</label>
                  <input id="p-price" formControlName="price" type="number" placeholder="49.99" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
                <div class="space-y-2">
                  <label for="p-duration" class="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Duration (Days)</label>
                  <input id="p-duration" formControlName="duration_days" type="number" placeholder="30" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
                </div>
              </div>

              <div class="space-y-2">
                <label for="p-freeze" class="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Freeze Days Allowed</label>
                <input id="p-freeze" formControlName="freeze_days_allowed" type="number" placeholder="5" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all">
              </div>

              <div class="space-y-2">
                <label for="p-benefits" class="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Benefits (Comma separated)</label>
                <textarea id="p-benefits" formControlName="benefits" rows="3" placeholder="Pool Access, Free Towels, 2 Guest Passes" class="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-main outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"></textarea>
              </div>

              <button type="submit" [disabled]="planForm.invalid" class="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:bg-accent/80 transition-all uppercase tracking-widest text-sm">
                {{ editingId ? 'Update Plan' : 'Create Plan' }}
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class MembershipPlans implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  plans = signal<MembershipType[]>([]);
  showAddModal = false;
  editingId: number | null = null;

  planForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    duration_days: [30, [Validators.required, Validators.min(1)]],
    freeze_days_allowed: [0, [Validators.required, Validators.min(0)]],
    benefits: ['']
  });

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.api.getMembershipTypes().subscribe(res => this.plans.set(res));
  }

  editPlan(plan: MembershipType) {
    this.editingId = plan.id!;
    this.planForm.patchValue(plan);
    this.showAddModal = true;
  }

  deletePlan(id: number) {
    if (confirm('Are you sure you want to delete this plan?')) {
      this.api.deleteMembershipType(id).subscribe(() => this.loadPlans());
    }
  }

  onSubmit() {
    if (this.planForm.valid) {
      const val = this.planForm.value as MembershipType;
      if (this.editingId) {
        this.api.updateMembershipType(this.editingId, val).subscribe(() => {
          this.loadPlans();
          this.closeModal();
        });
      } else {
        this.api.createMembershipType(val).subscribe(() => {
          this.loadPlans();
          this.closeModal();
        });
      }
    }
  }

  closeModal() {
    this.showAddModal = false;
    this.editingId = null;
    this.planForm.reset({ duration_days: 30, freeze_days_allowed: 0 });
  }
}
