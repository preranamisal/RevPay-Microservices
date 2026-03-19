import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { InvoiceService } from '../../core/services/api.services';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Invoices</h1>
        <button class="btn-primary" (click)="activeTab.set('create')">+ Create Invoice</button>
      </div>
      <div class="tabs">
        <button class="tab" [class.active]="activeTab()==='list'" (click)="activeTab.set('list');loadInvoices()">My Invoices</button>
        <button class="tab" [class.active]="activeTab()==='received'" (click)="activeTab.set('received');loadReceived()">Received</button>
        <button class="tab" [class.active]="activeTab()==='create'" (click)="activeTab.set('create')">Create Invoice</button>
      </div>
      <div class="panel" *ngIf="activeTab()==='create'">
        <h3 class="panel-title">Create New Invoice</h3>
        <div class="success-msg" *ngIf="successMsg()">{{ successMsg() }}</div>
        <div class="error-msg" *ngIf="errorMsg()">{{ errorMsg() }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label>Client User ID</label>
            <input type="number" [(ngModel)]="form.clientUserId" placeholder="Enter client user ID" class="input"/>
          </div>
          <div class="form-group">
            <label>Client Name</label>
            <input type="text" [(ngModel)]="form.clientName" placeholder="Client full name" class="input"/>
          </div>
          <div class="form-group">
            <label>Client Email</label>
            <input type="text" [(ngModel)]="form.clientEmail" placeholder="client@email.com" class="input"/>
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" [(ngModel)]="form.dueDate" class="input"/>
          </div>
          <div class="form-group">
            <label>Tax Rate (%)</label>
            <input type="number" [(ngModel)]="form.taxRate" placeholder="18" class="input"/>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <input type="text" [(ngModel)]="form.notes" placeholder="Optional notes" class="input"/>
          </div>
        </div>
        <h4 style="color:#fff;margin:0 0 12px">Line Items</h4>
        <div class="line-item" *ngFor="let item of form.lineItems; let i = index">
          <input type="text" [(ngModel)]="item.description" placeholder="Description" class="input li-desc"/>
          <input type="number" [(ngModel)]="item.quantity" placeholder="Qty" class="input li-qty"/>
          <input type="number" [(ngModel)]="item.unitPrice" placeholder="Unit Price" class="input li-price"/>
          <button class="btn-sm btn-red" (click)="removeItem(i)">X</button>
        </div>
        <button class="btn-sm btn-blue" style="margin-bottom:20px" (click)="addItem()">+ Add Line Item</button>
        <br/>
        <button class="btn-primary" (click)="createInvoice()" [disabled]="loading()">
          {{ loading() ? 'Creating...' : 'Create Invoice' }}
        </button>
      </div>
      <div class="panel" *ngIf="activeTab()==='list'">
        <h3 class="panel-title">My Invoices</h3>
        <div class="empty-state" *ngIf="invoices().length===0"><p>No invoices yet</p></div>
        <div class="invoice-card" *ngFor="let inv of invoices()">
          <div class="inv-top">
            <div>
              <div class="inv-ref">{{ inv.invoiceNumber }}</div>
              <div class="inv-desc">{{ inv.notes || 'Invoice' }} - To: {{ inv.clientName }}</div>
            </div>
            <div class="inv-right">
              <div class="inv-amount">Rs.{{ inv.totalAmount }}</div>
              <span class="status-pill" [ngClass]="'s-'+inv.status?.toLowerCase()">{{ inv.status }}</span>
            </div>
          </div>
          <div class="inv-bottom">
            <span>Due: {{ inv.dueDate | date:'dd MMM yyyy' }}</span>
            <div class="inv-actions">
              <button class="btn-sm btn-blue" *ngIf="inv.status==='DRAFT'" (click)="sendInvoice(inv.id)">Send</button>
              <button class="btn-sm btn-red" *ngIf="inv.status==='DRAFT'||inv.status==='SENT'" (click)="cancelInvoice(inv.id)">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <div class="panel" *ngIf="activeTab()==='received'">
        <h3 class="panel-title">Invoices Received</h3>
        <div class="empty-state" *ngIf="receivedInvoices().length===0"><p>No invoices received</p></div>
        <div class="invoice-card" *ngFor="let inv of receivedInvoices()">
          <div class="inv-top">
            <div>
              <div class="inv-ref">{{ inv.invoiceNumber }}</div>
              <div class="inv-desc">{{ inv.notes || 'Invoice' }}</div>
            </div>
            <div class="inv-right">
              <div class="inv-amount">Rs.{{ inv.totalAmount }}</div>
              <span class="status-pill" [ngClass]="'s-'+inv.status?.toLowerCase()">{{ inv.status }}</span>
            </div>
          </div>
          <div class="inv-bottom">
            <span>Due: {{ inv.dueDate | date:'dd MMM yyyy' }}</span>
            <button class="btn-sm btn-green" *ngIf="inv.status==='SENT'" (click)="payInvoice(inv.id)">Pay Now</button>
          </div>
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
    label{font-size:0.82rem;color:rgba(255,255,255,0.5);font-weight:600}
    .input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 14px;color:#fff;font-size:0.9rem;outline:none;width:100%;box-sizing:border-box}
    .line-item{display:flex;gap:8px;margin-bottom:10px;align-items:center}
    .li-desc{flex:3}.li-qty{flex:1}.li-price{flex:2}
    .btn-primary{background:#6c5ce7;color:#fff;border:none;border-radius:8px;padding:12px 24px;font-size:0.9rem;font-weight:600;cursor:pointer}
    .btn-primary:disabled{opacity:0.5}
    .success-msg{background:rgba(46,213,115,0.1);color:#2ed573;border:1px solid rgba(46,213,115,0.3);border-radius:8px;padding:12px;margin-bottom:16px}
    .error-msg{background:rgba(255,71,87,0.1);color:#FF4757;border:1px solid rgba(255,71,87,0.3);border-radius:8px;padding:12px;margin-bottom:16px}
    .invoice-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:12px}
    .inv-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
    .inv-ref{font-size:0.85rem;font-weight:700;color:#a29bfe}
    .inv-desc{font-size:0.9rem;color:rgba(255,255,255,0.7);margin-top:4px}
    .inv-right{text-align:right}
    .inv-amount{font-size:1.1rem;font-weight:700;color:#fff}
    .inv-bottom{display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:rgba(255,255,255,0.35)}
    .inv-actions{display:flex;gap:8px}
    .status-pill{padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;margin-top:4px;display:inline-block}
    .s-draft{background:rgba(255,165,2,0.1);color:#FFA502}
    .s-sent{background:rgba(116,185,255,0.1);color:#74b9ff}
    .s-paid{background:rgba(46,213,115,0.1);color:#2ed573}
    .s-cancelled{background:rgba(255,71,87,0.1);color:#FF4757}
    .btn-sm{padding:5px 12px;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer;border:none}
    .btn-blue{background:rgba(116,185,255,0.1);color:#74b9ff;border:1px solid rgba(116,185,255,0.3)}
    .btn-red{background:rgba(255,71,87,0.1);color:#FF4757;border:1px solid rgba(255,71,87,0.3)}
    .btn-green{background:rgba(46,213,115,0.1);color:#2ed573;border:1px solid rgba(46,213,115,0.3)}
    .empty-state{text-align:center;padding:40px;color:rgba(255,255,255,0.3)}
  `]
})
export class InvoicesComponent implements OnInit {
  activeTab = signal('list');
  invoices = signal<any[]>([]);
  receivedInvoices = signal<any[]>([]);
  loading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  form: any = { clientUserId: null, clientName: '', clientEmail: '', dueDate: '', taxRate: 18, notes: '', lineItems: [{ description: '', quantity: 1, unitPrice: null }] };

  constructor(private auth: AuthService, private invoiceService: InvoiceService) {}
  ngOnInit() { this.loadInvoices(); }
  addItem() { this.form.lineItems.push({ description: '', quantity: 1, unitPrice: null }); }
  removeItem(i: number) { this.form.lineItems.splice(i, 1); }
  loadInvoices() {
    const uid = this.auth.currentUser?.id; if (!uid) return;
    this.invoiceService.getBusinessInvoices(uid).subscribe({ next: (r: any) => this.invoices.set(r.content || r), error: () => {} });
  }
  loadReceived() {
    const uid = this.auth.currentUser?.id; if (!uid) return;
    this.invoiceService.getClientInvoices(uid).subscribe({ next: (r: any) => this.receivedInvoices.set(r.content || r), error: () => {} });
  }
  createInvoice() {
    const uid = this.auth.currentUser?.id; if (!uid) return;
    this.loading.set(true); this.successMsg.set(''); this.errorMsg.set('');
    const data = { businessUserId: uid, clientUserId: this.form.clientUserId, clientName: this.form.clientName, clientEmail: this.form.clientEmail, dueDate: this.form.dueDate, taxRate: this.form.taxRate, notes: this.form.notes, lineItems: this.form.lineItems };
    this.invoiceService.createInvoice(data).subscribe({
      next: () => { this.successMsg.set('Invoice created!'); this.loading.set(false); this.loadInvoices(); this.activeTab.set('list'); },
      error: (e: any) => { this.errorMsg.set('Failed: ' + (e.error?.message || e.status)); this.loading.set(false); }
    });
  }
  sendInvoice(id: number) { const uid = this.auth.currentUser?.id; if (!uid) return; this.invoiceService.sendInvoice(id, uid).subscribe({ next: () => this.loadInvoices(), error: () => {} }); }
  cancelInvoice(id: number) { const uid = this.auth.currentUser?.id; if (!uid) return; this.invoiceService.cancelInvoice(id, uid).subscribe({ next: () => this.loadInvoices(), error: () => {} }); }
  payInvoice(id: number) { const uid = this.auth.currentUser?.id; if (!uid) return; this.invoiceService.payInvoice(id, uid).subscribe({ next: () => this.loadReceived(), error: () => {} }); }
}
