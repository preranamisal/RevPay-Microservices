import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/api.services';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Notifications</h1>
          <p class="page-sub">{{ unreadCount() }} unread</p>
        </div>
        <button class="mark-all-btn" (click)="markAllRead()" *ngIf="unreadCount() > 0">Mark all read</button>
      </div>
      <div class="notif-list" *ngIf="notifications().length > 0">
        <div class="notif-card" *ngFor="let n of notifications()" [class.unread]="!n.read" (click)="markRead(n)">
          <div class="notif-icon" [ngClass]="getIconClass(n.type)">{{ getIcon(n.type) }}</div>
          <div class="notif-body">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-message">{{ n.message }}</div>
            <div class="notif-time">{{ n.createdAt | date:'d MMM, h:mm a' }}</div>
          </div>
          <div class="notif-dot" *ngIf="!n.read"></div>
        </div>
      </div>
      <div class="empty-state" *ngIf="notifications().length === 0 && !loading()">
        <div class="empty-icon">??</div>
        <p>No notifications yet</p>
        <span>Transaction alerts and updates will appear here</span>
      </div>
      <div class="loading-state" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:32px;max-width:800px;font-family:'Segoe UI',system-ui,sans-serif}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
    .page-title{font-size:1.75rem;font-weight:800;color:#fff;margin-bottom:4px}
    .page-sub{color:rgba(255,255,255,.4);font-size:.875rem}
    .mark-all-btn{background:rgba(108,99,255,.1);border:1px solid rgba(108,99,255,.3);color:#6C63FF;border-radius:8px;padding:8px 16px;font-size:.85rem;cursor:pointer}
    .notif-list{display:flex;flex-direction:column;gap:8px}
    .notif-card{display:flex;align-items:flex-start;gap:14px;background:#16161f;border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:16px;cursor:pointer;transition:all .2s;position:relative}
    .notif-card:hover{border-color:rgba(255,255,255,.12)}
    .notif-card.unread{border-left:3px solid #6C63FF;background:rgba(108,99,255,.05)}
    .notif-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;background:rgba(255,255,255,.06)}
    .notif-body{flex:1}
    .notif-title{font-size:.9rem;font-weight:600;color:#fff;margin-bottom:4px}
    .notif-message{font-size:.83rem;color:rgba(255,255,255,.45);line-height:1.5;margin-bottom:6px}
    .notif-time{font-size:.75rem;color:rgba(255,255,255,.25)}
    .notif-dot{width:8px;height:8px;border-radius:50%;background:#6C63FF;flex-shrink:0;margin-top:6px}
    .empty-state{text-align:center;padding:60px 20px}
    .empty-icon{font-size:3rem;margin-bottom:16px}
    .empty-state p{color:rgba(255,255,255,.5);font-size:1rem;font-weight:600;margin-bottom:6px}
    .empty-state span{color:rgba(255,255,255,.25);font-size:.85rem}
    .loading-state{text-align:center;padding:60px;color:rgba(255,255,255,.3)}
    @keyframes spin{to{transform:rotate(360deg)}}
    .spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.1);border-top-color:#6C63FF;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
  `]
})
export class NotificationsComponent implements OnInit {
  notifications = signal<any[]>([]);
  unreadCount = signal(0);
  loading = signal(true);

  constructor(private authService: AuthService, private notifService: NotificationService) {}

  ngOnInit(): void { this.loadNotifications(); }

  get userId(): number { return this.authService.currentUser!.id; }

  loadNotifications(): void {
    this.loading.set(true);
    this.notifService.getNotifications(this.userId).subscribe({
      next: (res: any) => { this.notifications.set(res.content || []); this.unreadCount.set((res.content || []).filter((n: any) => !n.read).length); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  markRead(n: any): void {
    if (n.read) return;
    this.notifService.markRead(n.id).subscribe({ next: () => { this.notifications.update(arr => arr.map(x => x.id === n.id ? { ...x, read: true } : x)); this.unreadCount.update(c => Math.max(0, c - 1)); }, error: () => {} });
  }

  markAllRead(): void {
    this.notifService.markAllRead(this.userId).subscribe({ next: () => { this.notifications.update(arr => arr.map(n => ({ ...n, read: true }))); this.unreadCount.set(0); }, error: () => {} });
  }

  getIcon(type: string): string {
    const map: any = { TRANSACTION: '?', LOAN: '??', INVOICE: '??', SECURITY: '??', LOW_BALANCE: '?', SYSTEM: '?', PAYMENT_REQUEST: '??' };
    return map[type] || '??';
  }

  getIconClass(type: string): string { return 'notif-icon'; }
}
