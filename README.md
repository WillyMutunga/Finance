# Skysoft Finance — School Finance ERP
*(Powered by Skysoft Systems — Multi-Tenant Cloud SaaS)*

A multi-tenant, audit-compliant SaaS platform engineered for school fee collection, automated transaction reconciliation (M-Pesa Paybill / Till / STK Push & Bank Feeds), expense & procurement management, and parent mobile self-service.

---

## 🚀 Architecture & Tech Stack

- **Backend:** **PHP 8.2+** (Modular PSR-compliant REST API architecture)
- **Frontend:** **React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons**
- **Database:** **PostgreSQL** with multi-tenant row-level security (RLS), append-only immutable financial ledger tables, and audit logs.
- **Payment Channels:** Safaricom Daraja API (STK Push & C2B Webhook Confirmation) + Bank statement ingestion / API feeds.
- **Audit & Compliance:** Cryptographic SHA-256 ledger checksums, segregation-of-duties approval chains (Draft $\rightarrow$ Requested $\rightarrow$ Approved $\rightarrow$ Disbursed), and direct-from-ledger financial reporting (Cashbook, Trial Balance, Fee Register).

---

## 📁 Project Structure

```
Finance/
├── backend/                              # PHP REST API Backend
│   ├── app/
│   │   ├── Controllers/                  # Auth, Students, Fees, Payments, Recon, Expenses, Reports, Audit, Parent
│   │   ├── Database.php                  # PostgreSQL PDO singleton with tenant session binding
│   │   └── Services/
│   │       ├── LedgerService.php         # Append-only immutable ledger, reversals, SHA-256 hash validation
│   │       ├── ReconciliationEngine.php  # Automated rule-matching engine (Admission No, Phone, Fuzzy Ref)
│   │       ├── MPesaService.php          # Safaricom Daraja STK Push & C2B webhook processor
│   │       ├── ExpenseService.php        # 3-step approval workflow & LPO / Voucher issuance
│   │       ├── ReportService.php         # Audit Cashbook, Trial Balance, Fee Register
│   │       └── SMSService.php            # Templated SMS delivery with merge tags
│   ├── config/                           # Database & App configurations
│   ├── database/
│   │   ├── schema.sql                    # Full PostgreSQL DDL schema with RLS & indexes
│   │   └── seed.sql                      # Comprehensive seed dataset (Greenwood International Academy)
│   ├── public/
│   │   └── index.php                     # Front controller & REST API router with CORS
│   └── composer.json
├── frontend/                             # React SPA & Mobile-First Parent PWA
│   ├── src/
│   │   ├── components/                   # Navbar (role switcher), Sidebar
│   │   ├── pages/
│   │   │   ├── DashboardView.tsx         # Financial overview, expected vs collected, cashflow
│   │   │   ├── StudentsView.tsx          # Student roster, ledger statement modal, enrollment
│   │   │   ├── FeesView.tsx              # Fee structures, vote head breakdown, bulk invoicing
│   │   │   ├── ReconciliationView.tsx    # Live exception queue, confidence scoring, match logs
│   │   │   ├── PaymentsView.tsx          # Payments feed, manual receipting, printable PDF receipts, reversals
│   │   │   ├── ExpensesView.tsx          # Payment vouchers, LPOs, 3-tier approval workflow
│   │   │   ├── PledgesView.tsx           # Parent promises, due date alerts, SMS reminder dispatch
│   │   │   ├── ReportsView.tsx           # Live Cashbook, Trial Balance, Fee Register
│   │   │   ├── AuditView.tsx             # Cryptographic SHA-256 ledger integrity verifier, audit trail
│   │   │   └── ParentPortalView.tsx      # Mobile-first Parent PWA (Balance card, M-Pesa STK Pay Now, Receipts)
│   │   ├── services/
│   │   │   └── api.ts                    # Full-featured API client with interactive fallback
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript data models
│   │   ├── App.tsx                       # Main application shell
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Database Setup (PostgreSQL)
Create the database in PostgreSQL and run the schema and seed scripts:
```bash
# In PostgreSQL terminal or psql:
createdb school_finance_db
psql -d school_finance_db -f backend/database/schema.sql
psql -d school_finance_db -f backend/database/seed.sql
```

### 2. Run the PHP Backend
```bash
cd backend
php -S 127.0.0.1:8000 -t public
```
The REST API will be live at `http://127.0.0.1:8000`.

### 3. Run the React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 👥 Multi-Persona Testing & Roles

You can switch personas dynamically using the role bar in the top navigation:
1. **School Bursar (Admin):** Record cash/bank receipts, raise expense vouchers, review reconciliation exceptions, issue bulk fee invoices.
2. **Head Teacher / Director:** Approve expense vouchers, review term fee collection progress, high-level cashflow oversight.
3. **External Financial Auditor:** Read-only access to verify SHA-256 cryptographic ledger integrity, inspect reconciliation match decision evidence, and export Trial Balances.
4. **Parent / Guardian (Mobile PWA):** Check real-time fee balance, trigger 1-click M-Pesa STK Push payments, download official receipts, and make promissory payment pledges.

---

## 🔒 Audit & Compliance Highlights

- **Immutable Transaction Ledger:** Strict append-only records. Corrections are made via offsetting reversal entries with cross-referenced ledger IDs and mandatory audit reasons.
- **SHA-256 Cryptographic Integrity:** Every financial ledger entry generates a tamper-evident HMAC hash of `school_id | student_id | entry_type | debit | credit | timestamp`.
- **Segregation of Duties:** Vouchers move through `Requested` $\rightarrow$ `Approved by Head Teacher` $\rightarrow$ `Disbursed by Bursar`.
- **Automated Reconciliation Engine:** Matches incoming payments by:
  - Exact Admission Number ($100\%$ confidence)
  - Guardian Phone Number ($95\%$ confidence)
  - Fuzzy Student Reference ($85\%$ confidence)
  - Ambiguous / Unmatched items routed to the **Exceptions Queue** for bursar review with full audit logging.
