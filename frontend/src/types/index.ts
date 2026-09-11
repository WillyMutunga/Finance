export type UserRole = 'super_admin' | 'school_admin' | 'bursar' | 'head_teacher' | 'auditor' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  school_id: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  currency: string;
  mpesa_paybill: string;
  sms_sender_id?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender?: string;
  class_id: string;
  class_name: string;
  stream_name?: string;
  boarding_status: 'DAY' | 'BOARDING';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRANSFERRED' | 'GRADUATED';
  guardian_id?: string;
  guardian_name?: string;
  guardian_phone?: string;
  relationship?: string;
  total_billed: number;
  total_paid: number;
  balance: number;
}

export interface LedgerEntry {
  id: string;
  student_id: string;
  entry_type: 'INVOICE_CHARGE' | 'PAYMENT_CREDIT' | 'REVERSAL' | 'DISCOUNT_WAIVER';
  debit_amount: number;
  credit_amount: number;
  receipt_number?: string;
  description: string;
  checksum: string;
  created_at: string;
  recorded_by_name?: string;
}

export interface PaymentTransaction {
  id: string;
  channel: 'MPESA_C2B' | 'MPESA_STK' | 'BANK_TRANSFER' | 'BANK_DEPOSIT' | 'CASH' | 'CHEQUE';
  reference_number: string;
  amount: number;
  payer_name?: string;
  payer_phone?: string;
  account_reference?: string;
  payment_date: string;
  reconciliation_status: 'AUTO_MATCHED' | 'MANUALLY_MATCHED' | 'UNMATCHED' | 'AMBIGUOUS';
  receipt_number?: string;
  first_name?: string;
  last_name?: string;
  admission_number?: string;
  class_name?: string;
}

export interface ReconciliationMatch {
  id: string;
  payment_transaction_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  reference_number: string;
  amount: number;
  payer_name: string;
  payer_phone: string;
  match_strategy: string;
  confidence_score: number;
  receipt_number: string;
  matched_by_name?: string;
  match_notes?: string;
  created_at: string;
}

export interface ExpenseVoucher {
  id: string;
  voucher_number: string;
  category_id: string;
  category_name: string;
  category_code?: string;
  payee_name: string;
  amount: number;
  payment_method: 'BANK_TRANSFER' | 'MPESA_B2C' | 'CHEQUE' | 'PETTY_CASH';
  description: string;
  lpo_number?: string;
  status: 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  requested_by_name: string;
  approved_by_name?: string;
  disbursed_by_name?: string;
  created_at: string;
  disbursed_at?: string;
}

export interface Pledge {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name: string;
  guardian_name?: string;
  guardian_phone?: string;
  amount: number;
  fulfilled_amount: number;
  pledge_date: string;
  expected_payment_date: string;
  status: 'PENDING' | 'PARTIAL' | 'FULFILLED' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
}

export interface FeeStructure {
  id: string;
  title: string;
  class_name: string;
  term_name: string;
  boarding_status?: 'DAY' | 'BOARDING' | 'ALL';
  total_amount: number;
  items: Array<{
    id: string;
    vote_head_name: string;
    amount: number;
    is_optional: boolean;
  }>;
}

export interface DashboardSummary {
  timeframe?: string;
  total_students: number;
  total_expected: number;
  total_collected: number;
  total_outstanding: number;
  total_expenses: number;
  net_cashflow: number;
  collection_rate: number;
  pending_pledges: number;
  pledges_count: number;
  unreconciled_count: number;
}

// 1. Bank Reconciliation Types
export interface BankStatement {
  id: string;
  bank_name: string;
  account_number: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  file_name?: string;
  total_lines_count: number;
  matched_lines_count: number;
  uploaded_by_name?: string;
  created_at: string;
}

export interface BankStatementLine {
  id: string;
  statement_id: string;
  transaction_date: string;
  reference_number?: string;
  description: string;
  debit: number;
  credit: number;
  running_balance?: number;
  reconciliation_status: 'UNMATCHED' | 'MATCHED' | 'EXCLUDED';
  matched_student_id?: string;
  first_name?: string;
  last_name?: string;
  admission_number?: string;
  class_name?: string;
}

export interface BankReconReport {
  id: string;
  reconciliation_date: string;
  statement_closing_balance: number;
  cashbook_balance: number;
  unpresented_cheques_total: number;
  deposits_in_transit_total: number;
  bank_charges_total: number;
  adjusted_bank_balance: number;
  adjusted_cashbook_balance: number;
  variance: number;
  status: 'RECONCILED' | 'DISCREPANCY';
  reconciled_by_name?: string;
  notes?: string;
  bank_name?: string;
  account_number?: string;
}

// 2. Academic Promotion Types
export interface AcademicPromotion {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  from_class_name: string;
  to_class_name?: string;
  from_year_name: string;
  to_year_name: string;
  action_type: 'PROMOTED' | 'RETAINED' | 'GRADUATED' | 'TRANSFERRED';
  carried_forward_balance: number;
  created_at: string;
}

// 3. Sibling & Sponsor Types
export interface SiblingRule {
  id: string;
  name: string;
  child_order: number;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  vote_head_name?: string;
  is_active: boolean;
}

export interface SiblingFamily {
  guardian_phone: string;
  guardian_name: string;
  sibling_count: number;
  children: Array<{
    student_id: string;
    admission_number: string;
    name: string;
    class_name: string;
    dob?: string;
  }>;
}

export interface Sponsor {
  id: string;
  name: string;
  code: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  sponsored_students_count: number;
  total_allocated: number;
  total_disbursed: number;
}

export interface SponsorAllocation {
  id: string;
  sponsor_name: string;
  sponsor_code: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name: string;
  term_name?: string;
  year_name?: string;
  allocated_amount: number;
  disbursed_amount: number;
  claim_reference: string;
  status: string;
}

// 4. Student Clearance Types
export interface ClearanceRequest {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name: string;
  request_reason: string;
  finance_status: string;
  finance_balance: number;
  library_status: string;
  boarding_status: string;
  sports_status: string;
  overall_status: string;
  certificate_number?: string;
  cleared_at?: string;
  cleared_by_name?: string;
  created_at: string;
}

// 5. Kitchen Ration Types
export interface DailyRationLog {
  id: string;
  log_date: string;
  meal_type: string;
  boarder_count: number;
  item_name?: string;
  unit_of_measure?: string;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  logged_by_name?: string;
  notes?: string;
}

export interface KitchenCostAnalysis {
  log_date: string;
  daily_total_cost: number;
  total_boarders: number;
  cost_per_boarder: number;
}

