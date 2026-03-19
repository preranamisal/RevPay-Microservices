import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from './core/services/auth.service';
import { NotificationService } from './core/services/api.services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell" [class.authenticated]="isAuth()">

      <!-- ── Sidebar ── -->
      <aside class="sidebar" *ngIf="isAuth()" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo-wrap">
            <div class="logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="14" fill="#6C63FF"/>
                <path d="M8 14h12M14 8l6 6-6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="logo-text" *ngIf="!sidebarCollapsed()">RevPay</span>
          </div>
          <button class="collapse-btn" (click)="toggleSidebar()">
            <span>{{ sidebarCollapsed() ? '→' : '←' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⊞</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Dashboard</span>
          </a>
          <a routerLink="/wallet" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💳</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Wallet</span>
          </a>
          <a routerLink="/transactions" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⇄</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Transactions</span>
          </a>
          <ng-container *ngIf="isBusiness()">
            <a routerLink="/invoices" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">📄</span>
              <span class="nav-label" *ngIf="!sidebarCollapsed()">Invoices</span>
            </a>
            <a routerLink="/loans" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">🏦</span>
              <span class="nav-label" *ngIf="!sidebarCollapsed()">Loans</span>
            </a>
          </ng-container>
          <a routerLink="/notifications" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔔</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">
              Notifications
              <span class="badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
            </span>
          </a>
          <a routerLink="/profile" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👤</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Profile</span>
          </a>
        </nav>

        <div class="sidebar-footer" *ngIf="!sidebarCollapsed()">
          <div class="user-info">
            <div class="user-avatar">{{ userInitials() }}</div>
            <div class="user-details">
              <div class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</div>
              <div class="user-role">{{ currentUser()?.role }}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">Sign Out</button>
        </div>
      </aside>

      <!-- ── Main ── -->
      <main class="main-content" [class.full-width]="!isAuth()">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .app-shell { display: flex; height: 100vh; background: #0f0f17; }

    .sidebar {
      width: 240px;
      background: #16161f;
      border-right: 1px solid rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      flex-shrink: 0;
      z-index: 100;
    }
    .sidebar.collapsed { width: 64px; }

    .sidebar-header {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .logo-wrap { display: flex; align-items: center; gap: 10px; }
    .logo-text { font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .collapse-btn {
      background: none; border: none; color: rgba(255,255,255,0.4);
      cursor: pointer; font-size: 14px; padding: 4px;
    }
    .collapse-btn:hover { color: #fff; }

    .sidebar-nav {
      flex: 1;
      padding: 16px 0;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: rgba(255,255,255,0.5);
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }
    .nav-item:hover { color: #fff; background: rgba(108,99,255,0.1); }
    .nav-item.active {
      color: #6C63FF;
      background: rgba(108,99,255,0.12);
      border-left-color: #6C63FF;
    }
    .nav-icon { font-size: 1.1rem; width: 20px; text-align: center; }
    .nav-label { display: flex; align-items: center; gap: 8px; }
    .badge {
      background: #FF4757; color: #fff;
      border-radius: 10px; padding: 2px 6px;
      font-size: 0.7rem; font-weight: 700;
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .user-info { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #6C63FF, #FF4757);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 0.85rem;
    }
    .user-name { color: #fff; font-size: 0.85rem; font-weight: 600; }
    .user-role { color: rgba(255,255,255,0.4); font-size: 0.75rem; }
    .logout-btn {
      width: 100%; padding: 8px;
      background: rgba(255,71,87,0.1); color: #FF4757;
      border: 1px solid rgba(255,71,87,0.3);
      border-radius: 8px; cursor: pointer; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: rgba(255,71,87,0.2); }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background: #0f0f17;
    }
    .main-content.full-width { width: 100%; }
  `]
})
export class AppComponent implements OnInit {
  sidebarCollapsed = signal(false);
  unreadCount = signal(0);
  currentUser = signal<User | null>(null);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      if (user) this.loadUnreadCount(user.id);
    });
  }

  isAuth(): boolean { return this.authService.isAuthenticated(); }
  isBusiness(): boolean { return this.authService.isBusinessUser(); }

  userInitials(): string {
    const u = this.currentUser();
    if (!u) return 'U';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  toggleSidebar(): void { this.sidebarCollapsed.update(v => !v); }

  logout(): void { this.authService.logout(); }

  private loadUnreadCount(userId: number): void {
    this.notificationService.getUnreadCount(userId).subscribe({
      next: (res: any) => this.unreadCount.set(res.count || 0),
      error: () => {}
    });
  }
}
