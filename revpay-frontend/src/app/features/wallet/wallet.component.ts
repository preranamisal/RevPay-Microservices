import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/api.services';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Wallet</h1>
      <div class="balance-card">
        <div class="balance-left">
          <div class="balance-label">Available Balance</div>
          <div class="balance-amount">&#8377;{{ wallet()?.balance | number:'1.2-2' }}</div>
          <div class="balance-meta">{{ wallet()?.currency }} &middot; {{ wallet()?.status }}</div>
        </div>
      </div>
      <div class="tab-row">
        <button class="tab" [class.active]="tab()==='add'" (click)="tab.set('add')">+ Add Funds</button>
        <button class="tab" [class.active]="tab()==='withdraw'" (click)="tab.set('withdraw')">Withdraw</button>
        <button class="tab" [class.active]="tab()==='methods'" (click)="loadPaymentMethods()">Payment Methods</button>
      </div>
      <div class="panel" *ngIf="tab()==='add'">
        <h3>Add Funds</h3>
        <div class="success-msg" *ngIf="successMsg()">&#10003; {{ successMsg() }}</div>
        <div class="error-msg" *ngIf="errorMsg()">&#9888; {{ errorMsg() }}</div>
        <div class="quick-amounts">
          <button *ngFor="let a of quickAmounts" class="quick-btn" (click)="addAmount=a">&#8377;{{ a }}</button>
        </div>
        <div class="field-group">
          <label>Amount (&#8377;)</label>
          <input type="number" [(ngModel)]="addAmount" class="field-input" placeholder="Enter amount" min="1">
        </div>
        <button class="submit-btn" (click)="addFunds()" [disabled]="loading() || !addAmount">
          {{ loading() ? 'Processing...' : 'Add Funds' }}
        </button>
      </div>
      <div class="panel" *ngIf="tab()==='withdraw'">
        <h3>Withdraw Funds</h3>
        <div class="success-msg" *ngIf="successMsg()">&#10003; {{ successMsg() }}</div>
        <div class="error-msg" *ngIf="errorMsg()">&#9888; {{ errorMsg() }}</div>
        <div class="info-box">Available: <strong>&#8377;{{ wallet()?.balance | number:'1.2-2' }}</strong></div>
        <div class="field-group">
          <label>Amount (&#8377;)</label>
          <input type="number" [(ngModel)]="withdrawAmount" class="field-input" placeholder="Enter amount" min="1">
        </div>
        <button class="submit-btn danger" (click)="withdraw()" [disabled]="loading() || !withdrawAmount">
          {{ loading() ? 'Processing...' : 'Withdraw' }}
        </button>
      </div>
      <div class="panel" *ngIf="tab()==='methods'">
        <div class="panel-header">
          <h3>Payment Methods</h3>
          <button class="add-btn" (click)="showAddMethod=!showAddMethod">+ Add New</button>
        </div>
        <div class="add-method-form" *ngIf="showAddMethod">
          <div class="field-group">
            <label>Type</label>
            <select [(ngModel)]="newMethod.type" class="field-input">
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="BANK_ACCOUNT">Bank Account</option>
            </select>
          </div>
          <ng-container *ngIf="newMethod.type !== 'BANK_ACCOUNT'">
            <div class="field-group">
              <label>Card Holder Name</label>
              <input type="text" [(ngModel)]="newMethod.cardHolderName" class="field-input" placeholder="John Doe">
            </div>
            <div class="field-group">
              <label>Card Number (16 digits)</label>
              <input type="text" [(ngModel)]="newMethod.cardNumber" class="field-input" placeholder="4111111111111111" maxlength="16">
            </div>
            <div class="field-row">
              <div class="field-group">
                <label>Expiry Month</label>
                <input type="text" [(ngModel)]="newMethod.expiryMonth" class="field-input" placeholder="12" maxlength="2">
              </div>
              <div class="field-group">
                <label>Expiry Year</label>
                <input type="text" [(ngModel)]="newMethod.expiryYear" class="field-input" placeholder="2027" maxlength="4">
              </div>
            </div>
          </ng-container>
          <ng-container *ngIf="newMethod.type === 'BANK_ACCOUNT'">
            <div class="field-group">
              <label>Bank Name</label>
              <input type="text" [(ngModel)]="newMethod.bankName" class="field-input" placeholder="SBI">
            </div>
            <div class="field-group">
              <label>Account Holder Name</label>
              <input type="text" [(ngModel)]="newMethod.accountHolderName" class="field-input" placeholder="John Doe">
            </div>
            <div class="field-group">
              <label>Account Number</label>
              <input type="text" [(ngModel)]="newMethod.accountNumber" class="field-input" placeholder="1234567890">
            </div>
            <div class="field-group">
              <label>IFSC Code</label>
              <input type="text" [(ngModel)]="newMethod.ifscCode" class="field-input" placeholder="SBIN0001234">
            </div>
          </ng-container>
          <div class="form-actions">
            <button class="submit-btn small" (click)="addPaymentMethod()">Save</button>
            <button class="cancel-btn" (click)="showAddMethod=false">Cancel</button>
          </div>
        </div>
        <div class="methods-list">
          <div class="empty-state" *ngIf="paymentMethods().length === 0"><p>No payment methods added yet</p></div>
          <div class="method-card" *ngFor="let m of paymentMethods()">
            <div class="method-icon">{{ m.type === 'BANK_ACCOUNT' ? '??' : '??' }}</div>
            <div class="method-info">
              <div class="method-name">{{ m.cardHolderName || m.accountHolderName }}</div>
              <div class="method-number">{{ m.maskedNumber || m.maskedAccountNumber }}</div>
              <div class="method-meta">{{ m.cardBrand || m.bankName }}</div>
            </div>
            <span class="badge-default" *ngIf="m.default">Default</span>
            <button class="icon-btn" (click)="setDefault(m.id)" *ngIf="!m.default">Set Default</button>
            <button class="icon-btn danger" (click)="deleteMethod(m.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:32px;max-width:900px;font-family:'Segoe UI',system-ui,sans-serif}
    .page-title{font-size:1.75rem;font-weight:800;color:#fff;margin-bottom:24px}
    .balance-card{background:linear-gradient(135deg,#6C63FF 0%,#9B5DE5 100%);border-radius:20px;padding:28px 32px;margin-bottom:24px}
    .balance-label{font-size:.85rem;color:rgba(255,255,255,.7);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
    .balance-amount{font-size:2.5rem;font-weight:800;color:#fff;line-height:1}
    .balance-meta{font-size:.8rem;color:rgba(255,255,255,.6);margin-top:6px}
    .tab-row{display:flex;gap:8px;margin-bottom:20px}
    .tab{padding:10px 20px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-size:.875rem;cursor:pointer;transition:all .2s}
    .tab.active{background:rgba(108,99,255,.2);border-color:rgba(108,99,255,.5);color:#fff}
    .panel{background:#16161f;border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:24px}
    .panel h3{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:20px}
    .panel-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
    .panel-header h3{margin-bottom:0}
    .success-msg{background:rgba(46,213,115,.1);border:1px solid rgba(46,213,115,.3);color:#2ed573;padding:10px 14px;border-radius:8px;font-size:.875rem;margin-bottom:16px}
    .error-msg{background:rgba(255,71,87,.1);border:1px solid rgba(255,71,87,.3);color:#FF4757;padding:10px 14px;border-radius:8px;font-size:.875rem;margin-bottom:16px}
    .info-box{background:rgba(108,99,255,.1);border:1px solid rgba(108,99,255,.2);color:rgba(255,255,255,.7);padding:10px 14px;border-radius:8px;font-size:.875rem;margin-bottom:16px}
    .quick-amounts{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
    .quick-btn{padding:8px 16px;background:rgba(108,99,255,.1);border:1px solid rgba(108,99,255,.3);border-radius:8px;color:#6C63FF;font-size:.875rem;cursor:pointer}
    .field-group{margin-bottom:16px}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .field-group label{display:block;color:rgba(255,255,255,.55);font-size:.83rem;margin-bottom:6px}
    .field-input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:11px 14px;color:#fff;font-size:.9rem;outline:none;transition:border-color .2s}
    .field-input:focus{border-color:#6C63FF}
    select.field-input option{background:#16161f}
    .submit-btn{background:#6C63FF;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:.95rem;font-weight:700;cursor:pointer;transition:all .2s}
    .submit-btn:hover:not(:disabled){background:#5a52e8;transform:translateY(-1px)}
    .submit-btn:disabled{opacity:.5;cursor:not-allowed}
    .submit-btn.danger{background:#FF4757}
    .submit-btn.small{padding:9px 18px;font-size:.85rem}
    .cancel-btn{background:rgba(255,255,255,.06);color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px 18px;font-size:.85rem;cursor:pointer}
    .form-actions{display:flex;gap:10px;margin-top:4px}
    .add-btn{background:rgba(108,99,255,.15);color:#6C63FF;border:1px solid rgba(108,99,255,.3);border-radius:8px;padding:8px 16px;font-size:.85rem;cursor:pointer}
    .add-method-form{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:20px;margin-bottom:20px}
    .methods-list{display:flex;flex-direction:column;gap:10px}
    .method-card{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px 16px}
    .method-icon{font-size:1.5rem}
    .method-info{flex:1}
    .method-name{font-size:.9rem;font-weight:600;color:#fff}
    .method-number{font-size:.85rem;color:rgba(255,255,255,.5);font-family:monospace;margin-top:2px}
    .method-meta{font-size:.75rem;color:rgba(255,255,255,.3);margin-top:2px}
    .badge-default{background:rgba(108,99,255,.15);color:#6C63FF;padding:3px 8px;border-radius:20px;font-size:.7rem;font-weight:600}
    .icon-btn{background:none;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:5px 10px;cursor:pointer;color:rgba(255,255,255,.6);font-size:.8rem;transition:all .2s}
    .icon-btn.danger{color:#FF4757}
    .empty-state{text-align:center;padding:32px;color:rgba(255,255,255,.3);font-size:.9rem}
  `]
})
export class WalletComponent implements OnInit {
  tab = signal('add');
  loading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  wallet = signal<any>(null);
  paymentMethods = signal<any[]>([]);
  showAddMethod = false;
  addAmount: number | null = null;
  addDesc = '';
  withdrawAmount: number | null = null;
  quickAmounts = [500, 1000, 2000, 5000, 10000];
  newMethod: any = { type: 'CREDIT_CARD', cardHolderName: '', cardNumber: '', expiryMonth: '', expiryYear: '', bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '' };

  constructor(private authService: AuthService, private walletService: WalletService) {}

  ngOnInit(): void { this.loadWallet(); }

  get userId(): number { return this.authService.currentUser!.id; }

  loadWallet(): void {
    this.walletService.getWallet(this.userId).subscribe({
      next: w => this.wallet.set(w),
      error: () => this.walletService.createWallet(this.userId).subscribe({ next: w => this.wallet.set(w), error: () => {} })
    });
  }

  addFunds(): void {
    if (!this.addAmount) return;
    this.loading.set(true); this.successMsg.set(''); this.errorMsg.set('');
    this.walletService.addFunds(this.userId, this.addAmount).subscribe({
      next: w => { this.wallet.set(w); this.loading.set(false); this.successMsg.set('Rs.' + this.addAmount + ' added successfully!'); this.addAmount = null; },
      error: (e: any) => { this.loading.set(false); this.errorMsg.set(e.error?.message || 'Failed to add funds'); }
    });
  }

  withdraw(): void {
    if (!this.withdrawAmount) return;
    this.loading.set(true); this.successMsg.set(''); this.errorMsg.set('');
    this.walletService.withdraw(this.userId, this.withdrawAmount).subscribe({
      next: w => { this.wallet.set(w); this.loading.set(false); this.successMsg.set('Rs.' + this.withdrawAmount + ' withdrawn!'); this.withdrawAmount = null; },
      error: (e: any) => { this.loading.set(false); this.errorMsg.set(e.error?.message || 'Withdrawal failed'); }
    });
  }

  loadPaymentMethods(): void {
    this.tab.set('methods');
    this.walletService.getPaymentMethods(this.userId).subscribe({ next: m => this.paymentMethods.set(m), error: () => {} });
  }

  addPaymentMethod(): void {
    this.walletService.addPaymentMethod(this.userId, this.newMethod).subscribe({
      next: m => { this.paymentMethods.update(arr => [...arr, m]); this.showAddMethod = false; this.newMethod = { type: 'CREDIT_CARD' }; },
      error: (e: any) => { this.errorMsg.set(e.error?.message || 'Failed'); }
    });
  }

  setDefault(id: number): void {
    this.walletService.setDefaultPaymentMethod(id, this.userId).subscribe({ next: () => this.loadPaymentMethods(), error: () => {} });
  }

  deleteMethod(id: number): void {
    this.walletService.deletePaymentMethod(id, this.userId).subscribe({ next: () => this.loadPaymentMethods(), error: () => {} });
  }
}
