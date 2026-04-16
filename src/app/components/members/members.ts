import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Member, MembershipType } from '../../services/api';

@Component({
  selector: 'app-members',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './members.html'
})
export class Members implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  members: Member[] = [];
  plans: MembershipType[] = [];
  showAddModal = false;

  memberForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    membership_type_id: [null as number | null, Validators.required],
    expiry_date: ['', Validators.required]
  });

  ngOnInit() {
    this.loadMembers();
    this.loadPlans();
  }

  loadMembers() {
    this.api.getMembers().subscribe(res => this.members = res);
  }

  loadPlans() {
    this.api.getMembershipTypes().subscribe(res => {
      this.plans = res;
      if (res.length > 0 && !this.memberForm.value.membership_type_id) {
        this.memberForm.patchValue({ membership_type_id: res[0].id });
      }
    });
  }

  onSubmit() {
    if (this.memberForm.valid) {
      const formVal = this.memberForm.value;
      const member: Partial<Member> = {
        name: formVal.name as string,
        email: formVal.email as string,
        phone: formVal.phone as string,
        membership_type_id: formVal.membership_type_id as number,
        expiry_date: formVal.expiry_date as string,
        qr_code_uid: Math.random().toString(36).substring(2, 12).toUpperCase(),
        status: 'active'
      };

      this.api.createMember(member).subscribe(() => {
        this.loadMembers();
        this.showAddModal = false;
        this.memberForm.reset({ membership_type_id: 1 });
      });
    }
  }
}
