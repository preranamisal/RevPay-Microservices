import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth.service';
import { UserApiService } from '../../core/services/api.services';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Profile</h1>
      <div class="profile-grid">
        <div class="profile-card">
          <div class="avatar-large">{{ initials() }}</div>
          <div class="profile-name">{{ user()?.firstName }} {{ user()?.lastName }}</div>
          <div class="profile-email">{{ user()?.email }}</div>
          <div class="profile-role-badge">{{ user()?.role }}</div>
          <div class="profile-meta">
            <div class="meta-row"><span>Status</span><span class="status-active">{{ user()?.status }}</span></div>
            <div class="meta-row"><span>KYC</span><span [class]="user()?.kycCompleted ? 'status-active' : 'status-pending'">{{ user()?.kycCompleted ? 'Completed' : 'Pending' }}</span></div>
            <div class="meta-row"><span>Member Since</span><span>{{ user()?.createdAt | date:'MMM yyyy' }}</span></div>
          </div>
          <button class="kyc-btn" *ngIf="!user()?.kycCompleted" (click)="completeKyc()">Complete KYC</button>
        </div>
        <div class="forms-col">
          <div class="panel">
            <h3>Edit Profile</h3>
            <div class="success-msg" *ngIf="profileSuccess()">&#10003; {{ profileSuccess() }}</div>
            <div class="field-row">
              <div class="field-group">
                <label>First Name</label>
                <input type="text" [(ngModel)]="profileForm.firstName" class="field-input">
              </div>
              <div class="field-group">
                <label>Last Name</label>
                <input type="text" [(ngModel)]="profileForm.lastName" class="field-input">
              </div>
            </div>
            <div class="field-group">
              <label>Phone Number</label>
              <input type="tel" [(ngModel)]="profileForm.phone" class="field-input">
            </div>
            <button class="submit-btn" (click)="updateProfile()" [disabled]="profileLoading()">
              {{ profileLoading() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
          <div class="panel">
            <h3>Change Password</h3>
            <div class="success-msg" *ngIf="pwSuccess()">&#10003; {{ pwSuccess() }}</div>
            <div class="error-msg" *ngIf="pwError()">&#9888; {{ pwError() }}</div>
            <div class="field-group">
              <label>Current Password</label>
              <input type="password" [(ngModel)]="pwForm.currentPassword" class="field-input" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;">
            </div>
            <div class="field-group">
              <label>New Password</label>
              <input type="password" [(ngModel)]="pwForm.newPassword" class="field-input" placeholder="Min. 8 characters">
            </div>
            <div class="field-group">
              <label>Confirm New Password</label>
              <input type="password" [(ngModel)]="pwForm.confirmPassword" class="field-input">
            </div>
            <button class="submit-btn" (click)="changePassword()" [disabled]="pwLoading()">
              {{ pwLoading() ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
          <div class="panel">
            <h3>Transaction PIN</h3>
            <div class="success-msg" *ngIf="pinSuccess()">&#10003; {{ pinSuccess() }}</div>
            <div class="field-group">
              <label>Set 4-digit PIN</label>
              <input type="password" [(ngModel)]="pin" class="field-input" placeholder="&#8226;&#8226;&#8226;&#8226;" maxlength="6">
            </div>
            <button class="submit-btn" (click)="setPin()" [disabled]="pinLoading() || !pin || pin.length < 4">
              {{ pinLoading() ? 'Setting...' : 'Set PIN' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:32px;max-width:1100px;font-family:'Segoe UI',system-ui,sans-serif}
    .page-title{font-size:1.75rem;font-weight:800;color:#fff;margin-bottom:24px}
    .profile-grid{display:grid;grid-template-columns:280px 1fr;gap:20px;align-items:start}
    .profile-card{background:#16161f;border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:28px;text-align:center}
    .avatar-large{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#6C63FF,#9B5DE5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.75rem;font-weight:800;margin:0 auto 16px}
    .profile-name{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:4px}
    .profile-email{color:rgba(255,255,255,.4);font-size:.85rem;margin-bottom:12px}
    .profile-role-badge{display:inline-block;background:rgba(108,99,255,.15);color:#6C63FF;padding:4px 12px;border-radius:20px;font-size:.75rem;font-weight:700;margin-bottom:20px}
    .profile-meta{text-align:left;border-top:1px solid rgba(255,255,255,.06);padding-top:16px}
    .meta-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:.85rem;color:rgba(255,255,255,.4)}
    .meta-row span:last-child{color:rgba(255,255,255,.7)}
    .status-active{color:#2ed573 !important}
    .status-pending{color:#FFA502 !important}
    .kyc-btn{margin-top:16px;width:100%;background:rgba(46,213,115,.1);border:1px solid rgba(46,213,115,.3);color:#2ed573;border-radius:8px;padding:10px;font-size:.875rem;font-weight:600;cursor:pointer}
    .forms-col{display:flex;flex-direction:column;gap:16px}
    .panel{background:#16161f;border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:24px}
    .panel h3{font-size:1rem;font-weight:700;color:#fff;margin-bottom:16px}
    .success-msg{background:rgba(46,213,115,.1);border:1px solid rgba(46,213,115,.3);color:#2ed573;padding:10px 14px;border-radius:8px;font-size:.875rem;margin-bottom:16px}
    .error-msg{background:rgba(255,71,87,.1);border:1px solid rgba(255,71,87,.3);color:#FF4757;padding:10px 14px;border-radius:8px;font-size:.875rem;margin-bottom:16px}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .field-group{margin-bottom:14px}
    .field-group label{display:block;color:rgba(255,255,255,.55);font-size:.83rem;margin-bottom:6px}
    .field-input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:11px 14px;color:#fff;font-size:.9rem;outline:none;transition:border-color .2s}
    .field-input:focus{border-color:#6C63FF}
    .submit-btn{background:#6C63FF;color:#fff;border:none;border-radius:10px;padding:11px 24px;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s}
    .submit-btn:hover:not(:disabled){background:#5a52e8}
    .submit-btn:disabled{opacity:.5;cursor:not-allowed}
    @media(max-width:800px){.profile-grid{grid-template-columns:1fr}}
  `]
})
export class ProfileComponent implements OnInit {
  user = signal<User | null>(null);
  profileLoading = signal(false);
  pwLoading = signal(false);
  pinLoading = signal(false);
  profileSuccess = signal('');
  pwSuccess = signal('');
  pwError = signal('');
  pinSuccess = signal('');
  pin = '';
  profileForm: any = { firstName: '', lastName: '', phone: '' };
  pwForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

  constructor(private authService: AuthService, private userApi: UserApiService) {}

  ngOnInit(): void {
    const u = this.authService.currentUser;
    if (u) { this.user.set(u); this.profileForm = { firstName: u.firstName, lastName: u.lastName, phone: u.phone || '' }; }
  }

  initials(): string {
    const u = this.user();
    if (!u) return 'U';
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }

  updateProfile(): void {
    this.profileLoading.set(true);
    this.userApi.updateProfile(this.authService.currentUser!.id, this.profileForm).subscribe({
      next: (u: any) => { this.profileLoading.set(false); this.user.set(u); this.authService.updateCurrentUser(u); this.profileSuccess.set('Profile updated!'); setTimeout(() => this.profileSuccess.set(''), 3000); },
      error: () => { this.profileLoading.set(false); }
    });
  }

  changePassword(): void {
    this.pwLoading.set(true); this.pwError.set(''); this.pwSuccess.set('');
    this.userApi.changePassword(this.authService.currentUser!.id, { currentPassword: this.pwForm.currentPassword, newPassword: this.pwForm.newPassword }).subscribe({
      next: () => { this.pwLoading.set(false); this.pwSuccess.set('Password changed!'); this.pwForm = { currentPassword: '', newPassword: '', confirmPassword: '' }; },
      error: (e: any) => { this.pwLoading.set(false); this.pwError.set(e.error?.message || 'Failed'); }
    });
  }

  setPin(): void {
    this.pinLoading.set(true);
    this.userApi.setPin(this.authService.currentUser!.id, this.pin).subscribe({
      next: () => { this.pinLoading.set(false); this.pinSuccess.set('PIN set successfully!'); this.pin = ''; },
      error: () => { this.pinLoading.set(false); }
    });
  }

  completeKyc(): void {
    this.userApi.completeKyc(this.authService.currentUser!.id).subscribe({
      next: () => { const u = { ...this.user()!, kycCompleted: true }; this.user.set(u); this.authService.updateCurrentUser(u); },
      error: () => {}
    });
  }
}
