-- ============================================================================
-- School Fees & Finance Management System - PostgreSQL Schema Migration
-- Designed for Multi-Tenancy, Immutable Ledger & Audit Compliance
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schools (Tenants)
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    logo_url TEXT,
    currency VARCHAR(10) DEFAULT 'KES',
    mpesa_paybill VARCHAR(50),
    mpesa_consumer_key TEXT,
    mpesa_consumer_secret TEXT,
    mpesa_passkey TEXT,
    sms_sender_id VARCHAR(50) DEFAULT 'SCHOOLFIN',
    sms_api_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Bursars, Headteachers, Accountants, Auditors, Platform Admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'bursar', 'head_teacher', 'auditor', 'parent')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_school_user_email UNIQUE (school_id, email)
);

-- 3. Academic Years & Terms
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g. "2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g. "Term 1", "Term 2", "Term 3"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Classes / Grades & Streams
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Form 1", "Grade 7"
    level_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "East", "Blue"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Guardians & Students
CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    id_number VARCHAR(50),
    relationship VARCHAR(50) DEFAULT 'Parent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_school_guardian_phone UNIQUE (school_id, phone)
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    admission_number VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    date_of_birth DATE,
    class_id UUID NOT NULL REFERENCES classes(id),
    stream_id UUID REFERENCES streams(id),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRANSFERRED', 'GRADUATED')),
    boarding_status VARCHAR(50) DEFAULT 'DAY' CHECK (boarding_status IN ('DAY', 'BOARDING')),
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_school_admission UNIQUE (school_id, admission_number)
);

CREATE TABLE IF NOT EXISTS student_guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_guardian UNIQUE (student_id, guardian_id)
);

-- 6. Fee Vote Heads & Structures
CREATE TABLE IF NOT EXISTS vote_heads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Tuition", "Boarding", "RMI", "Activity", "Transport"
    account_code VARCHAR(50),
    is_optional BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    term_id UUID NOT NULL REFERENCES terms(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_structure_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    vote_head_id UUID NOT NULL REFERENCES vote_heads(id),
    amount NUMERIC(12, 2) NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Fee Invoices (Per Student Billing)
CREATE TABLE IF NOT EXISTS fee_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    term_id UUID NOT NULL REFERENCES terms(id),
    fee_structure_id UUID REFERENCES fee_structures(id),
    total_billed NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_school_invoice_no UNIQUE (school_id, invoice_number)
);

-- 8. Raw Inbound Payment Transactions (M-Pesa C2B / STK / Bank Feeds)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('MPESA_C2B', 'MPESA_STK', 'BANK_TRANSFER', 'BANK_DEPOSIT', 'CASH', 'CHEQUE')),
    reference_number VARCHAR(100) NOT NULL, -- e.g. M-Pesa TransID (QHD382...)
    amount NUMERIC(12, 2) NOT NULL,
    payer_phone VARCHAR(50),
    payer_name VARCHAR(255),
    account_reference VARCHAR(100), -- BillRefNumber entered by parent
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    raw_payload JSONB,
    reconciliation_status VARCHAR(50) DEFAULT 'UNMATCHED' CHECK (reconciliation_status IN ('AUTO_MATCHED', 'MANUALLY_MATCHED', 'UNMATCHED', 'AMBIGUOUS', 'IGNORED')),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_school_payment_ref UNIQUE (school_id, channel, reference_number)
);

-- 9. Immutable Transaction Ledger (Core Financial Source of Truth)
CREATE TABLE IF NOT EXISTS transaction_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    term_id UUID REFERENCES terms(id),
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('INVOICE_CHARGE', 'PAYMENT_CREDIT', 'REVERSAL', 'DISCOUNT_WAIVER', 'REFUND_DEBIT')),
    debit_amount NUMERIC(12, 2) DEFAULT 0.00,
    credit_amount NUMERIC(12, 2) DEFAULT 0.00,
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    receipt_number VARCHAR(100),
    original_ledger_id UUID REFERENCES transaction_ledger(id), -- For reversals
    description TEXT NOT NULL,
    recorded_by_user_id UUID REFERENCES users(id),
    checksum VARCHAR(64) NOT NULL, -- SHA-256 tamper-evident hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Receipts
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id),
    ledger_entry_id UUID NOT NULL REFERENCES transaction_ledger(id),
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    reference_code VARCHAR(100),
    pdf_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_school_receipt_no UNIQUE (school_id, receipt_number)
);

-- 11. Reconciliation Matches & Exception Queue
CREATE TABLE IF NOT EXISTS reconciliation_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    ledger_entry_id UUID REFERENCES transaction_ledger(id),
    receipt_id UUID REFERENCES receipts(id),
    match_strategy VARCHAR(100) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    matched_by_user_id UUID REFERENCES users(id),
    match_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Pledges & Promissory Payments
CREATE TABLE IF NOT EXISTS pledges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    guardian_id UUID REFERENCES guardians(id),
    amount NUMERIC(12, 2) NOT NULL,
    pledge_date DATE NOT NULL,
    expected_payment_date DATE NOT NULL,
    fulfilled_amount NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'FULFILLED', 'OVERDUE', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Expense Categories, Vouchers & Approval Workflow
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    voucher_number VARCHAR(100) NOT NULL,
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    term_id UUID REFERENCES terms(id),
    payee_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'MPESA_B2C', 'CHEQUE', 'PETTY_CASH')),
    description TEXT NOT NULL,
    lpo_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REQUESTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED', 'VOID')),
    requested_by_user_id UUID NOT NULL REFERENCES users(id),
    approved_by_user_id UUID REFERENCES users(id),
    disbursed_by_user_id UUID REFERENCES users(id),
    disbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_school_voucher_no UNIQUE (school_id, voucher_number)
);

-- 14. Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    ip_address VARCHAR(50),
    user_agent TEXT,
    before_state JSONB,
    after_state JSONB,
    checksum VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. SMS Notification Logs
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(50) NOT NULL,
    student_id UUID REFERENCES students(id),
    message_type VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'SENT',
    provider_message_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_adm ON students(school_id, admission_number);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(school_id, phone);
CREATE INDEX IF NOT EXISTS idx_ledger_school_student ON transaction_ledger(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON transaction_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_trans_ref ON payment_transactions(school_id, reference_number);
CREATE INDEX IF NOT EXISTS idx_payment_trans_recon ON payment_transactions(school_id, reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_vouchers_school_status ON expense_vouchers(school_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_school_created ON audit_logs(school_id, created_at);
