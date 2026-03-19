import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService, UserApiService } from '../../core/services/api.services';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Transactions</h1>
        <div class="tab-row">
          <button class="tab" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history')">History</button>
          <button class="tab" [class.active]="activeTab() === 'send'" (click)="activeTab.set('send')">Send Money</button>
          <button class="tab" [class.active]="activeTab() === 'request'" (click)="activeTab.set('request')">Request Money</button>
          <button class="tab" [class.active]="activeTab() === 'pending'" (click)="loadPending()">
            Pending
            <span class="badge" *ngIf="pendingRequests().length">{{ pendingRequests().length }}</span>
          </button>
        </div>
      </div>

      <!-- ── Send Money ── -->
      <div class="panel" *ngIf="activeTab() === 'send'">
        <h3>Send Money</h3>
        <div class="success-msg" *ngIf="successMsg()">✓ {{ successMsg() }}</div>
        <div class="error-msg" *ngIf="errorMsg()">⚠ {{ errorMsg() }}</div>
        <div class="form-grid">
          <div class="field-group">
            <label>Recipient User ID</label>
            <input type="number" [(ngModel)]="sendForm.receiverId" class="field-input" placeholder="Enter user ID">
          </div>
          <div class="field-group">
            <label>Amount (₹)</label>
            <input type="number" [(ngModel)]="sendForm.amount" class="field-input" placeholder="0.00" min="1">
          </div>
          <div class="field-group full-width">
            <label>Description (optional)</label>
            <input type="text" [(ngModel)]="sendForm.description" class="field-input" placeholder="e.g. Dinner split">
          </div>
        </div>
        <button class="submit-btn" (click)="sendMoney()" [disabled]="loading()">
          {{ loading() ? 'Processing...' : 'Send Money →' }}
        </button>
      </div>

      <!-- ── Request Money ── -->
      <div class="panel" *ngIf="activeTab() === 'request'">
        <h3>Request Money</h3>
        <div class="success-msg" *ngIf="successMsg()">✓ {{ successMsg() }}</div>
        <div class="error-msg" *ngIf="errorMsg()">⚠ {{ errorMsg() }}</div>
        <div class="form-grid">
          <div class="field-group">
            <label>Payer User ID</label>
            <input type="number" [(ngModel)]="requestForm.payerId" class="field-input" placeholder="Enter user ID">
          </div>
          <div class="field-group">
            <label>Amount (₹)</label>
            <input type="number" [(ngModel)]="requestForm.amount" class="field-input" placeholder="0.00" min="1">
          </div>
          <div class="field-group full-width">
            <label>Description</label>
            <input type="text" [(ngModel)]="requestForm.description" class="field-input" placeholder="What is this for?">
          </div>
        </div>
        <button class="submit-btn" (click)="requestMoney()" [disabled]="loading()">
          {{ loading() ? 'Sending...' : 'Send Request →' }}
        </button>
      </div>

      <!-- ── Pending Requests ── -->
      <div class="panel" *ngIf="activeTab() === 'pending'">
        <h3>Pending Money Requests</h3>
        <div class="empty-state" *ngIf="pendingRequests().length === 0">
          <p>No pending requests</p>
        </div>
        <div class="request-card" *ngFor="let r of pendingRequests()">
          <div class="req-details">
            <div class="req-amount">₹{{ r.amount }}</div>
            <div class="req-meta">{{ r.description || 'Payment request' }} • {{ r.createdAt | date:'d MMM' }}</div>
            <div class="req-parties">
              <span *ngIf="r.payerId === currentUserId()">Request from user #{{ r.requesterId }}</span>
              <span *ngIf="r.requesterId === currentUserId()">Requested from user #{{ r.payerId }}</span>
            </div>
          </div>
          <div class="req-actions" *ngIf="r.payerId === currentUserId()">
            <button class="req-btn accept" (click)="acceptRequest(r.id)">Accept</button>
            <button class="req-btn accept" (click)="acceptRequest(r.id)">Accept</button><button class="req-btn reject" (click)="rejectRequest(r.id)">Decline</button>
          </div>
          <div class="req-status" *ngIf="r.requesterId === currentUserId()">
            <span class="badge-pending">Awaiting payment</span>
          </div>
        </div>
      </div>

      <!-- ── Transaction History ── -->
      <div class="panel" *ngIf="activeTab() === 'history'">
        <div class="filter-bar">
          <select [(ngModel)]="filters.status" class="filter-select" (change)="loadTransactions()">
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <select [(ngModel)]="filters.type" class="filter-select" (change)="loadTransactions()">
            <option value="">All Types</option>
            <option value="SEND_MONEY">Send Money</option>
            <option value="REQUEST_MONEY">Request Money</option>
            <option value="ADD_FUNDS">Add Funds</option>
            <option value="INVOICE_PAYMENT">Invoice Payment</option>
          </select>
          <input type="date" [(ngModel)]="filters.startDate" class="filter-input" placeholder="From" (change)="loadTransactions()">
          <input type="date" [(ngModel)]="filters.endDate" class="filter-input" placeholder="To" (change)="loadTransactions()">
        </div>

        <div class="txn-table-wrap">
          <table class="txn-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of transactions()">
                <td class="ref-cell">{{ t.referenceId }}</td>
                <td><span class="type-badge">{{ t.type | titlecase }}</span></td>
                <td class="desc-cell">{{ t.description || '—' }}</td>
                <td [class.positive]="isCredit(t)" [class.negative]="!isCredit(t)" class="amount-cell">
                  {{ isCredit(t) ? '+' : '-' }}₹{{ t.amount | number:'1.2-2' }}
                </td>
                <td><span class="status-pill" [class]="'s-' + t.status.toLowerCase()">{{ t.status }}</span></td>
                <td class="date-cell">{{ t.createdAt | date:'d MMM yy, h:mm a' }}</td>
              </tr>
              <tr *ngIf="transactions().length === 0">
                <td colspan="6" class="empty-row">No transactions found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" *ngIf="totalPages() > 1">
          <button [disabled]="currentPage() === 0" (click)="changePage(currentPage() - 1)">←</button>
          <span>Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
          <button [disabled]="currentPage() >= totalPages() - 1" (click)="changePage(currentPage() + 1)">→</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1200px; font-family: 'Segoe UI', system-ui, sans-serif; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 1.75rem; font-weight: 800; color: #fff; margin-bottom: 16px; }
    .tab-row { display: flex; gap: 4px; }
    .tab {
      padding: 8px 20px; border-radius: 8px;
      background: none; border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.4); font-size: 0.875rem; cursor: pointer;
      transition: all 0.2s; display: flex; align-items: center; gap: 6px;
    }
    .tab.active { background: rgba(108,99,255,0.15); border-color: rgba(108,99,255,0.4); color: #fff; }
    .badge {
      background: #FF4757; color: #fff;
      border-radius: 10px; padding: 1px 6px; font-size: 0.7rem;
    }
    .panel {
      background: #16161f; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; padding: 24px;
    }
    .panel h3 { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 20px; }
    .success-msg { background: rgba(46,213,115,0.1); border: 1px solid rgba(46,213,115,0.3); color: #2ed573; padding: 10px 14px; border-radius: 8px; font-size: 0.875rem; margin-bottom: 16px; }
    .error-msg { background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.3); color: #FF4757; padding: 10px 14px; border-radius: 8px; font-size: 0.875rem; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .full-width { grid-column: 1 / -1; }
    .field-group label { display: block; color: rgba(255,255,255,0.55); font-size: 0.83rem; margin-bottom: 6px; }
    .field-input {
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 11px 14px; color: #fff; font-size: 0.9rem; outline: none;
      transition: border-color 0.2s;
    }
    .field-input:focus { border-color: #6C63FF; }
    .submit-btn {
      background: #6C63FF; color: #fff; border: none;
      border-radius: 10px; padding: 12px 28px;
      font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .submit-btn:hover:not(:disabled) { background: #5a52e8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(108,99,255,0.4); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Filter bar */
    .filter-bar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-select, .filter-input {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 0.85rem; outline: none;
    }
    .filter-select option { background: #16161f; }

    /* Table */
    .txn-table-wrap { overflow-x: auto; }
    .txn-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .txn-table th { color: rgba(255,255,255,0.35); font-weight: 600; padding: 10px 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .txn-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
    .ref-cell { font-family: monospace; font-size: 0.78rem; color: rgba(255,255,255,0.4); }
    .type-badge { background: rgba(108,99,255,0.1); color: #6C63FF; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; }
    .desc-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .amount-cell { font-weight: 700; }
    .positive { color: #2ed573; }
    .negative { color: #FF4757; }
    .date-cell { color: rgba(255,255,255,0.35); font-size: 0.8rem; white-space: nowrap; }
    .status-pill { padding: 3px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
    .s-completed { background: rgba(46,213,115,0.1); color: #2ed573; }
    .s-pending { background: rgba(255,165,2,0.1); color: #FFA502; }
    .s-failed { background: rgba(255,71,87,0.1); color: #FF4757; }
    .empty-row { text-align: center; color: rgba(255,255,255,0.25); padding: 32px; }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 16px; }
    .pagination button { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 6px 14px; border-radius: 6px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
    .pagination span { color: rgba(255,255,255,0.4); font-size: 0.85rem; }

    /* Pending requests */
    .request-card { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .req-amount { font-size: 1.1rem; font-weight: 700; color: #fff; }
    .req-meta { font-size: 0.8rem; color: rgba(255,255,255,0.35); margin-top: 2px; }
    .req-parties { font-size: 0.78rem; color: rgba(255,255,255,0.25); margin-top: 2px; }
    .req-actions { display: flex; gap: 8px; }
    .req-btn { padding: 7px 14px; border-radius: 7px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .req-btn.accept { background: rgba(46,213,115,0.1); color: #2ed573; border: 1px solid rgba(46,213,115,0.3); }
    .req-btn.reject { background: rgba(255,71,87,0.1); color: #FF4757; border: 1px solid rgba(255,71,87,0.3); }
    .badge-pending { background: rgba(255,165,2,0.1); color: #FFA502; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; }
    .empty-state { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); }
  `]
})
export class TransactionsComponent implements OnInit {
  activeTab = signal('history');
  loading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  transactions = signal<any[]>([]);
  pendingRequests = signal<any[]>([]);
  currentPage = signal(0);
  totalPages = signal(0);

  sendForm = { receiverId: null, amount: null, description: '' };
  requestForm = { payerId: null, amount: null, description: '' };
  filters = { status: '', type: '', startDate: '', endDate: '' };

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void { this.loadTransactions(); }

  currentUserId(): number | undefined { return this.authService.currentUser?.id; }

  loadTransactions(): void {
    const uid = this.authService.currentUser?.id;
    if (!uid) return;
    this.transactionService.getTransactions(uid, { ...this.filters, page: this.currentPage() }).subscribe({
      next: (res: any) => {
        this.transactions.set(res.content || res);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadPending(): void {
    this.activeTab.set('pending');
    const uid = this.authService.currentUser?.id;
    if (!uid) return;
    this.transactionService.getPendingRequests(uid).subscribe({
      next: r => this.pendingRequests.set(r),
      error: () => {}
    });
  }

  sendMoney(): void {
    const uid = this.authService.currentUser?.id;
    if (!uid || !this.sendForm.receiverId || !this.sendForm.amount) return;
    this.loading.set(true);
    this.errorMsg.set(''); this.successMsg.set('');
    this.transactionService.sendMoney({
      senderId: uid,
      receiverId: this.sendForm.receiverId,
      amount: this.sendForm.amount,
      description: this.sendForm.description
    }).subscribe({
      next: (t: any) => {
        this.loading.set(false);
        this.successMsg.set(`₹${this.sendForm.amount} sent successfully! Ref: ${t.referenceId}`);
        this.sendForm = { receiverId: null, amount: null, description: '' };
      },
      error: (e: any) => {
        this.loading.set(false);
        this.errorMsg.set(e.error?.message || 'Transaction failed');
      }
    });
  }

  requestMoney(): void {
    const uid = this.authService.currentUser?.id;
    if (!uid || !this.requestForm.payerId || !this.requestForm.amount) return;
    this.loading.set(true);
    this.transactionService.requestMoney({
      requesterId: uid,
      payerId: this.requestForm.payerId,
      amount: this.requestForm.amount,
      description: this.requestForm.description
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('Money request sent successfully!');
        this.requestForm = { payerId: null, amount: null, description: '' };
      },
      error: (e: any) => {
        this.loading.set(false);
        this.errorMsg.set(e.error?.message || 'Request failed');
      }
    });
  }

  acceptRequest(id: number): void {
    const uid = this.authService.currentUser?.id;
    if (!uid) return;
    this.transactionService.acceptMoneyRequest(id, uid).subscribe({
      next: () => this.loadPending(),
      error: () => {}
    });
  }

  rejectRequest(id: number): void {
    const uid = this.authService.currentUser?.id;
    if (!uid) return;
    this.transactionService.rejectMoneyRequest(id, uid).subscribe({
      next: () => this.loadPending(),
      error: () => {}
    });
  }

  isCredit(t: any): boolean {
    const uid = this.authService.currentUser?.id;
    return t.receiverId === uid || t.type === 'ADD_FUNDS';
  }

  changePage(p: number): void { this.currentPage.set(p); this.loadTransactions(); }
}
