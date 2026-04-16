import { Component, inject, OnInit, OnDestroy, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-bg-primary flex flex-col font-sans overflow-hidden">
      <!-- Full-screen Terminal UI -->
      <div class="flex-1 flex flex-col md:flex-row">
        
        <!-- Left: Scan Area -->
        <div class="w-full md:w-1/2 p-8 flex flex-col">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg">
              <mat-icon class="text-2xl">sensors</mat-icon>
            </div>
            <div>
              <h1 class="text-2xl font-black text-text-main tracking-tight uppercase">Access Terminal</h1>
              <p class="text-[10px] text-text-dim font-bold uppercase tracking-widest">Awaiting digital signature...</p>
            </div>
          </div>

          <div class="flex-1 flex flex-col items-center justify-center relative">
            <div id="reader" class="w-full max-w-md aspect-square rounded-3xl overflow-hidden border-2 border-accent/20 bg-bg-secondary shadow-2xl relative">
              <!-- Overlay for scanner appearance -->
              <div class="absolute inset-0 border-[40px] border-black/40 pointer-events-none z-10"></div>
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-accent animate-pulse z-10"></div>
            </div>
            
            @if (scanning()) {
              <div class="mt-8 flex items-center gap-3 px-6 py-3 bg-accent/10 border border-accent/20 rounded-full text-accent font-black text-xs uppercase tracking-widest animate-bounce">
                <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                Optical Sensor Active
              </div>
            }
          </div>
        </div>

        <!-- Right: Log & Info -->
        <div class="w-full md:w-1/2 bg-bg-secondary border-l border-border p-8 flex flex-col">
          <div class="flex-1 space-y-8 overflow-y-auto pr-4">
            
            <!-- Result Display -->
            @if (lastResult()) {
              <div class="bg-bg-primary border border-border rounded-3xl p-10 text-center animate-in zoom-in duration-500 shadow-2xl">
                <div class="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6"
                   [ngClass]="lastResult()?.type === 'member' ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' : 'bg-accent/10 text-accent border border-accent/20'">
                  <mat-icon class="text-6xl h-auto w-auto">{{ lastResult()?.type === 'member' ? 'person' : 'badge' }}</mat-icon>
                </div>
                
                <h2 class="text-4xl font-black text-text-main uppercase tracking-tighter">{{ lastResult()?.name }}</h2>
                <p class="text-[10px] font-black uppercase tracking-[0.4em] mt-2" 
                   [ngClass]="lastResult()?.type === 'member' ? 'text-cyan-400' : 'text-accent'">
                  {{ lastResult()?.type === 'member' ? 'Gym Member Account' : 'Staff Personnel' }}
                </p>
                
                <div class="mt-10 py-4 px-8 bg-green/10 border border-green/20 rounded-2xl text-green text-xs font-black uppercase tracking-widest inline-block">
                  Signature Verified • Access Granted
                </div>
              </div>
            } @else {
              <div class="h-full flex flex-col items-center justify-center text-center opacity-20 grayscale scale-90">
                <mat-icon class="text-9xl mb-4">qr_code_scanner</mat-icon>
                <p class="text-lg font-black uppercase tracking-widest text-text-main">Scan Terminal Ready</p>
                <p class="text-xs font-medium max-w-xs mt-2">Place Member or Staff QR code within the frame for immediate identification and access recording.</p>
              </div>
            }

            <!-- Recent Activity Mini-log -->
            <div class="space-y-4">
              <h3 class="text-[10px] font-black text-text-dim uppercase tracking-widest opacity-50">Terminal History</h3>
              @for (log of activityLog(); track log.id) {
                <div class="flex items-center justify-between p-4 bg-bg-primary/40 border border-border rounded-2xl animate-in slide-in-from-right-4 duration-300">
                  <div class="flex items-center gap-3">
                    <mat-icon class="text-lg text-text-dim">{{ log.type === 'member' ? 'person' : 'badge' }}</mat-icon>
                    <span class="text-xs font-bold text-text-main">{{ log.name }}</span>
                  </div>
                  <span class="text-[10px] text-text-dim font-mono">{{ log.time | date:'HH:mm:ss' }}</span>
                </div>
              }
            </div>
          </div>

          <div class="mt-8 pt-8 border-t border-border flex items-center justify-between opacity-50">
            <div class="flex items-center gap-2 text-[10px] text-text-dim font-black uppercase tracking-widest">
              <span class="w-1.5 h-1.5 rounded-full bg-green"></span>
              Node Core Online
            </div>
            <div class="text-[9px] text-text-dim font-mono tracking-tighter uppercase">IronCore Security Protocols v12.4.0</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep #reader__dashboard_buttons { display: none !important; }
    :host ::ng-deep #reader__scan_region { border: none !important; }
    :host ::ng-deep video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
  `]
})
export class Attendance implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  scanner: unknown;
  scanning = signal(true);
  lastResult = signal<{ type: string; name: string; code: string; time: Date } | null>(null);
  activityLog = signal<{ id: number; type: string; name: string; code: string; time: Date }[]>([]);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initScanner(), 1000);
    }
  }

  async initScanner() {
    const { Html5QrcodeScanner } = await import('html5-qrcode');
    this.scanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    }, false);

    this.scanner.render((decodedText: string) => {
      this.handleScan(decodedText);
    }, () => {
      // Ignore scan errors
    });
  }

  handleScan(code: string) {
    if (this.lastResult()?.code === code) return;

    this.http.post<any>('/api/attendance/scan', { code }).subscribe({
      next: (res) => {
        this.lastResult.set({ ...res, code, time: new Date() });
        this.activityLog.update(prev => [{ ...res, code, time: new Date(), id: Date.now() }, ...prev].slice(0, 5));
        
        // Reset after 5 seconds to show idle state or allow same scan again eventually
        setTimeout(() => {
          if (this.lastResult()?.code === code) {
            this.lastResult.set(null);
          }
        }, 5000);
      },
      error: () => {
        console.error('Unknown code:', code);
      }
    });
  }

  ngOnDestroy() {
    if (this.scanner) {
      this.scanner.clear();
    }
  }
}
