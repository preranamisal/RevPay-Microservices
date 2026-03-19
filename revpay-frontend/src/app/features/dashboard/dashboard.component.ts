import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService, TransactionService, NotificationService } from '../../core/services/api.services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <div class="dash-header">
        <div>
          <h1 class="page-title">Good {{ timeOfDay() }}, {{ firstName() }} 👋</h1>
          <p class="page-sub">Here's your financial overview for today</p>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" routerLink="/transactions">
            ⇄ Send Money
          </button>
          <button class="action-btn primary" routerLink="/wallet">
            + Add Funds
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card wallet-card">
          <div class="kpi-icon">💳</div>
          <div class="kpi-body">
            <div class="kpi-label">Wallet Balance</div>
            <div class="kpi-value">{{ formatCurrency(wallet()?.balance) }}</div>
            <div class="kpi-sub">Available · {{ wallet()?.currency }}</div>
          </div>
          <div class="kpi-badge">ACTIVE</div>
        </div>
        <div class="kpi-card sent-card">
          <div class="kpi-icon">↑</div>
          <div class="kpi-body">
            <div class="kpi-label">Sent (30 days)</div>
            <div class="kpi-value">{{ formatCurrency(summary()?.totalSent) }}</div>
            <div class="kpi-sub">{{ summary()?.totalTransactions }} transactions</div>
          </div>
        </div>
        <div class="kpi-card received-card">
          <div class="kpi-icon">↓</div>
          <div class="kpi-body">
            <div class="kpi-label">Received (30 days)</div>
            <div class="kpi-value">{{ formatCurrency(summary()?.totalReceived) }}</div>
            <div class="kpi-sub positive">+{{ formatCurrency(summary()?.netBalance) }} net</div>
          </div>
        </div>
        <div class="kpi-card notify-card">
          <div class="kpi-icon">🔔</div>
          <div class="kpi-body">
            <div class="kpi-label">Notifications</div>
            <div class="kpi-value">{{ unreadCount() }}</div>
            <div class="kpi-sub">Unread alerts</div>
          </div>
        </div>
      </div>

      <!-- Content grid -->
      <div class="content-grid">
        <!-- Recent Transactions -->
        <div class="panel">
          <div class="panel-header">
            <h3>Recent Transactions</h3>
            <a routerLink="/transactions" class="panel-link">View all →</a>
          </div>
          <div class="txn-list" *ngIf="recentTxns().length > 0">
            <div class="txn-row" *ngFor="let t of recentTxns()">
              <div class="txn-icon" [class]="getTxnClass(t)">
                {{ getTxnIcon(t) }}
              </div>
              <div class="txn-body">
                <div class="txn-title">{{ getTxnTitle(t) }}</div>
                <div class="txn-date">{{ t.createdAt | date:'d MMM, h:mm a' }}</div>
              </div>
              <div class="txn-amount" [class.positive]="isCredit(t)" [class.negative]="!isCredit(t)">
                {{ isCredit(t) ? '+' : '-' }}{{ formatCurrency(t.amount) }}
              </div>
              <div class="txn-status" [class]="'status-' + t.status.toLowerCase()">
                {{ t.status }}
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="recentTxns().length === 0">
            <div class="empty-icon">💸</div>
            <p>No transactions yet</p>
            <button routerLink="/transactions" class="action-btn primary small">Send your first payment</button>
          </div>
        </div>

        <!-- Quick Actions + Pending Requests -->
        <div class="side-panels">
          <div class="panel quick-actions-panel">
            <h3>Quick Actions</h3>
            <div class="quick-grid">
              <a routerLink="/transactions" class="quick-item">
                <span class="qi-icon">📤</span>
                <span>Send Money</span>
              </a>
              <a routerLink="/transactions" class="quick-item">
                <span class="qi-icon">📥</span>
                <span>Request</span>
              </a>
              <a routerLink="/wallet" class="quick-item">
                <span class="qi-icon">💰</span>
                <span>Add Funds</span>
              </a>
              <a routerLink="/wallet" class="quick-item">
                <span class="qi-icon">🏧</span>
                <span>Withdraw</span>
              </a>
            </div>
          </div>

          <div class="panel pending-panel" *ngIf="pendingRequests().length > 0">
            <div class="panel-header">
              <h3>Pending Requests</h3>
              <span class="badge-count">{{ pendingRequests().length }}</span>
            </div>
            <div class="request-row" *ngFor="let r of pendingRequests()">
              <div class="request-info">
                <div class="req-amount">{{ formatCurrency(r.amount) }}</div>
                <div class="req-desc">{{ r.description || 'Payment request' }}</div>
              </div>
              <div class="request-actions">
                <button class="req-btn accept" (click)="acceptRequest(r)">Accept</button>
                <button class="req-btn reject" (click)="rejectRequest(r)">Decline</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 32px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      max-width: 1400px;
    }
    .dash-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 32px;
    }
    .page-title { font-size: 1.75rem; font-weight: 800; color: #fff; margin-bottom: 4px; }
    .page-sub { color: rgba(255,255,255,0.4); font-size: 0.9rem; }
    .header-actions { display: flex; gap: 10px; }
    .action-btn {
      padding: 10px 20px; border-radius: 10px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; border: none; text-decoration: none;
      display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
    }
    .action-btn.primary { background: #6C63FF; color: #fff; }
    .action-btn.primary:hover { background: #5a52e8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(108,99,255,0.4); }
    .action-btn.secondary { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1); }
    .action-btn.secondary:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .action-btn.small { padding: 8px 16px; font-size: 0.82rem; }

    /* KPI Cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .kpi-card {
      border-radius: 16px; padding: 22px;
      position: relative; overflow: hidden;
      display: flex; gap: 14px; align-items: flex-start;
    }
    .wallet-card { background: linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%); }
    .sent-card { background: linear-gradient(135deg, #1a1a2e 0%, #22224a 100%); border: 1px solid rgba(255,71,87,0.2); }
    .received-card { background: linear-gradient(135deg, #1a1a2e 0%, #1a2e22 100%); border: 1px solid rgba(46,213,115,0.2); }
    .notify-card { background: linear-gradient(135deg, #1a1a2e 0%, #2a1f2e 100%); border: 1px solid rgba(255,165,2,0.2); }

    .kpi-icon { font-size: 1.5rem; }
    .kpi-label { font-size: 0.78rem; color: rgba(255,255,255,0.55); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 1.5rem; font-weight: 800; color: #fff; line-height: 1; }
    .kpi-sub { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-top: 4px; }
    .kpi-sub.positive { color: #2ed573; }
    .kpi-badge {
      position: absolute; top: 14px; right: 14px;
      background: rgba(255,255,255,0.15); color: #fff;
      font-size: 0.65rem; font-weight: 700; padding: 3px 8px; border-radius: 20px;
    }

    /* Content grid */
    .content-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; }
    .panel {
      background: #16161f; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; padding: 22px;
    }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .panel-header h3 { font-size: 1rem; font-weight: 700; color: #fff; }
    .panel-link { color: #6C63FF; font-size: 0.82rem; text-decoration: none; }
    .panel-link:hover { text-decoration: underline; }

    /* Transactions */
    .txn-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .txn-row:last-child { border-bottom: none; }
    .txn-icon {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 1rem;
      flex-shrink: 0;
    }
    .txn-icon.send { background: rgba(255,71,87,0.12); }
    .txn-icon.receive { background: rgba(46,213,115,0.12); }
    .txn-icon.other { background: rgba(108,99,255,0.12); }
    .txn-body { flex: 1; }
    .txn-title { font-size: 0.875rem; font-weight: 600; color: #fff; }
    .txn-date { font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 2px; }
    .txn-amount { font-size: 0.9rem; font-weight: 700; }
    .txn-amount.positive { color: #2ed573; }
    .txn-amount.negative { color: #FF4757; }
    .txn-status {
      font-size: 0.7rem; font-weight: 600; padding: 3px 8px; border-radius: 20px;
    }
    .status-completed { background: rgba(46,213,115,0.1); color: #2ed573; }
    .status-pending { background: rgba(255,165,2,0.1); color: #FFA502; }
    .status-failed { background: rgba(255,71,87,0.1); color: #FF4757; }

    /* Empty state */
    .empty-state { text-align: center; padding: 40px 20px; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
    .empty-state p { color: rgba(255,255,255,0.35); font-size: 0.9rem; margin-bottom: 16px; }

    /* Side panels */
    .side-panels { display: flex; flex-direction: column; gap: 16px; }
    .quick-actions-panel h3, .pending-panel h3 { font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 14px; }
    .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .quick-item {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 16px 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      color: rgba(255,255,255,0.6);
      font-size: 0.8rem;
      text-decoration: none; text-align: center;
      cursor: pointer; transition: all 0.2s;
    }
    .quick-item:hover { background: rgba(108,99,255,0.1); border-color: rgba(108,99,255,0.3); color: #fff; }
    .qi-icon { font-size: 1.3rem; }

    .badge-count {
      background: #FF4757; color: #fff;
      border-radius: 50%; width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700;
    }
    .request-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .req-amount { font-size: 0.95rem; font-weight: 700; color: #fff; }
    .req-desc { font-size: 0.75rem; color: rgba(255,255,255,0.35); margin-top: 2px; }
    .request-actions { display: flex; gap: 6px; }
    .req-btn {
      padding: 6px 12px; border-radius: 6px; font-size: 0.75rem;
      font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
    }
    .req-btn.accept { background: rgba(46,213,115,0.1); color: #2ed573; border: 1px solid rgba(46,213,115,0.3); }
    .req-btn.reject { background: rgba(255,71,87,0.1); color: #FF4757; border: 1px solid rgba(255,71,87,0.3); }

    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .dashboard { padding: 16px; }
      .kpi-grid { grid-template-columns: 1fr; }
      .dash-header { flex-direction: column; gap: 16px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  wallet = signal<any>(null);
  summary = signal<any>(null);
  recentTxns = signal<any[]>([]);
  pendingRequests = signal<any[]>([]);
  unreadCount = signal(0);

  constructor(
    private authService: AuthService,
    private walletService: WalletService,
    private transactionService: TransactionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.currentUser?.id;
    if (!userId) return;
    this.walletService.getWallet(userId).subscribe({ next: w => this.wallet.set(w), error: () => {} });
    this.transactionService.getSummary(userId).subscribe({ next: s => this.summary.set(s), error: () => {} });
    this.transactionService.getRecentTransactions(userId, 8).subscribe({ next: t => this.recentTxns.set(t), error: () => {} });
    this.transactionService.getPendingRequests(userId).subscribe({ next: r => this.pendingRequests.set(r), error: () => {} });
    this.notificationService.getUnreadCount(userId).subscribe({ next: (r: any) => this.unreadCount.set(r.count), error: () => {} });
  }

  firstName(): string { return this.authService.currentUser?.firstName || 'User'; }

  timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  formatCurrency(val: any): string {
    if (val == null) return '₹0.00';
    return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  isCredit(t: any): boolean {
    const uid = this.authService.currentUser?.id;
    return t.receiverId === uid || t.type === 'ADD_FUNDS';
  }

  acceptRequest(r: any) {
    const userId = this.authService.currentUser!.id;
    this.transactionService.acceptMoneyRequest(r.id, userId).subscribe({
      next: () => { this.pendingRequests.set(this.pendingRequests().filter((x: any) => x.id !== r.id)); this.walletService.getWallet(userId).subscribe({ next: w => this.wallet.set(w), error: () => {} }); },
      error: (e) => console.error(e)
    });
  }
  rejectRequest(r: any) {
    const userId = this.authService.currentUser!.id;
    this.transactionService.rejectMoneyRequest(r.id, userId).subscribe({
      next: () => this.pendingRequests.set(this.pendingRequests().filter((x: any) => x.id !== r.id)),
      error: (e) => console.error(e)
    });
  }
  getTxnIcon(t: any): string {
    if (t.type === 'SEND_MONEY') return '↑';
    if (t.type === 'REQUEST_MONEY') return '↓';
    if (t.type === 'ADD_FUNDS') return '💰';
    if (t.type === 'INVOICE_PAYMENT') return '📄';
    return '⇄';
  }

  getTxnClass(t: any): string {
    if (this.isCredit(t)) return 'txn-icon receive';
    if (t.type === 'SEND_MONEY') return 'txn-icon send';
    return 'txn-icon other';
  }

  getTxnTitle(t: any): string {
    if (t.description) return t.description;
    const map: any = {
      SEND_MONEY: 'Money Sent',
      REQUEST_MONEY: 'Money Requested',
      ADD_FUNDS: 'Funds Added',
      WITHDRAW: 'Withdrawal',
      INVOICE_PAYMENT: 'Invoice Payment',
      LOAN_DISBURSEMENT: 'Loan Disbursement',
      LOAN_REPAYMENT: 'Loan Repayment'
    };
    return map[t.type] || t.type;
  }
}
