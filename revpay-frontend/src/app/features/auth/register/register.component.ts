import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WalletService } from '../../../core/services/api.services';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-shell">
      <div class="form-container">
        <div class="brand-row">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#6C63FF"/>
            <path d="M10 16h12M16 10l6 6-6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="brand-name">RevPay</span>
        </div>

        <h2>Create your account</h2>
        <p class="subtitle">Join thousands of users managing money smartly</p>

        <!-- Role selector -->
        <div class="role-tabs">
          <button class="role-tab" [class.active]="role === 'PERSONAL'" (click)="role='PERSONAL'">
            <span>👤</span> Personal
          </button>
          <button class="role-tab" [class.active]="role === 'BUSINESS'" (click)="role='BUSINESS'">
            <span>🏢</span> Business
          </button>
        </div>

        <div class="error-msg" *ngIf="errorMsg()">⚠ {{ errorMsg() }}</div>

        <form (ngSubmit)="onSubmit()">
          <div class="field-row">
            <div class="field-group">
              <label>First Name</label>
              <input type="text" [(ngModel)]="firstName" name="firstName" placeholder="John" required class="field-input">
            </div>
            <div class="field-group">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="lastName" name="lastName" placeholder="Doe" required class="field-input">
            </div>
          </div>

          <div class="field-group">
            <label>Email address</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required class="field-input">
          </div>

          <div class="field-group">
            <label>Phone number</label>
            <input type="tel" [(ngModel)]="phone" name="phone" placeholder="+91 98765 43210" class="field-input">
          </div>

          <ng-container *ngIf="role === 'BUSINESS'">
            <div class="field-group">
              <label>Business Name</label>
              <input type="text" [(ngModel)]="businessName" name="businessName" placeholder="Acme Corp" required class="field-input">
            </div>
            <div class="field-row">
              <div class="field-group">
                <label>Business Type</label>
                <select [(ngModel)]="businessType" name="businessType" class="field-input">
                  <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="PRIVATE_LIMITED">Private Limited</option>
                  <option value="PUBLIC_LIMITED">Public Limited</option>
                  <option value="LLP">LLP</option>
                </select>
              </div>
              <div class="field-group">
                <label>GST Number</label>
                <input type="text" [(ngModel)]="gstNumber" name="gstNumber" placeholder="22AAAAA0000A1Z5" class="field-input">
              </div>
            </div>
          </ng-container>

          <div class="field-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="Min. 8 characters" required minlength="8" class="field-input">
          </div>

          <div class="field-group">
            <label>Confirm Password</label>
            <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Repeat password" required class="field-input">
            <span class="field-err" *ngIf="confirmPassword && password !== confirmPassword">Passwords do not match</span>
          </div>

          <div class="terms-row">
            <label>
              <input type="checkbox" [(ngModel)]="termsAccepted" name="terms">
              I agree to RevPay's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </label>
          </div>

          <button type="submit" class="submit-btn" [disabled]="loading() || !termsAccepted || password !== confirmPassword">
            <span *ngIf="!loading()">Create Account →</span>
            <span *ngIf="loading()" class="spinner"></span>
          </button>
        </form>

        <p class="form-footer">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .register-shell {
      min-height: 100vh;
      background: #0f0f17;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
    .form-container {
      width: 100%; max-width: 520px;
      background: #16161f;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 40px;
    }
    .brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    .brand-name { font-size: 1.3rem; font-weight: 800; color: #fff; }
    h2 { font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 6px; }
    .subtitle { color: rgba(255,255,255,0.4); font-size: 0.9rem; margin-bottom: 24px; }

    .role-tabs { display: flex; gap: 10px; margin-bottom: 24px; }
    .role-tab {
      flex: 1; padding: 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: rgba(255,255,255,0.5);
      font-size: 0.9rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all 0.2s;
    }
    .role-tab.active {
      background: rgba(108,99,255,0.15);
      border-color: rgba(108,99,255,0.5);
      color: #fff;
    }
    .error-msg {
      background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.3);
      color: #FF4757; padding: 10px 14px; border-radius: 8px;
      font-size: 0.875rem; margin-bottom: 16px;
    }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field-group { margin-bottom: 16px; }
    .field-group label { display: block; color: rgba(255,255,255,0.55); font-size: 0.83rem; margin-bottom: 6px; font-weight: 500; }
    .field-input {
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 11px 14px;
      color: #fff; font-size: 0.9rem; outline: none;
      transition: border-color 0.2s;
    }
    .field-input::placeholder { color: rgba(255,255,255,0.2); }
    .field-input:focus { border-color: #6C63FF; }
    select.field-input option { background: #16161f; }
    .field-err { color: #FF4757; font-size: 0.78rem; margin-top: 4px; display: block; }
    .terms-row { margin: 16px 0 20px; }
    .terms-row label { color: rgba(255,255,255,0.45); font-size: 0.83rem; display: flex; align-items: flex-start; gap: 8px; cursor: pointer; }
    .terms-row input { accent-color: #6C63FF; margin-top: 2px; }
    .terms-row a { color: #6C63FF; text-decoration: none; }
    .submit-btn {
      width: 100%; background: #6C63FF; color: #fff;
      border: none; border-radius: 10px; padding: 14px;
      font-size: 1rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s; display: flex; align-items: center; justify-content: center;
    }
    .submit-btn:hover:not(:disabled) { background: #5a52e8; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(108,99,255,0.4); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
    .form-footer { text-align: center; color: rgba(255,255,255,0.35); font-size: 0.875rem; margin-top: 20px; }
    .form-footer a { color: #6C63FF; text-decoration: none; font-weight: 600; }
  `]
})
export class RegisterComponent {
  role = 'PERSONAL';
  firstName = ''; lastName = ''; email = ''; phone = '';
  password = ''; confirmPassword = '';
  businessName = ''; businessType = 'SOLE_PROPRIETORSHIP'; gstNumber = '';
  termsAccepted = false;
  loading = signal(false);
  errorMsg = signal('');

  constructor(
    private authService: AuthService,
    private walletService: WalletService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.password !== this.confirmPassword) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const payload: any = {
      email: this.email, password: this.password,
      firstName: this.firstName, lastName: this.lastName,
      phone: this.phone, role: this.role
    };
    if (this.role === 'BUSINESS') {
      payload.businessName = this.businessName;
      payload.businessType = this.businessType;
      payload.gstNumber = this.gstNumber;
    }

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.walletService.createWallet(res.user.id).subscribe({ error: () => {} });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
