import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  user = signal<User | null>(null);
  token = signal<string | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('qubix_user');
      const savedToken = localStorage.getItem('qubix_token');
      if (savedUser && savedToken) {
        try {
          this.user.set(JSON.parse(savedUser));
          this.token.set(savedToken);
        } catch {
          this.logout();
        }
      }
    }
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(res => {
        this.user.set(res.user);
        this.token.set(res.token);
        localStorage.setItem('qubix_user', JSON.stringify(res.user));
        localStorage.setItem('qubix_token', res.token);
      })
    );
  }

  logout() {
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('qubix_user');
    localStorage.removeItem('qubix_token');
    this.router.navigate(['/login']);
  }

  isAuthenticated() {
    return !!this.token();
  }
}
