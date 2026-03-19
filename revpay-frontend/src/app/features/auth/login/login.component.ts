import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WalletService } from '../../../core/services/api.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-shell">
      <!-- Left panel -->
      <div class="promo-panel">
        <div class="promo-content">
          <div class="logo-mark">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="rgba(108,99,255,0.15)"/>
              <circle cx="24" cy="24" r="16" fill="rgba(108,99,255,0.3)"/>
              <path d="M16 24h16M24 16l8 8-8 8" stroke="#6C63FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="brand">RevPay</span>
          </div>
          <h1 class="promo-heading">Banking at the<br><span class="accent">speed of cloud</span></h1>
          <p class="promo-sub">Send money, manage invoices, track loans — all in one secure, modern platform.</p>
          <div class="feature-list">
            <div class="feature-item" *ngFor="let f of features">
              <span class="fi-dot"></span>{{ f }}
            </div>
          </div>
          <div class="stat-grid">
            <div class="stat" *ngFor="let s of stats">
              <div class="stat-val">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </div>
        <div class="glow-blob"></div>
      </div>

      <!-- Right panel: login form -->
      <div class="form-panel">
        <div class="form-card">
          <div class="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your RevPay account</p>
          </div>

          <div class="error-msg" *ngIf="errorMsg()">
            <span>⚠</span> {{ errorMsg() }}
          </div>

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <div class="field-group">
              <label>Email address</label>
              <input
                type="email" name="email" [(ngModel)]="email"
                placeholder="you@example.com" required
                class="field-input" [class.error]="emailError()">
              <span class="field-err" *ngIf="emailError()">Enter a valid email</span>
            </div>

            <div class="field-group">
              <label>Password</label>
              <div class="input-wrap">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  name="password" [(ngModel)]="password"
                  placeholder="••••••••" required
                  class="field-input" [class.error]="passwordError()">
                <button type="button" class="toggle-pw" (click)="togglePw()">
                  {{ showPassword() ? '🙈' : '👁' }}
                </button>
              </div>
              <span class="field-err" *ngIf="passwordError()">Password required</span>
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe">
                <span>Remember me</span>
              </label>
              <a href="#" class="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" class="submit-btn" [disabled]="loading()">
              <span *ngIf="!loading()">Sign in →</span>
              <span *ngIf="loading()" class="spinner"></span>
            </button>
          </form>

          <div class="form-divider"><span>or continue with</span></div>

          <div class="demo-accounts">
            <p class="demo-title">Demo accounts</p>
            <div class="demo-btns">
              <button class="demo-btn" (click)="loginDemo('personal')">Personal User</button>
              <button class="demo-btn" (click)="loginDemo('business')">Business User</button>
            </div>
          </div>

          <p class="form-footer">
            Don't have an account? <a routerLink="/auth/register">Create one</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh;
      display: flex;
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0f0f17;
    }

    /* ── Left promo panel ── */
    .promo-panel {
      flex: 1;
      background: linear-gradient(145deg, #13131e 0%, #1a1a2e 100%);
      padding: 60px;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .glow-blob {
      position: absolute;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%);
      top: -100px; right: -100px;
      pointer-events: none;
    }
    .promo-content { position: relative; z-index: 1; max-width: 460px; }
    .logo-mark { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
    .brand { font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.5px; }

    .promo-heading {
      font-size: 3rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.15;
      letter-spacing: -1.5px;
      margin-bottom: 20px;
    }
    .accent { color: #6C63FF; }
    .promo-sub { color: rgba(255,255,255,0.5); font-size: 1.05rem; line-height: 1.7; margin-bottom: 36px; }

    .feature-list { margin-bottom: 48px; }
    .feature-item {
      display: flex; align-items: center; gap: 10px;
      color: rgba(255,255,255,0.65); font-size: 0.95rem;
      margin-bottom: 10px;
    }
    .fi-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #6C63FF; flex-shrink: 0;
    }

    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .stat-val { font-size: 1.5rem; font-weight: 800; color: #fff; }
    .stat-label { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-top: 2px; }

    /* ── Right form panel ── */
    .form-panel {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      border-left: 1px solid rgba(255,255,255,0.05);
    }
    .form-card { width: 100%; max-width: 380px; }

    .form-header { margin-bottom: 32px; }
    .form-header h2 { font-size: 1.75rem; font-weight: 800; color: #fff; margin-bottom: 6px; }
    .form-header p { color: rgba(255,255,255,0.45); font-size: 0.95rem; }

    .error-msg {
      background: rgba(255,71,87,0.1);
      border: 1px solid rgba(255,71,87,0.3);
      color: #FF4757;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.875rem;
      margin-bottom: 20px;
      display: flex; align-items: center; gap: 8px;
    }

    .field-group { margin-bottom: 20px; }
    .field-group label { display: block; color: rgba(255,255,255,0.6); font-size: 0.875rem; margin-bottom: 8px; font-weight: 500; }
    .field-input {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 13px 16px;
      color: #fff;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .field-input::placeholder { color: rgba(255,255,255,0.2); }
    .field-input:focus { border-color: #6C63FF; box-shadow: 0 0 0 3px rgba(108,99,255,0.15); }
    .field-input.error { border-color: #FF4757; }
    .field-err { color: #FF4757; font-size: 0.78rem; margin-top: 4px; display: block; }

    .input-wrap { position: relative; }
    .input-wrap .field-input { padding-right: 48px; }
    .toggle-pw {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 1rem;
    }

    .form-options { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .remember-me { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.5); font-size: 0.875rem; cursor: pointer; }
    .remember-me input { accent-color: #6C63FF; }
    .forgot-link { color: #6C63FF; font-size: 0.875rem; text-decoration: none; }
    .forgot-link:hover { text-decoration: underline; }

    .submit-btn {
      width: 100%;
      background: #6C63FF;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
      letter-spacing: 0.2px;
    }
    .submit-btn:hover:not(:disabled) { background: #5a52e8; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(108,99,255,0.4); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .form-divider {
      text-align: center; position: relative; margin: 24px 0;
      color: rgba(255,255,255,0.2); font-size: 0.8rem;
    }
    .form-divider::before, .form-divider::after {
      content: ''; position: absolute; top: 50%;
      width: calc(50% - 70px); height: 1px;
      background: rgba(255,255,255,0.08);
    }
    .form-divider::before { left: 0; }
    .form-divider::after { right: 0; }
    .form-divider span { background: #0f0f17; padding: 0 12px; }

    .demo-accounts { margin-bottom: 24px; }
    .demo-title { color: rgba(255,255,255,0.35); font-size: 0.78rem; text-align: center; margin-bottom: 10px; }
    .demo-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .demo-btn {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
      border-radius: 8px; padding: 10px;
      font-size: 0.82rem; cursor: pointer;
      transition: all 0.2s;
    }
    .demo-btn:hover { background: rgba(108,99,255,0.1); border-color: rgba(108,99,255,0.3); color: #fff; }

    .form-footer { text-align: center; color: rgba(255,255,255,0.35); font-size: 0.875rem; }
    .form-footer a { color: #6C63FF; text-decoration: none; font-weight: 600; }
    .form-footer a:hover { text-decoration: underline; }

    @media (max-width: 900px) {
      .promo-panel { display: none; }
      .form-panel { width: 100%; border: none; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  loading = signal(false);
  errorMsg = signal('');
  emailError = signal(false);
  passwordError = signal(false);
  showPassword = signal(false);

  features = [
    'Instant peer-to-peer transfers',
    'Real-time transaction history',
    'Business invoice management',
    'Smart loan EMI tracking',
    'Role-based access control'
  ];

  stats = [
    { value: '₹2M+', label: 'Processed Daily' },
    { value: '50K+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime SLA' }
  ];

  constructor(
    private authService: AuthService,
    private walletService: WalletService,
    private router: Router
  ) {}

  togglePw(): void { this.showPassword.update(v => !v); }

  onSubmit(): void {
    this.emailError.set(!this.email || !this.email.includes('@'));
    this.passwordError.set(!this.password);
    if (this.emailError() || this.passwordError()) return;

    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        // Auto-create wallet for new users
        this.walletService.createWallet(res.user.id).subscribe({ error: () => {} });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Invalid email or password. Please try again.');
      }
    });
  }

  loginDemo(type: 'personal' | 'business'): void {
    this.email = type === 'personal' ? 'john.doe@revpay.com' : 'business@revpay.com';
    this.password = 'Demo@1234';
    this.onSubmit();
  }
}
