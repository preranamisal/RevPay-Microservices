import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LoanService } from '../../core/services/api.services';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Loans</h1>
        <button class="btn-primary" (click)="activeTab.set('apply')">+ Apply for Loan</button>
      </div>
      <div class="tabs">
        <button class="tab" [class.active]="activeTab()==='list'" (click)="activeTab.set('list');loadLoans()">My Loans</button>
        <button class="tab" [class.active]="activeTab()==='apply'" (click)="activeTab.set('apply')">Apply</button>
      </div>
      <div class="panel" *ngIf="activeTab()==='apply'">
        <h3 class="panel-title">Apply for a Loan</h3>
        <div class="success-msg" *ngIf="successMsg()">{{ successMsg() }}</div>
        <div class="error-msg" *ngIf="errorMsg()">{{ errorMsg() }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label>Loan Amount (Rs.)</label>
            <input type="number" [(ngModel)]="form.requestedAmount" placeholder="50000" class="input" (ngModelChange)="updateCalc()"/>
          </div>
          <div class="form-group">
            <label>Duration (months)</label>
            <input type="number" [(ngModel)]="form.tenureMonths" placeholder="12" class="input" (ngModelChange)="updateCalc()"/>
          </div>
          <div class="form-group full">
            <label>Purpose</label>
            <input type="text" [(ngModel)]="form.purpose" placeholder="Business expansion, equipment, etc." class="input"/>
          </div>
        </div>
        <div class="loan-info" *ngIf="form.requestedAmount && form.tenureMonths">
          <div class="info-row"><span>Interest Rate</span><span>12% p.a.</span></div>
          <div class="info-row"><span>Monthly EMI (approx)</span><span>Rs.{{ emi() }}</span></div>
          <div class="info-row"><span>Total Payable (approx)</span><span>Rs.{{ total() }}</span></div>
        </div>
        <button class="btn-primary" (click)="applyLoan()" [disabled]="loading()">
          {{ loading() ? 'Applying...' : 'Submit Application' }}
        </button>
      </div>
      <div class="panel" *ngIf="activeTab()==='list'">
        <h3 class="panel-title">My Loans</h3>
        <div class="empty-state" *ngIf="loans().length===0"><p>No loans yet. Apply for one!</p></div>
        <div class="loan-card" *ngFor="let loan of loans()">
          <div class="loan-top">
            <div>
              <div class="loan-ref">{{ loan.applicationNumber }}</div>
              <div class="loan-purpose">{{ loan.purpose }}</div>
            </div>
            <div class="loan-right">
              <div class="loan-amount">Rs.{{ loan.requestedAmount }}</div>
              <span class="status-pill" [ngClass]="'s-'+loan.status?.toLowerCase()">{{ loan.status }}</span>
            </div>
          </div>
          <div class="loan-stats">
            <div class="stat"><span class="stat-label">EMI</span><span class="stat-val">{{ loan.emiAmount || 'TBD' }}</span></div>
            <div class="stat"><span class="stat-label">Tenure</span><span class="stat-val">{{ loan.tenureMonths }}m</span></div>
            <div class="stat"><span class="stat-label">Outstanding</span><span class="stat-val">{{ loan.outstandingAmount || loan.requestedAmount }}</span></div>
            <div class="stat"><span class="stat-label">Rate</span><span class="stat-val">{{ loan.interestRate || '12' }}%</span></div>
          </div>
          <button class="btn-sm btn-green" *ngIf="loan.status==='ACTIVE'" (click)="repay(loan.id)">Make Repayment</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:32px;font-family:'Segoe UI',system-ui,sans-serif}
    .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
    .page-title{font-size:1.75rem;font-weight:800;color:#fff;margin:0}
    .tabs{display:flex;gap:8px;margin-bottom:24px}
    .tab{padding:8px 20px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:rgba(255,255,255,0.5);cursor:pointer;font-size:0.9rem}
    .tab.active{background:#6c5ce7;color:#fff;border-color:#6c5ce7}
    .panel{background:#16161f;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:28px;margin-bottom:20px}
    .panel-title{font-size:1.1rem;font-weight:700;color:#fff;margin:0 0 20px}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
    .form-group{display:flex;flex-direction:column;gap:6px}
    .form-group.full{grid-column:span 2}
    label{font-size:0.82rem;color:rgba(255,255,255,0.5);font-weight:600}
    .input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 14px;color:#fff;font-size:0.9rem;outline:none;width:100%;box-sizing:border-box}
    .btn-primary{background:#6c5ce7;color:#fff;border:none;border-radius:8px;padding:12px 24px;font-size:0.9rem;font-weight:600;cursor:pointer}
    .btn-primary:disabled{opacity:0.5}
    .success-msg{background:rgba(46,213,115,0.1);color:#2ed573;border:1px solid rgba(46,213,115,0.3);border-radius:8px;padding:12px;margin-bottom:16px}
    .error-msg{background:rgba(255,71,87,0.1);color:#FF4757;border:1px solid rgba(255,71,87,0.3);border-radius:8px;padding:12px;margin-bottom:16px}
    .loan-info{background:rgba(108,92,231,0.08);border:1px solid rgba(108,92,231,0.2);border-radius:10px;padding:16px;margin-bottom:20px}
    .info-row{display:flex;justify-content:space-between;padding:6px 0;font-size:0.88rem;color:rgba(255,255,255,0.7);border-bottom:1px solid rgba(255,255,255,0.04)}
    .info-row:last-child{border-bottom:none;font-weight:700;color:#fff}
    .loan-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:12px}
    .loan-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
    .loan-ref{font-size:0.85rem;font-weight:700;color:#a29bfe}
    .loan-purpose{font-size:0.9rem;color:rgba(255,255,255,0.7);margin-top:4px}
    .loan-right{text-align:right}
    .loan-amount{font-size:1.1rem;font-weight:700;color:#fff}
    .loan-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
    .stat{background:rgba(255,255,255,0.03);border-radius:8px;padding:10px;text-align:center}
    .stat-label{display:block;font-size:0.72rem;color:rgba(255,255,255,0.35);margin-bottom:4px}
    .stat-val{font-size:0.88rem;font-weight:700;color:#fff}
    .status-pill{padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;margin-top:4px;display:inline-block}
    .s-pending{background:rgba(255,165,2,0.1);color:#FFA502}
    .s-approved{background:rgba(116,185,255,0.1);color:#74b9ff}
    .s-active{background:rgba(46,213,115,0.1);color:#2ed573}
    .s-closed{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.3)}
    .s-rejected{background:rgba(255,71,87,0.1);color:#FF4757}
    .btn-sm{padding:7px 16px;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer;border:none}
    .btn-green{background:rgba(46,213,115,0.1);color:#2ed573;border:1px solid rgba(46,213,115,0.3)}
    .empty-state{text-align:center;padding:40px;color:rgba(255,255,255,0.3)}
  `]
})
export class LoansComponent implements OnInit {
  activeTab = signal('list');
  loans = signal<any[]>([]);
  loading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  emi = signal('0');
  total = signal('0');
  form: any = { requestedAmount: null, tenureMonths: 12, purpose: '' };

  constructor(private auth: AuthService, private loanService: LoanService) {}
  ngOnInit() { this.loadLoans(); }

  updateCalc() {
    if (!this.form.requestedAmount || !this.form.tenureMonths) return;
    const r = 12 / 12 / 100, n = Number(this.form.tenureMonths), p = Number(this.form.requestedAmount);
    const e = p * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
    this.emi.set(e.toFixed(2)); this.total.set((e*n).toFixed(2));
  }

  loadLoans() {
    const uid = this.auth.currentUser?.id; if (!uid) return;
    this.loanService.getUserLoans(uid).subscribe({ next: r => this.loans.set(r), error: () => {} });
  }

  applyLoan() {
    const uid = this.auth.currentUser?.id; if (!uid) return;
    this.loading.set(true); this.successMsg.set(''); this.errorMsg.set('');
    const data = { businessUserId: uid, requestedAmount: this.form.requestedAmount, tenureMonths: this.form.tenureMonths, purpose: this.form.purpose };
    this.loanService.applyForLoan(data).subscribe({
      next: () => { this.successMsg.set('Loan application submitted!'); this.loading.set(false); this.loadLoans(); this.activeTab.set('list'); },
      error: (e: any) => { this.errorMsg.set('Failed: ' + (e.error?.message || e.status)); this.loading.set(false); }
    });
  }

  repay(id: number) {
    const uid = this.auth.currentUser?.id; if (!uid) return;
    this.loanService.makeRepayment(id, uid).subscribe({ next: () => this.loadLoans(), error: () => {} });
  }
}
