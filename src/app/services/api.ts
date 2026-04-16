import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';

export interface DashboardStats {
  totalSavings: string;
  totalShifts: string;
  currentShifts: string;
}

export interface Shift {
  id: number;
  staff_name: string;
  start_time: string;
  end_time: string | null;
  status: string;
}

export interface Member {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  membership_type_id: number;
  qr_code_uid: string;
  status: string;
  expiry_date: string;
  membership_name?: string;
}

export interface MembershipType {
  id?: number;
  name: string;
  price: number;
  duration_days: number;
  freeze_days_allowed: number;
  benefits?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private get headers() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.token()}`
    });
  }

  getDashboardStats() {
    return this.http.get<DashboardStats>('/api/dashboard/stats', { headers: this.headers });
  }

  getShifts() {
    return this.http.get<Shift[]>('/api/shifts', { headers: this.headers });
  }

  createShift(staffName: string) {
    return this.http.post<Shift>('/api/shifts', { staffName }, { headers: this.headers });
  }

  getMembers() {
    return this.http.get<Member[]>('/api/members', { headers: this.headers });
  }

  createMember(member: Partial<Member>) {
    return this.http.post<Member>('/api/members', member, { headers: this.headers });
  }

  getMembershipTypes() {
    return this.http.get<MembershipType[]>('/api/membership-types', { headers: this.headers });
  }

  createMembershipType(type: MembershipType) {
    return this.http.post<MembershipType>('/api/membership-types', type, { headers: this.headers });
  }

  updateMembershipType(id: number, type: MembershipType) {
    return this.http.put<MembershipType>(`/api/membership-types/${id}`, type, { headers: this.headers });
  }

  deleteMembershipType(id: number) {
    return this.http.delete(`/api/membership-types/${id}`, { headers: this.headers });
  }
}
