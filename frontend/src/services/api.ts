import { Student, ExpenseVoucher, Pledge, FeeStructure, DashboardSummary, PaymentTransaction, ReconciliationMatch } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export class ApiService {
  private static defaultTenantId = 'a0000000-0000-0000-0000-000000000001';

  public static getTenantId(): string {
    return localStorage.getItem('tenant_id') || this.defaultTenantId;
  }

  public static setTenantId(id: string): void {
    localStorage.setItem('tenant_id', id);
  }

  public static getToken(): string | null {
    return localStorage.getItem('auth_token') || null;
  }

  public static setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  public static clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Tenant-Id': this.getTenantId(),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) || {})
      };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }
      return data;
    } catch (err: any) {
      if (options.method && options.method !== 'GET') {
        throw err;
      }
      console.warn(`API call ${endpoint} failed, falling back to local demo state:`, err);
      return this.mockFallback<T>(endpoint, options);
    }
  }

  // Auth & Session
  static async login(email: string, password?: string) {
    return this.request<{ status: string; message?: string; token: string; user: any; school: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static async switchRole(role: string) {
    return this.request<{ status: string; message?: string; token: string; user: any; school: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  }

  static async getMe() {
    return this.request<{ status: string; user: any; school: any }>('/auth/me');
  }

  // Dashboard
  static async getDashboard(params?: { timeframe?: string; start_date?: string; end_date?: string }) {
    const cleanParams: Record<string, string> = {};
    if (params?.timeframe) cleanParams.timeframe = params.timeframe;
    if (params?.start_date) cleanParams.start_date = params.start_date;
    if (params?.end_date) cleanParams.end_date = params.end_date;
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<{
      status: string;
      data: {
        summary: DashboardSummary;
        recent_payments: PaymentTransaction[];
        class_metrics: any[];
        supplier_balances?: any[];
        category_breakdown?: any[];
        term_info?: any;
      };
    }>(`/dashboard${qs ? `?${qs}` : ''}`);
  }

  // Students
  static async getStudents(params?: { class_id?: string; search?: string }) {
    const cleanParams: Record<string, string> = {};
    if (params?.class_id && params.class_id !== 'All' && params.class_id !== 'undefined') {
      cleanParams.class_id = params.class_id;
    }
    if (params?.search && params.search.trim() && params.search !== 'undefined') {
      cleanParams.search = params.search.trim();
    }
    const query = new URLSearchParams(cleanParams).toString();
    const endpoint = query ? `/students?${query}` : '/students';
    return this.request<{ status: string; data: Student[] }>(endpoint);
  }

  static async bulkUpdateStudents(data: {
    source_class_id?: string;
    action: string;
    student_ids?: string[];
    target_class_id?: string;
    target_stream_id?: string;
    boarding_status?: string;
    graduation_year?: string;
  }) {
    return this.request<{ status: string; message: string; count: number }>('/students/bulk-update', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getNextAdmissionNumber() {
    return this.request<{ status: string; data: { next_admission_number: string } }>('/students/next-admission-number');
  }

  static async getStudentDetails(id: string) {
    return this.request<{ status: string; data: any }>(`/students/${id}`);
  }

  static async createStudent(data: any) {
    return this.request<{ status: string; data: any; message?: string }>('/students', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateStudent(id: string, data: any) {
    return this.request<{ status: string; message: string }>('/students/' + id, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteStudent(id: string) {
    return this.request<{ status: string; message: string }>('/students/' + id, {
      method: 'DELETE'
    });
  }

  // Student Groups & Activities
  static async getStudentGroups() {
    return this.request<{ status: string; data: Array<{ id: string; name: string; category: string; patron: string; members_count: number }> }>('/student-groups');
  }

  static async createStudentGroup(data: { name: string; category: string; patron: string }) {
    return this.request<{ status: string; data: any; message: string }>('/student-groups', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getStudentGroupMembers(groupId: string) {
    return this.request<{ status: string; data: Array<any> }>(`/student-groups/${groupId}/members`);
  }

  static async assignStudentsToGroup(groupId: string, studentIds: string[]) {
    return this.request<{ status: string; message: string; members_count: number }>(`/student-groups/${groupId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ student_ids: studentIds })
    });
  }

  static async removeStudentFromGroup(groupId: string, studentId: string) {
    return this.request<{ status: string; message: string; members_count: number }>(`/student-groups/${groupId}/members/${studentId}`, {
      method: 'DELETE'
    });
  }

  // Fee Structures & Billing
  static async getFeeStructures() {
    return this.request<{ status: string; data: FeeStructure[] }>('/fees/structures');
  }

  static async createFeeStructure(data: {
    title: string;
    class_id: string;
    term_id: string;
    academic_year_id?: string;
    boarding_status?: string;
    items: Array<{ vote_head_id: string; amount: number; is_optional?: boolean }>;
    auto_invoice?: boolean;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/fees/structures', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateFeeStructure(id: string, data: {
    title: string;
    class_id: string;
    term_id: string;
    academic_year_id?: string;
    boarding_status?: string;
    items: Array<{ vote_head_id: string; amount: number; is_optional?: boolean }>;
  }) {
    return this.request<{ status: string; message: string; data: any }>(`/fees/structures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteFeeStructure(id: string) {
    return this.request<{ status: string; message: string }>(`/fees/structures/${id}`, {
      method: 'DELETE'
    });
  }

  static async getInvoices(params?: { term_id?: string; class_id?: string }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{ status: string; data: any[] }>(`/fees/invoices${q ? `?${q}` : ''}`);
  }

  static async getFeeVoteHeads() {
    return this.request<{ status: string; data: any[] }>('/fees/vote-heads');
  }

  static async bulkInvoice(feeStructureId: string) {
    return this.request<{ status: string; message: string; count: number }>('/fees/bulk-invoice', {
      method: 'POST',
      body: JSON.stringify({ fee_structure_id: feeStructureId })
    });
  }

  // Payments & Receipts
  static async getPayments() {
    return this.request<{ status: string; data: PaymentTransaction[] }>('/payments');
  }

  static async recordManualPayment(data: any) {
    return this.request<{ status: string; data: any }>('/payments/manual', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async recordPayment(data: any) {
    return this.recordManualPayment(data);
  }

  static async getReceipt(receiptId: string) {
    return this.request<{ status: string; data: any }>(`/receipts/${receiptId}`);
  }

  // Payment in Kind
  static async getPaymentsInKind() {
    return this.request<{ status: string; data: any[] }>('/payments/in-kind');
  }

  static async createPaymentInKind(data: {
    student_id: string;
    item_name: string;
    quantity: number;
    unit_of_measure?: string;
    unit_price: number;
    delivered_by?: string;
    notes?: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/payments/in-kind', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Bursaries & Scholarships
  static async getBursaries() {
    return this.request<{ status: string; data: any[] }>('/payments/bursaries');
  }

  static async createBursary(data: {
    student_id: string;
    sponsor_name: string;
    cheque_number?: string;
    amount: number;
    disbursement_date?: string;
    term_id?: string;
    notes?: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/payments/bursaries', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Grants & Capitation
  static async getGrants() {
    return this.request<{ status: string; data: any[] }>('/payments/grants');
  }

  static async createGrant(data: {
    grant_type?: string;
    title: string;
    amount: number;
    reference_number?: string;
    bank_account?: string;
    term_id?: string;
    notes?: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/payments/grants', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Overpayments
  static async getOverpayments() {
    return this.request<{ status: string; data: any[] }>('/payments/overpayments');
  }

  static async transferOverpayment(data: {
    source_student_id: string;
    target_student_id: string;
    amount: number;
    notes?: string;
  }) {
    return this.request<{ status: string; message: string }>('/payments/overpayments/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Payment Reversals (Maker-Checker)
  static async requestPaymentReversal(data: {
    payment_id?: string;
    receipt_number: string;
    student_id: string;
    amount: number;
    channel?: string;
    reason: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/payments/reversals/request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getPendingReversals() {
    return this.request<{ status: string; data: any[] }>('/payments/reversals/pending');
  }

  static async approvePaymentReversal(id: string) {
    return this.request<{ status: string; message: string; data?: any }>(`/payments/reversals/${id}/approve`, {
      method: 'POST'
    });
  }

  static async rejectPaymentReversal(id: string, rejectionReason?: string) {
    return this.request<{ status: string; message: string }>(`/payments/reversals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason })
    });
  }

  static async getReversedReceipts() {
    return this.request<{ status: string; data: any[] }>('/payments/reversals/reversed');
  }

  static async reversePayment(ledgerId: string, reason: string) {
    return this.request<{ status: string; data: any }>('/payments/reverse', {
      method: 'POST',
      body: JSON.stringify({ ledger_id: ledgerId, reason })
    });
  }

  // Automated Reconciliation
  static async getReconExceptions() {
    return this.request<{ status: string; count: number; data: PaymentTransaction[] }>('/reconciliation/exceptions');
  }

  static async triggerAutoReconcile() {
    return this.request<{ status: string; matched_count: number; message: string }>('/reconciliation/auto-reconcile', {
      method: 'POST'
    });
  }

  static async manualResolveException(transactionId: string, studentId: string, notes: string) {
    return this.request<{ status: string; data: any }>('/reconciliation/manual-resolve', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: transactionId, student_id: studentId, notes })
    });
  }

  static async getReconciliationMatches() {
    return this.request<{ status: string; data: ReconciliationMatch[] }>('/reconciliation/matches');
  }

  // Expenses & Vouchers
  static async getExpenses() {
    return this.request<{ status: string; data: ExpenseVoucher[] }>('/expenses');
  }

  static async getExpenseCategories() {
    return this.request<{ status: string; data: any[] }>('/expenses/categories');
  }

  static async createExpenseVoucher(data: any) {
    return this.request<{ status: string; data: any }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async approveVoucher(id: string) {
    return this.request<{ status: string; data: any }>(`/expenses/${id}/approve`, {
      method: 'POST'
    });
  }

  static async disburseVoucher(id: string) {
    return this.request<{ status: string; data: any }>(`/expenses/${id}/disburse`, {
      method: 'POST'
    });
  }

  static async cancelVoucher(id: string, reason?: string) {
    return this.request<{ status: string; data: any }>(`/expenses/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Local Purchase Orders (LPOs)
  static async getLpos() {
    return this.request<{ status: string; data: any[] }>('/expenses/lpos');
  }

  static async createLpo(data: {
    supplier_name: string;
    supplier_id?: string;
    items_description: string;
    quantity_details?: string;
    estimated_amount: number;
    delivery_date?: string;
    notes?: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/expenses/lpos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateLpoStatus(id: string, status: string) {
    return this.request<{ status: string; message: string; data: any }>(`/expenses/lpos/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  // Supplier Invoices & Bills
  static async getBills() {
    return this.request<{ status: string; data: any[] }>('/expenses/bills');
  }

  static async createBill(data: {
    supplier_name: string;
    supplier_id?: string;
    category_id?: string;
    lpo_id?: string;
    bill_number?: string;
    bill_date?: string;
    due_date?: string;
    amount: number;
    notes?: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/expenses/bills', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async payBill(id: string, amount: number) {
    return this.request<{ status: string; message: string; data: any }>(`/expenses/bills/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  // Suppliers Directory
  static async getSuppliers() {
    return this.request<{ status: string; data: any[] }>('/expenses/suppliers');
  }

  static async createSupplier(data: {
    name: string;
    category?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    bank_name?: string;
    bank_account_no?: string;
    kra_pin?: string;
    opening_balance?: number;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/expenses/suppliers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateSupplier(id: string, data: any) {
    return this.request<{ status: string; message: string; data: any }>(`/expenses/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteSupplier(id: string) {
    return this.request<{ status: string; message: string }>(`/expenses/suppliers/${id}`, {
      method: 'DELETE'
    });
  }

  // Supplier Take-Ons
  static async getSupplierTakeOns() {
    return this.request<{ status: string; data: any[] }>('/expenses/supplier-take-ons');
  }

  static async createSupplierTakeOn(data: {
    supplier_id: string;
    invoice_ref?: string;
    invoice_date?: string;
    amount: number;
    description?: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/expenses/supplier-take-ons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Fee Refunds
  static async getFeeRefunds() {
    return this.request<{ status: string; data: any[] }>('/expenses/fee-refunds');
  }

  static async createFeeRefund(data: {
    student_id: string;
    amount: number;
    payment_method?: string;
    cheque_number?: string;
    bank_account?: string;
    recipient_name?: string;
    reason: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/expenses/fee-refunds', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async approveFeeRefund(id: string) {
    return this.request<{ status: string; message: string; data: any }>(`/expenses/fee-refunds/${id}/approve`, {
      method: 'POST'
    });
  }

  static async disburseFeeRefund(id: string) {
    return this.request<{ status: string; message: string; data: any }>(`/expenses/fee-refunds/${id}/disburse`, {
      method: 'POST'
    });
  }

  // Petty Cash Float & Claims
  static async getPettyCash() {
    return this.request<{ status: string; data: { current_float_balance: number; entries: any[] } }>('/expenses/petty-cash');
  }

  static async recordPettyCash(data: {
    entry_type: 'FLOAT_TOPUP' | 'EXPENSE_CLAIM';
    amount: number;
    payee_name: string;
    category_id?: string;
    receipt_reference?: string;
    description: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/expenses/petty-cash', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Other Income & Alternative Revenues
  static async getOtherIncomeCategories() {
    return this.request<{ status: string; data: any[] }>('/other-income/categories');
  }

  static async createOtherIncomeCategory(data: { name: string; account_code?: string; description?: string }) {
    return this.request<{ status: string; data: any }>('/other-income/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getOtherIncomeCustomers() {
    return this.request<{ status: string; data: any[] }>('/other-income/customers');
  }

  static async createOtherIncomeCustomer(data: {
    name: string;
    customer_code?: string;
    category?: string;
    phone?: string;
    email?: string;
    kra_pin?: string;
    address?: string;
    opening_balance?: number;
  }) {
    return this.request<{ status: string; data: any }>('/other-income/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateOtherIncomeCustomer(id: string, data: any) {
    return this.request<{ status: string; data: any }>(`/other-income/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteOtherIncomeCustomer(id: string) {
    return this.request<{ status: string; message: string }>(`/other-income/customers/${id}`, {
      method: 'DELETE'
    });
  }

  static async getOtherIncomeInvoices() {
    return this.request<{ status: string; data: any[] }>('/other-income/invoices');
  }

  static async createOtherIncomeInvoice(data: {
    customer_id: string;
    category_id: string;
    amount: number;
    description: string;
    due_date: string;
    invoice_number?: string;
  }) {
    return this.request<{ status: string; data: any }>('/other-income/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async payOtherIncomeInvoice(id: string, data: {
    amount: number;
    payment_method: string;
    bank_account?: string;
    transaction_reference?: string;
    cheque_number?: string;
    description?: string;
  }) {
    return this.request<{ status: string; data: any }>(`/other-income/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getOtherIncomeReceipts() {
    return this.request<{ status: string; data: any[] }>('/other-income/receipts');
  }

  static async createOtherIncomeReceipt(data: {
    category_id: string;
    payer_name: string;
    amount: number;
    payment_method: string;
    bank_account?: string;
    customer_id?: string;
    invoice_id?: string;
    transaction_reference?: string;
    cheque_number?: string;
    description: string;
    receipt_date?: string;
  }) {
    return this.request<{ status: string; data: any }>('/other-income/receipts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getOtherIncomeTakeOns() {
    return this.request<{ status: string; data: any[] }>('/other-income/take-ons');
  }

  static async createOtherIncomeTakeOn(data: {
    customer_id: string;
    amount: number;
    description: string;
  }) {
    return this.request<{ status: string; data: any }>('/other-income/take-ons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getDonors() {
    return this.request<{ status: string; data: any[] }>('/other-income/donors');
  }

  static async createDonor(data: {
    name: string;
    donor_type?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    return this.request<{ status: string; data: any }>('/other-income/donors', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getDonations() {
    return this.request<{ status: string; data: any[] }>('/other-income/donations');
  }

  static async createDonation(data: {
    donor_id: string;
    amount: number;
    purpose: string;
    category_id?: string;
    payment_method?: string;
    bank_account?: string;
    transaction_reference?: string;
    donation_date?: string;
  }) {
    return this.request<{ status: string; data: any }>('/other-income/donations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Integrations & Bank Gateways
  static async getIntegrationsOverview() {
    return this.request<{
      status: string;
      data: {
        total_transactions_count: number;
        total_volume_amount: number;
        matched_transactions_count: number;
        pending_exceptions_count: number;
        auto_reconciliation_rate: number;
        active_gateways_count: number;
      };
    }>('/integrations/overview');
  }

  static async getBankIntegrations() {
    return this.request<{ status: string; data: any[] }>('/integrations/bank-accounts');
  }

  static async createBankIntegration(data: {
    bank_name: string;
    account_name: string;
    account_number: string;
    paybill?: string;
    branch?: string;
    auto_match_pattern?: string;
  }) {
    return this.request<{ status: string; data: any }>('/integrations/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateBankIntegration(id: string, data: any) {
    return this.request<{ status: string; data: any }>(`/integrations/bank-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteBankIntegration(id: string) {
    return this.request<{ status: string; message: string }>(`/integrations/bank-accounts/${id}`, {
      method: 'DELETE'
    });
  }

  static async getIntegratedTransactions(params?: { channel?: string; status?: string; q?: string }) {
    const query = new URLSearchParams();
    if (params?.channel) query.append('channel', params.channel);
    if (params?.status) query.append('status', params.status);
    if (params?.q) query.append('q', params.q);
    const qs = query.toString();
    return this.request<{ status: string; data: any[] }>(`/integrations/transactions${qs ? `?${qs}` : ''}`);
  }

  static async getSTKAttempts() {
    return this.request<{ status: string; data: any[] }>('/integrations/attempts');
  }

  static async triggerSTKPushPrompt(data: {
    phone_number: string;
    amount: number;
    account_reference: string;
    student_id?: string;
  }) {
    return this.request<{ status: string; data: any }>('/integrations/stk-push', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async simulateInboundPayment(data: {
    channel: string;
    amount: number;
    account_reference: string;
    payer_phone?: string;
    payer_name?: string;
    reference_number?: string;
  }) {
    return this.request<{ status: string; data: any }>('/integrations/simulate-payment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getIntegrationSettings() {
    return this.request<{ status: string; data: any }>('/integrations/settings');
  }

  static async updateIntegrationSettings(data: {
    mpesa_paybill?: string;
    sms_sender_id?: string;
    mpesa_consumer_key?: string;
    mpesa_consumer_secret?: string;
    mpesa_passkey?: string;
  }) {
    return this.request<{ status: string; data: any }>('/integrations/settings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Pledges
  static async getPledges() {
    return this.request<{ status: string; data: Pledge[] }>('/pledges');
  }

  static async createPledge(data: any) {
    return this.request<{ status: string; data: any }>('/pledges', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async sendPledgeReminder(id: string) {
    return this.request<{ status: string; message: string }>(`/pledges/${id}/remind`, {
      method: 'POST'
    });
  }

  // Reports Sub-System
  static async getCashbook(params?: {
    start_date?: string;
    end_date?: string;
    month?: string;
    year?: string;
    bank_account_id?: string;
    account_type_id?: string;
  }) {
    const cleanParams: Record<string, string> = {};
    if (params?.start_date) cleanParams.start_date = params.start_date;
    if (params?.end_date) cleanParams.end_date = params.end_date;
    if (params?.month) cleanParams.month = params.month;
    if (params?.year) cleanParams.year = params.year;
    if (params?.bank_account_id) cleanParams.bank_account_id = params.bank_account_id;
    if (params?.account_type_id) cleanParams.account_type_id = params.account_type_id;
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<{ status: string; data: any }>(`/reports/cashbook${qs ? `?${qs}` : ''}`);
  }

  static async getTrialBalance(asOfDate?: string) {
    const qs = asOfDate ? `?as_of_date=${encodeURIComponent(asOfDate)}` : '';
    return this.request<{ status: string; data: any }>(`/reports/trial-balance${qs}`);
  }

  static async getConsolidatedTrialBalance() {
    return this.request<{ status: string; data: any }>('/reports/consolidated-trial-balance');
  }

  static async getFeeRegister(params?: {
    class_id?: string;
    term_id?: string;
    academic_year_id?: string;
    status?: string;
    search?: string;
  }) {
    const cleanParams: Record<string, string> = {};
    if (params?.class_id && params.class_id !== 'ALL' && params.class_id !== 'undefined') cleanParams.class_id = params.class_id;
    if (params?.term_id && params.term_id !== 'ALL') cleanParams.term_id = params.term_id;
    if (params?.academic_year_id) cleanParams.academic_year_id = params.academic_year_id;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<{ status: string; data: any }>(`/reports/fee-register${qs ? `?${qs}` : ''}`);
  }

  static async getStudentBalancesPerTerm(params?: { academic_year_id?: string; class_id?: string }) {
    const cleanParams: Record<string, string> = {};
    if (params?.academic_year_id) cleanParams.academic_year_id = params.academic_year_id;
    if (params?.class_id && params.class_id !== 'ALL') cleanParams.class_id = params.class_id;
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<{ status: string; data: any }>(`/reports/student-balances-per-term${qs ? `?${qs}` : ''}`);
  }

  static async getStudentVoteHeadBalances(classId?: string) {
    const qs = classId && classId !== 'ALL' ? `?class_id=${encodeURIComponent(classId)}` : '';
    return this.request<{ status: string; data: any }>(`/reports/student-vote-head-balances${qs}`);
  }

  static async getIncomeSummary(params?: {
    start_date?: string;
    end_date?: string;
    summary_by?: string;
    account_type?: string;
  }) {
    const cleanParams: Record<string, string> = {};
    if (params?.start_date) cleanParams.start_date = params.start_date;
    if (params?.end_date) cleanParams.end_date = params.end_date;
    if (params?.summary_by) cleanParams.summary_by = params.summary_by;
    if (params?.account_type) cleanParams.account_type = params.account_type;
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<{ status: string; data: any }>(`/reports/income-summary${qs ? `?${qs}` : ''}`);
  }

  static async getExpenseSummary(params?: {
    start_date?: string;
    end_date?: string;
    category_id?: string;
  }) {
    const cleanParams: Record<string, string> = {};
    if (params?.start_date) cleanParams.start_date = params.start_date;
    if (params?.end_date) cleanParams.end_date = params.end_date;
    if (params?.category_id) cleanParams.category_id = params.category_id;
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<{ status: string; data: any }>(`/reports/expense-summary${qs ? `?${qs}` : ''}`);
  }

  static async getVoteHeadSummary(year?: string) {
    const qs = year ? `?year=${encodeURIComponent(year)}` : '';
    return this.request<{ status: string; data: any }>(`/reports/vote-head-summary${qs}`);
  }

  static async getStudentCollectionSummary(termId?: string) {
    const qs = termId ? `?term_id=${encodeURIComponent(termId)}` : '';
    return this.request<{ status: string; data: any }>(`/reports/student-collection-summary${qs}`);
  }

  static async getReceivedCheques() {
    return this.request<{ status: string; data: any }>('/reports/received-cheques');
  }

  static async getIpsasStatements(financialYear?: string) {
    const qs = financialYear ? `?financial_year=${encodeURIComponent(financialYear)}` : '';
    return this.request<{ status: string; data: any }>(`/reports/ipsas${qs}`);
  }

  static async getAgingReports(type: 'suppliers' | 'students' | 'customers' = 'suppliers') {
    return this.request<{ status: string; data: any }>(`/reports/aging?type=${type}`);
  }

  // Audit
  static async getAuditLogs() {
    return this.request<{ status: string; data: any[] }>('/audit/logs');
  }

  static async verifyLedger() {
    return this.request<{ status: string; data: any }>('/audit/verify-ledger');
  }

  // Configurations & School Profile
  static async getSchoolProfile() {
    return this.request<{ status: string; data: any }>('/school/profile');
  }

  static async updateSchoolProfile(data: any) {
    return this.request<{ status: string; data: any; message: string }>('/school/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async getAcademicYears() {
    return this.request<{ status: string; data: any[] }>('/academic-years');
  }

  static async createAcademicYear(data: { name?: string; start_date: string; end_date: string }) {
    return this.request<{ status: string; data: any; message: string }>('/academic-years', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getTerms() {
    return this.request<{ status: string; data: any[] }>('/terms');
  }

  static async createTerm(data: { name: string; start_date: string; end_date: string; academic_year_id?: string; is_current?: boolean }) {
    return this.request<{ status: string; data: any; message: string }>('/terms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async setActiveTerm(termId: string) {
    return this.request<{ status: string; data: any; message: string }>('/terms/set-active', {
      method: 'POST',
      body: JSON.stringify({ term_id: termId })
    });
  }

  static async getClasses() {
    return this.request<{ status: string; data: any[] }>('/classes');
  }

  static async createClass(data: { name: string; level_order?: number; default_stream?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async createStream(data: { class_id: string; name: string }) {
    return this.request<{ status: string; data: any; message: string }>('/streams', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Accounting Sub-System
  static async getAccountTypes() {
    return this.request<{ status: string; data: any[] }>('/accounting/account-types');
  }

  static async createAccountType(data: { name: string; code?: string; is_default?: boolean; description?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/accounting/account-types', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateAccountType(id: string, data: any) {
    return this.request<{ status: string; data: any; message: string }>(`/accounting/account-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteAccountType(id: string) {
    return this.request<{ status: string; message: string }>(`/accounting/account-types/${id}`, {
      method: 'DELETE'
    });
  }

  static async getVoteHeads() {
    return this.request<{ status: string; data: any[] }>('/accounting/vote-heads');
  }

  static async createVoteHead(data: { name: string; account_code?: string; is_optional?: boolean; description?: string; account_type_id?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/accounting/vote-heads', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateVoteHead(id: string, data: any) {
    return this.request<{ status: string; data: any; message: string }>(`/accounting/vote-heads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteVoteHead(id: string) {
    return this.request<{ status: string; message: string }>(`/accounting/vote-heads/${id}`, {
      method: 'DELETE'
    });
  }

  static async getAccounts() {
    return this.request<{ status: string; data: any[] }>('/accounting/accounts');
  }

  static async createAccount(data: {
    name: string;
    account_number: string;
    bank_name?: string;
    branch?: string;
    account_type?: string;
    account_type_id?: string;
    currency?: string;
    opening_balance?: number;
    is_cash_account?: boolean;
    status?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/accounting/accounts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateAccount(id: string, data: any) {
    return this.request<{ status: string; data: any; message: string }>(`/accounting/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteAccount(id: string) {
    return this.request<{ status: string; message: string }>(`/accounting/accounts/${id}`, {
      method: 'DELETE'
    });
  }

  static async getAccountTakeOns() {
    return this.request<{ status: string; data: any[] }>('/accounting/take-ons');
  }

  static async createAccountTakeOn(data: {
    account_name: string;
    account_id?: string;
    financial_year?: string;
    balance_type?: string;
    amount: number;
    as_of_date?: string;
    notes?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/accounting/take-ons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteAccountTakeOn(id: string) {
    return this.request<{ status: string; message: string }>(`/accounting/take-ons/${id}`, {
      method: 'DELETE'
    });
  }

  static async getTransfers() {
    return this.request<{ status: string; data: any[] }>('/accounting/transfers');
  }

  static async createTransfer(data: {
    from_account_id?: string;
    from_account?: string;
    to_account_id?: string;
    to_account?: string;
    amount: number;
    date?: string;
    transfer_date?: string;
    reference?: string;
    narration?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/accounting/transfers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getVoteHeadBudgets(year?: string) {
    const qs = year ? `?year=${year}` : '';
    return this.request<{
      status: string;
      data: {
        financial_year: string;
        summary: { total_budgeted: number; total_spent: number; total_remaining: number; overall_util: number };
        items: any[];
      };
    }>(`/accounting/budgets${qs}`);
  }

  static async setVoteHeadBudget(data: { vote_head_id: string; financial_year: string; budgeted_amount: number; notes?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/accounting/budgets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getJournalEntries() {
    return this.request<{ status: string; data: any[] }>('/accounting/journal');
  }

  static async createJournalEntry(data: {
    debit_account?: string;
    credit_account?: string;
    amount?: number;
    date?: string;
    entry_date?: string;
    reference?: string;
    narration: string;
    items?: any[];
  }) {
    return this.request<{ status: string; data: any; message: string }>('/accounting/journal', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getGeneralLedger(params?: { start_date?: string; end_date?: string }) {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return this.request<{ status: string; data: any[] }>(`/accounting/general-ledger${qs ? `?${qs}` : ''}`);
  }

  // Parent Mobile Portal
  static async getParentStudentSummary(lookup: string) {
    return this.request<{ status: string; data: any }>(`/parent/student/${lookup}`);
  }

  static async payMpesaSTK(studentId: string, phone: string, amount: number) {
    return this.request<{ status: string; data: any }>('/parent/pay-stk', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, phone, amount })
    });
  }

  // Adjustments & Waivers
  static async getAdjustments(type?: string) {
    const query = type ? `?type=${type}` : '';
    return this.request<{ status: string; data: any[] }>(`/fees/adjustments${query}`);
  }

  static async createAdjustment(data: { student_id: string; adjustment_type: string; amount: number; reason: string }) {
    return this.request<{ status: string; data: any; message: string }>('/fees/adjustments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }



  // M-Pesa C2B Simulation
  static async simulateMpesaC2B(data: {
    account_reference: string;
    amount: number;
    phone?: string;
    payer_name?: string;
    trans_id?: string;
  }) {
    return this.request<{ ResultCode: number; ResultDesc: string; reconciliation?: any }>('/webhooks/mpesa/simulate-c2b', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // SMS Broadcasting & Logs
  static async sendBulkSMS(data: {
    recipients: Array<{
      student_id?: string;
      student_name?: string;
      admission_number?: string;
      guardian_name?: string;
      phone: string;
      balance?: number;
    }>;
    template: string;
    message_type?: string;
  }) {
    return this.request<{ status: string; message: string; dispatched_count: number; cost_kes: number }>('/sms/send-bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getSMSLogs() {
    return this.request<{ status: string; data: any[] }>('/sms/logs');
  }

  // User Management & Access Control
  static async getUsers(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<{ status: string; data: any[]; total: number }>(`/users${query}`);
  }

  static async createUser(data: {
    name: string;
    username: string;
    password: string;
    phone?: string;
    role: string;
  }) {
    return this.request<{ status: string; message: string; data: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateUserStatus(id: string, isActive: boolean) {
    return this.request<{ status: string; message: string; data: any }>(`/users/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ is_active: isActive })
    });
  }

  static async resetUserPassword(id: string, password: string) {
    return this.request<{ status: string; message: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  }

  static async deleteUser(id: string | number) {
    return this.request<{ status: string; message: string }>(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Staff & Payroll Management
  static async getStatutoryRates() {
    return this.request<{ status: string; data: any }>('/staff/statutory-rates');
  }

  static async updateStatutoryRates(data: any) {
    return this.request<{ status: string; data: any; message: string }>('/staff/statutory-rates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getStaffDepartments() {
    return this.request<{ status: string; data: any[] }>('/staff/departments');
  }

  static async createStaffDepartment(data: { name: string; code?: string; head_title?: string; vote_head_name?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/staff/departments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteStaffDepartment(id: string) {
    return this.request<{ status: string; message: string }>(`/staff/departments/${id}`, {
      method: 'DELETE'
    });
  }

  static async getStaffAllowances() {
    return this.request<{ status: string; data: any[] }>('/staff/allowances');
  }

  static async createStaffAllowance(data: { name: string; type?: string; amount: number; taxable?: boolean; applies_to?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/staff/allowances', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteStaffAllowance(id: string) {
    return this.request<{ status: string; message: string }>(`/staff/allowances/${id}`, {
      method: 'DELETE'
    });
  }

  static async getStaffDeductions() {
    return this.request<{ status: string; data: any[] }>('/staff/deductions');
  }

  static async createStaffDeduction(data: { name: string; amount: number; type?: string; recipient?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/staff/deductions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteStaffDeduction(id: string) {
    return this.request<{ status: string; message: string }>(`/staff/deductions/${id}`, {
      method: 'DELETE'
    });
  }

  static async getStaffMembers(params?: { department?: string; q?: string }) {
    const query = new URLSearchParams();
    if (params?.department) query.append('department', params.department);
    if (params?.q) query.append('q', params.q);
    const qs = query.toString();
    return this.request<{ status: string; data: any[] }>(`/staff/members${qs ? `?${qs}` : ''}`);
  }

  static async createStaffMember(data: any) {
    return this.request<{ status: string; data: any; message: string }>('/staff/members', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateStaffMember(id: string, data: any) {
    return this.request<{ status: string; data: any; message: string }>(`/staff/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteStaffMember(id: string) {
    return this.request<{ status: string; message: string }>(`/staff/members/${id}`, {
      method: 'DELETE'
    });
  }

  static async getPayrollPeriod(month?: string) {
    const qs = month ? `?month=${encodeURIComponent(month)}` : '';
    return this.request<{
      status: string;
      data: {
        period_month: string;
        status: string;
        summary: {
          staff_count: number;
          total_gross: number;
          total_taxable: number;
          total_paye: number;
          total_nssf: number;
          total_shif: number;
          total_housing_levy: number;
          total_statutory: number;
          total_custom_deductions: number;
          total_net_payable: number;
        };
        lines: any[];
      };
    }>(`/payroll/period${qs}`);
  }

  static async processMonthlyPayroll(month: string) {
    return this.request<{ status: string; data: any; message: string }>('/payroll/process', {
      method: 'POST',
      body: JSON.stringify({ month })
    });
  }

  static async getStaffPayslip(staffId: string, month?: string) {
    const qs = month ? `?month=${encodeURIComponent(month)}` : '';
    return this.request<{ status: string; data: any }>(`/payroll/payslip/${staffId}${qs}`);
  }

  // Stores & Inventory Management
  static async getInventoryStores() {
    return this.request<{ status: string; data: any[] }>('/inventory/stores');
  }

  static async createInventoryStore(data: { name: string; code?: string; location?: string; manager?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/inventory/stores', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteInventoryStore(id: string) {
    return this.request<{ status: string; message: string }>(`/inventory/stores/${id}`, {
      method: 'DELETE'
    });
  }

  static async getInventoryCategories() {
    return this.request<{ status: string; data: any[] }>('/inventory/categories');
  }

  static async createInventoryCategory(data: { name: string; code?: string; description?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/inventory/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteInventoryCategory(id: string) {
    return this.request<{ status: string; message: string }>(`/inventory/categories/${id}`, {
      method: 'DELETE'
    });
  }

  static async getInventoryUnits() {
    return this.request<{ status: string; data: any[] }>('/inventory/units');
  }

  static async createInventoryUnit(data: { name: string; short_code?: string }) {
    return this.request<{ status: string; data: any; message: string }>('/inventory/units', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteInventoryUnit(id: string) {
    return this.request<{ status: string; message: string }>(`/inventory/units/${id}`, {
      method: 'DELETE'
    });
  }

  static async getInventoryItems(params?: { category_id?: string; store_id?: string; search?: string }) {
    const cleanParams: Record<string, string> = {};
    if (params?.category_id && params.category_id !== 'ALL') cleanParams.category_id = params.category_id;
    if (params?.store_id && params.store_id !== 'ALL') cleanParams.store_id = params.store_id;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<{
      status: string;
      data: {
        summary: {
          total_items: number;
          total_units: number;
          total_valuation: number;
          low_stock_count: number;
        };
        items: any[];
      };
    }>(`/inventory/items${qs ? `?${qs}` : ''}`);
  }

  static async createInventoryItem(data: any) {
    return this.request<{ status: string; data: any; message: string }>('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateInventoryItem(id: string, data: any) {
    return this.request<{ status: string; data: any; message: string }>(`/inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteInventoryItem(id: string) {
    return this.request<{ status: string; message: string }>(`/inventory/items/${id}`, {
      method: 'DELETE'
    });
  }

  static async recordInventoryTransaction(data: {
    item_id: string;
    transaction_type: 'SALE' | 'INTERNAL_ISSUE' | 'WASTAGE_DAMAGED' | 'STOCK_ADJUSTMENT' | 'PURCHASE_RECEIPT';
    quantity: number;
    unit_price?: number;
    total_amount?: number;
    recipient_department?: string;
    issued_to?: string;
    payment_method?: string;
    notes?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/inventory/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getInventoryTransactions(params?: { type?: string; item_id?: string }) {
    const cleanParams: Record<string, string> = {};
    if (params?.type && params.type !== 'ALL') cleanParams.type = params.type;
    if (params?.item_id) cleanParams.item_id = params.item_id;
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<{ status: string; data: any[] }>(`/inventory/transactions${qs ? `?${qs}` : ''}`);
  }

  static async getInventoryUsageReport() {
    return this.request<{ status: string; data: any[] }>('/inventory/usage-report');
  }

  // ==========================================
  // TRANSPORT MODULE
  // ==========================================
  static async getTransportVehicles() {
    return this.request<{ status: string; data: any[] }>('/transport/vehicles');
  }

  static async createTransportVehicle(data: {
    reg_no: string;
    model: string;
    capacity: number;
    driver_name?: string;
    driver_phone?: string;
    status?: string;
    mileage?: number;
    insurance_expiry?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/transport/vehicles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteTransportVehicle(id: string) {
    return this.request<{ status: string; message: string }>(`/transport/vehicles/${id}`, {
      method: 'DELETE'
    });
  }

  static async getTransportRoutes() {
    return this.request<{ status: string; data: any[] }>('/transport/routes');
  }

  static async createTransportRoute(data: {
    name: string;
    pickup_points: string;
    term_fee: number;
    vehicle_id?: string;
    return_trip_type?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/transport/routes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteTransportRoute(id: string) {
    return this.request<{ status: string; message: string }>(`/transport/routes/${id}`, {
      method: 'DELETE'
    });
  }

  static async getTransportStudents(routeId?: string) {
    const qs = routeId && routeId !== 'ALL' ? `?route_id=${routeId}` : '';
    return this.request<{ status: string; data: any[] }>(`/transport/students${qs}`);
  }

  static async assignTransportStudent(data: {
    student_id: string;
    route_id: string;
    pickup_point?: string;
    term_fee?: number;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/transport/students/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteTransportStudent(id: string) {
    return this.request<{ status: string; message: string }>(`/transport/students/${id}`, {
      method: 'DELETE'
    });
  }

  static async getTransportLogs(vehicleId?: string) {
    const qs = vehicleId ? `?vehicle_id=${vehicleId}` : '';
    return this.request<{ status: string; data: any[] }>(`/transport/logs${qs}`);
  }

  static async createTransportLog(data: {
    vehicle_id: string;
    log_type: string;
    amount: number;
    odometer_reading?: number;
    vendor?: string;
    notes?: string;
    log_date?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/transport/logs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==========================================
  // POCKET MONEY / STUDENT WALLETS
  // ==========================================
  static async getPocketMoneyWallets(search?: string, classId?: string) {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (classId && classId !== 'ALL') params.class_id = classId;
    const qs = new URLSearchParams(params).toString();
    return this.request<{
      status: string;
      data: {
        summary: {
          total_accounts: number;
          total_balance: number;
          total_deposits: number;
          total_withdrawn: number;
        };
        wallets: any[];
      };
    }>(`/pocket-money/wallets${qs ? `?${qs}` : ''}`);
  }

  static async recordPocketMoneyTransaction(data: {
    student_id: string;
    transaction_type: 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    channel?: string;
    served_by?: string;
    notes?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/pocket-money/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getPocketMoneyTransactions(studentId?: string, type?: string) {
    const params: Record<string, string> = {};
    if (studentId) params.student_id = studentId;
    if (type && type !== 'ALL') params.type = type;
    const qs = new URLSearchParams(params).toString();
    return this.request<{ status: string; data: any[] }>(`/pocket-money/transactions${qs ? `?${qs}` : ''}`);
  }

  // ==========================================
  // ASSETS REGISTER MODULE
  // ==========================================
  static async getAssetCategories() {
    return this.request<{ status: string; data: any[] }>('/assets/categories');
  }

  static async createAssetCategory(data: {
    name: string;
    code?: string;
    depreciation_type?: string;
    depreciation_method?: string;
    depreciation_rate?: number;
    description?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/assets/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteAssetCategory(id: string) {
    return this.request<{ status: string; message: string }>(`/assets/categories/${id}`, {
      method: 'DELETE'
    });
  }

  static async getAssets(categoryId?: string, search?: string) {
    const params: Record<string, string> = {};
    if (categoryId && categoryId !== 'ALL') params.category_id = categoryId;
    if (search) params.search = search;
    const qs = new URLSearchParams(params).toString();
    return this.request<{
      status: string;
      data: {
        summary: {
          total_assets: number;
          total_cost_value: number;
        };
        assets: any[];
      };
    }>(`/assets${qs ? `?${qs}` : ''}`);
  }

  static async createAsset(data: {
    name: string;
    category_id?: string;
    serial_no?: string;
    purchase_date?: string;
    purchase_cost: number;
    salvage_value?: number;
    useful_life_years?: number;
    location?: string;
    custodian_id?: string;
    condition?: string;
    status?: string;
    notes?: string;
  }) {
    return this.request<{ status: string; data: any; message: string }>('/assets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async deleteAsset(id: string) {
    return this.request<{ status: string; message: string }>(`/assets/${id}`, {
      method: 'DELETE'
    });
  }

  // ==========================================
  // MESSAGING & SMS GATEWAY
  // ==========================================

  static async sendSMSBroadcast(data: {
    recipients: Array<{
      student_id?: string;
      phone: string;
      student_name?: string;
      admission_number?: string;
      balance?: number;
    }>;
    template: string;
    message_type?: string;
  }) {
    return this.request<{ status: string; message: string; dispatched?: number }>('/messaging/send-broadcast', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

    // ==========================================
  // DELETION LOGS & AUDIT
  // ==========================================
  static async getDeletionAudits(entityType?: string) {
    const qs = entityType && entityType !== 'ALL' ? `?entity_type=${entityType}` : '';
    return this.request<{ status: string; data: any[] }>(`/audit/deletions${qs}`);
  }

  static async restoreDeletion(auditId: string) {
    return this.request<{ status: string; message: string }>('/audit/restore', {
      method: 'POST',
      body: JSON.stringify({ audit_id: auditId })
    });
  }

  // ==========================================
  // 1. BANK STATEMENTS & RECONCILIATION
  // ==========================================
  static async getBankStatements() {
    return this.request<{ status: string; data: any[] }>('/bank-recon/statements');
  }

  static async uploadBankStatement(data: { bank_name: string; account_number: string; statement_date: string; opening_balance: number; closing_balance: number; file_name?: string; lines: any[] }) {
    return this.request<{ status: string; message: string; data: any }>('/bank-recon/upload', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getBankStatementLines(statementId: string) {
    return this.request<{ status: string; data: any[] }>(`/bank-recon/statements/${statementId}/lines`);
  }

  static async matchBankStatementLine(lineId: string, studentId: string) {
    return this.request<{ status: string; message: string }>('/bank-recon/match-line', {
      method: 'POST',
      body: JSON.stringify({ line_id: lineId, student_id: studentId })
    });
  }

  static async getBankReconciliationReports() {
    return this.request<{ status: string; data: any[] }>('/bank-recon/reports');
  }

  static async createBankReconciliationReport(data: any) {
    return this.request<{ status: string; message: string; data: any }>('/bank-recon/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==========================================
  // 2. ACADEMIC PROMOTIONS & ROLLOVER
  // ==========================================
  static async getPromotions() {
    return this.request<{ status: string; data: any[] }>('/promotions');
  }

  static async previewPromotions(fromClassId?: string) {
    const qs = fromClassId ? `?from_class_id=${fromClassId}` : '';
    return this.request<{ status: string; data: { students: any[]; classes: any[] } }>(`/promotions/preview${qs}`);
  }

  static async executePromotions(data: { from_academic_year_id: string; to_academic_year_id: string; from_term_id: string; to_term_id: string; promotions: any[] }) {
    return this.request<{ status: string; message: string; data: any }>('/promotions/execute', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==========================================
  // 3. SIBLING RULES & SPONSORS
  // ==========================================
  static async getSiblingRules() {
    return this.request<{ status: string; data: any[] }>('/sponsors/sibling-rules');
  }

  static async createSiblingRule(data: any) {
    return this.request<{ status: string; message: string; data: any }>('/sponsors/sibling-rules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getDetectedSiblings() {
    return this.request<{ status: string; data: any[] }>('/sponsors/siblings-detected');
  }

  static async getSponsors() {
    return this.request<{ status: string; data: any[] }>('/sponsors');
  }

  static async createSponsor(data: any) {
    return this.request<{ status: string; message: string; data: any }>('/sponsors', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getSponsorAllocations() {
    return this.request<{ status: string; data: any[] }>('/sponsors/allocations');
  }

  static async createSponsorAllocation(data: any) {
    return this.request<{ status: string; message: string; data: any }>('/sponsors/allocations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==========================================
  // 4. STUDENT CLEARANCE WORKFLOW
  // ==========================================
  static async getClearanceRequests() {
    return this.request<{ status: string; data: any[] }>('/clearance/requests');
  }

  static async auditStudentClearance(studentId: string) {
    return this.request<{ status: string; data: any }>(`/clearance/audit/${studentId}`);
  }

  static async createClearanceRequest(data: { student_id: string; request_reason: string; remarks?: string }) {
    return this.request<{ status: string; message: string; data: any }>('/clearance/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==========================================
  // 5. KITCHEN RATIONS & BOARDING
  // ==========================================
  static async getKitchenRations(date?: string) {
    const qs = date ? `?date=${date}` : '';
    return this.request<{ status: string; data: any[] }>(`/kitchen/rations${qs}`);
  }

  static async logKitchenRation(data: any) {
    return this.request<{ status: string; message: string; data: any }>('/kitchen/rations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getKitchenCostAnalysis() {
    return this.request<{ status: string; data: any[] }>('/kitchen/cost-analysis');
  }

  // Fallback demo state simulation
  private static mockFallback<T>(endpoint: string, options: RequestInit): T {
    if (endpoint.includes('/dashboard')) {
      return {
        status: 'success',
        data: {
          summary: {
            total_students: 0,
            total_expected: 0,
            total_collected: 0,
            total_outstanding: 0,
            total_expenses: 0,
            net_cashflow: 0,
            collection_rate: 0,
            pending_pledges: 0,
            pledges_count: 0,
            unreconciled_count: 0
          },
          recent_payments: [],
          class_metrics: []
        }
      } as unknown as T;
    }

    return { status: 'success', data: [] } as unknown as T;
  }
}
