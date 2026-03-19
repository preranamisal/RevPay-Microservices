import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Wallet Service ──────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class WalletService {
  private base = `${environment.apiUrl}/wallets`;
  private pmBase = `${environment.apiUrl}/payment-methods`;
  constructor(private http: HttpClient) {}

  getWallet(userId: number): Observable<any> {
    return this.http.get(`${this.base}/${userId}`);
  }
  createWallet(userId: number): Observable<any> {
    return this.http.post(`${this.base}/create/${userId}`, {});
  }
  addFunds(userId: number, amount: number, paymentMethodId?: number): Observable<any> {
    return this.http.post(`${this.base}/${userId}/add-funds`, { amount, paymentMethodId });
  }
  withdraw(userId: number, amount: number): Observable<any> {
    return this.http.post(`${this.base}/${userId}/withdraw`, { amount });
  }
  getPaymentMethods(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.pmBase}/${userId}`);
  }
  addPaymentMethod(userId: number, data: any): Observable<any> {
    return this.http.post(`${this.pmBase}/${userId}`, data);
  }
  deletePaymentMethod(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.pmBase}/${id}/user/${userId}`);
  }
  setDefaultPaymentMethod(id: number, userId: number): Observable<any> {
    return this.http.put(`${this.pmBase}/${id}/user/${userId}/default`, {});
  }
}

// ── Transaction Service ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TransactionService {
  private base = `${environment.apiUrl}/transactions`;
  constructor(private http: HttpClient) {}

  sendMoney(data: any): Observable<any> {
    return this.http.post(`${this.base}/send`, data);
  }
  requestMoney(data: any): Observable<any> {
    return this.http.post(`${this.base}/request`, data);
  }
  acceptMoneyRequest(requestId: number, payerId: number): Observable<any> {
    return this.http.post(`${this.base}/requests/${requestId}/accept?payerId=${payerId}`, {});
  }
  rejectMoneyRequest(requestId: number, payerId: number): Observable<any> {
    return this.http.post(`${this.base}/requests/${requestId}/reject?payerId=${payerId}`, {});
  }
  getTransactions(userId: number, filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => { if (filters[k]) params = params.set(k, filters[k]); });
    return this.http.get(`${this.base}/user/${userId}`, { params });
  }
  getRecentTransactions(userId: number, limit = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/user/${userId}/recent?limit=${limit}`);
  }
  getPendingRequests(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/user/${userId}/pending-requests`);
  }
  getSummary(userId: number): Observable<any> {
    return this.http.get(`${this.base}/user/${userId}/summary`);
  }
  getTransaction(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }
}

// ── Invoice Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private base = `${environment.apiUrl}/invoices`;
  constructor(private http: HttpClient) {}

  createInvoice(data: any): Observable<any> {
    return this.http.post(this.base, data);
  }
  getBusinessInvoices(userId: number, page = 0): Observable<any> {
    return this.http.get(`${this.base}/business/${userId}?page=${page}&size=20`);
  }
  getClientInvoices(userId: number, page = 0): Observable<any> {
    return this.http.get(`${this.base}/client/${userId}?page=${page}&size=20`);
  }
  getInvoice(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }
  sendInvoice(id: number, businessUserId: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/send?businessUserId=${businessUserId}`, {});
  }
  payInvoice(id: number, clientUserId: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/pay?clientUserId=${clientUserId}`, {});
  }
  cancelInvoice(id: number, businessUserId: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/cancel?businessUserId=${businessUserId}`, {});
  }
  getAnalytics(businessUserId: number): Observable<any> {
    return this.http.get(`${this.base}/business/${businessUserId}/analytics`);
  }
}

// ── Loan Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class LoanService {
  private base = `${environment.apiUrl}/loans`;
  constructor(private http: HttpClient) {}

  applyForLoan(data: any): Observable<any> {
    return this.http.post(`${this.base}/apply`, data);
  }
  getUserLoans(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/user/${userId}`);
  }
  getLoan(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }
  makeRepayment(id: number, userId: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/repay?userId=${userId}`, {});
  }
  getEmiSchedule(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${id}/emi-schedule`);
  }
  getAnalytics(userId: number): Observable<any> {
    return this.http.get(`${this.base}/user/${userId}/analytics`);
  }
  getRepayments(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${id}/repayments`);
  }
}

// ── Notification Service ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiUrl}/notifications`;
  constructor(private http: HttpClient) {}

  getNotifications(userId: number, page = 0): Observable<any> {
    return this.http.get(`${this.base}/user/${userId}?page=${page}&size=20`);
  }
  getUnreadCount(userId: number): Observable<any> {
    return this.http.get(`${this.base}/user/${userId}/unread-count`);
  }
  markRead(id: number): Observable<any> {
    return this.http.put(`${this.base}/${id}/read`, {});
  }
  markAllRead(userId: number): Observable<any> {
    return this.http.put(`${this.base}/user/${userId}/read-all`, {});
  }
}

// ── User Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private base = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient) {}

  getUser(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }
  updateProfile(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/${id}/profile`, data);
  }
  changePassword(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/${id}/password`, data);
  }
  setPin(id: number, pin: string): Observable<any> {
    return this.http.post(`${this.base}/${id}/pin`, { pin });
  }
  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/search?query=${query}`);
  }
  completeKyc(id: number): Observable<any> {
    return this.http.post(`${this.base}/${id}/kyc/complete`, {});
  }
}
