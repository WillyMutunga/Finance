<?php

namespace App\Controllers;

use App\Database;
use PDO;

class DashboardController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function index(): void
    {
        $schoolId = Database::getTenantId();
        $timeframe = $_GET['timeframe'] ?? 'This Term';
        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;

        // Fetch current term & academic year info
        $stmtTerm = $this->db->prepare("
            SELECT t.*, ay.name as academic_year_name 
            FROM terms t 
            LEFT JOIN academic_years ay ON t.academic_year_id = ay.id
            WHERE t.school_id = :school_id AND t.is_current = TRUE 
            LIMIT 1
        ");
        $stmtTerm->execute([':school_id' => $schoolId]);
        $currentTerm = $stmtTerm->fetch(PDO::FETCH_ASSOC);

        $termStart = $currentTerm['start_date'] ?? date('Y-01-01');
        $termEnd = $currentTerm['end_date'] ?? date('Y-12-31');
        $termName = $currentTerm ? "{$currentTerm['name']} ({$currentTerm['academic_year_name']})" : 'Current Term 2026';

        // Build SQL date condition filters
        switch ($timeframe) {
            case 'Today':
                $ledgerDateCond = "DATE(transaction_ledger.created_at) = CURRENT_DATE";
                $expenseDateCond = "DATE(COALESCE(expense_vouchers.disbursed_at, expense_vouchers.created_at)) = CURRENT_DATE";
                $paymentDateCond = "DATE(payment_transactions.payment_date) = CURRENT_DATE";
                break;
            case 'This Week':
                $ledgerDateCond = "transaction_ledger.created_at >= date_trunc('week', CURRENT_DATE)";
                $expenseDateCond = "COALESCE(expense_vouchers.disbursed_at, expense_vouchers.created_at) >= date_trunc('week', CURRENT_DATE)";
                $paymentDateCond = "payment_transactions.payment_date >= date_trunc('week', CURRENT_DATE)";
                break;
            case 'This Month':
                $ledgerDateCond = "transaction_ledger.created_at >= date_trunc('month', CURRENT_DATE)";
                $expenseDateCond = "COALESCE(expense_vouchers.disbursed_at, expense_vouchers.created_at) >= date_trunc('month', CURRENT_DATE)";
                $paymentDateCond = "payment_transactions.payment_date >= date_trunc('month', CURRENT_DATE)";
                break;
            case 'Academic Year':
                $stmtAy = $this->db->prepare("SELECT start_date, end_date FROM academic_years WHERE school_id = :school_id AND is_current = TRUE LIMIT 1");
                $stmtAy->execute([':school_id' => $schoolId]);
                $ay = $stmtAy->fetch(PDO::FETCH_ASSOC);
                $ayStart = $ay['start_date'] ?? date('Y-01-01');
                $ayEnd = $ay['end_date'] ?? date('Y-12-31');
                $ledgerDateCond = "transaction_ledger.created_at >= '{$ayStart} 00:00:00' AND transaction_ledger.created_at <= '{$ayEnd} 23:59:59'";
                $expenseDateCond = "COALESCE(expense_vouchers.disbursed_at, expense_vouchers.created_at) >= '{$ayStart} 00:00:00' AND COALESCE(expense_vouchers.disbursed_at, expense_vouchers.created_at) <= '{$ayEnd} 23:59:59'";
                $paymentDateCond = "payment_transactions.payment_date >= '{$ayStart} 00:00:00' AND payment_transactions.payment_date <= '{$ayEnd} 23:59:59'";
                break;
            case 'Date Range':
                if (!empty($startDate) && !empty($endDate)) {
                    $ledgerDateCond = "transaction_ledger.created_at >= '{$startDate} 00:00:00' AND transaction_ledger.created_at <= '{$endDate} 23:59:59'";
                    $expenseDateCond = "COALESCE(expense_vouchers.disbursed_at, expense_vouchers.created_at) >= '{$startDate} 00:00:00' AND COALESCE(expense_vouchers.disbursed_at, expense_vouchers.created_at) <= '{$endDate} 23:59:59'";
                    $paymentDateCond = "payment_transactions.payment_date >= '{$startDate} 00:00:00' AND payment_transactions.payment_date <= '{$endDate} 23:59:59'";
                } else {
                    $ledgerDateCond = "1=1";
                    $expenseDateCond = "1=1";
                    $paymentDateCond = "1=1";
                }
                break;
            case 'This Term':
            default:
                if (!empty($currentTerm['id'])) {
                    $ledgerDateCond = "(transaction_ledger.term_id = '{$currentTerm['id']}' OR (transaction_ledger.created_at >= '{$termStart} 00:00:00' AND transaction_ledger.created_at <= '{$termEnd} 23:59:59'))";
                    $expenseDateCond = "(expense_vouchers.term_id = '{$currentTerm['id']}' OR (COALESCE(expense_vouchers.disbursed_at, expense_vouchers.created_at) >= '{$termStart} 00:00:00' AND COALESCE(expense_vouchers.disbursed_at, expense_vouchers.created_at) <= '{$termEnd} 23:59:59'))";
                    $paymentDateCond = "(payment_transactions.payment_date >= '{$termStart} 00:00:00' AND payment_transactions.payment_date <= '{$termEnd} 23:59:59')";
                } else {
                    $ledgerDateCond = "1=1";
                    $expenseDateCond = "1=1";
                    $paymentDateCond = "1=1";
                }
                break;
        }

        // 1. Total Enrolled Students
        $stmtStudents = $this->db->prepare("SELECT COUNT(*) FROM students WHERE school_id = :school_id AND status = 'ACTIVE'");
        $stmtStudents->execute([':school_id' => $schoolId]);
        $totalStudents = (int)$stmtStudents->fetchColumn();

        // 2. Total Invoiced (Expected Fees)
        $stmtInvoiced = $this->db->prepare("
            SELECT COALESCE(SUM(debit_amount), 0) as total_expected
            FROM transaction_ledger
            WHERE school_id = :school_id AND entry_type = 'INVOICE_CHARGE' AND {$ledgerDateCond}
        ");
        $stmtInvoiced->execute([':school_id' => $schoolId]);
        $totalExpected = (float)$stmtInvoiced->fetchColumn();

        // 3. Total Collected Fees
        $stmtCollected = $this->db->prepare("
            SELECT COALESCE(SUM(credit_amount), 0) as total_collected
            FROM transaction_ledger
            WHERE school_id = :school_id AND entry_type = 'PAYMENT_CREDIT' AND {$ledgerDateCond}
        ");
        $stmtCollected->execute([':school_id' => $schoolId]);
        $totalCollected = (float)$stmtCollected->fetchColumn();

        // 4. Total Disbursed Expenses
        $stmtExpenses = $this->db->prepare("
            SELECT COALESCE(SUM(amount), 0) as total_expenses
            FROM expense_vouchers
            WHERE school_id = :school_id AND status = 'DISBURSED' AND {$expenseDateCond}
        ");
        $stmtExpenses->execute([':school_id' => $schoolId]);
        $totalExpenses = (float)$stmtExpenses->fetchColumn();

        // 5. Total Pending Pledges
        $stmtPledges = $this->db->prepare("
            SELECT COALESCE(SUM(amount - fulfilled_amount), 0) as pending_pledges, COUNT(*) as pledge_count
            FROM pledges
            WHERE school_id = :school_id AND status = 'PENDING'
        ");
        $stmtPledges->execute([':school_id' => $schoolId]);
        $pledgesData = $stmtPledges->fetch();

        // 6. Reconciliation Exceptions Queue Count
        $stmtRecon = $this->db->prepare("
            SELECT COUNT(*) FROM payment_transactions
            WHERE school_id = :school_id AND reconciliation_status IN ('UNMATCHED', 'AMBIGUOUS')
        ");
        $stmtRecon->execute([':school_id' => $schoolId]);
        $unreconciledCount = (int)$stmtRecon->fetchColumn();

        // 7. Recent Transactions (Receipts & Inbound)
        $stmtRecent = $this->db->prepare("
            SELECT payment_transactions.id, payment_transactions.channel, payment_transactions.reference_number,
                   payment_transactions.amount, payment_transactions.payer_name, payment_transactions.account_reference,
                   payment_transactions.reconciliation_status, payment_transactions.payment_date, receipts.receipt_number
            FROM payment_transactions
            LEFT JOIN receipts ON payment_transactions.id = receipts.payment_transaction_id
            WHERE payment_transactions.school_id = :school_id AND {$paymentDateCond}
            ORDER BY payment_transactions.payment_date DESC
            LIMIT 6
        ");
        $stmtRecent->execute([':school_id' => $schoolId]);
        $recentPayments = $stmtRecent->fetchAll();

        // 8. Class Collection Breakdown for this timeframe
        $stmtClass = $this->db->prepare("
            SELECT c.name as class_name,
                   COUNT(s.id) as student_count,
                   COALESCE(SUM((SELECT SUM(debit_amount) FROM transaction_ledger WHERE student_id = s.id AND {$ledgerDateCond})), 0) as expected,
                   COALESCE(SUM((SELECT SUM(credit_amount) FROM transaction_ledger WHERE student_id = s.id AND {$ledgerDateCond})), 0) as collected
            FROM classes c
            LEFT JOIN students s ON c.id = s.class_id AND s.status = 'ACTIVE'
            WHERE c.school_id = :school_id
            GROUP BY c.id, c.name, c.level_order
            ORDER BY c.level_order ASC
        ");
        $stmtClass->execute([':school_id' => $schoolId]);
        $classMetrics = $stmtClass->fetchAll();

        // 9. Supplier Balances
        $stmtSuppliers = $this->db->prepare("
            SELECT COALESCE(s.name, sb.supplier_name, 'Unknown') as name,
                   COALESCE(SUM(sb.amount - COALESCE(sb.amount_paid, 0)), 0) as balance
            FROM supplier_bills sb
            LEFT JOIN suppliers s ON sb.supplier_id = s.id
            WHERE sb.school_id = :school_id AND sb.status != 'PAID'
            GROUP BY s.name, sb.supplier_name
            HAVING COALESCE(SUM(sb.amount - COALESCE(sb.amount_paid, 0)), 0) > 0
            ORDER BY balance DESC
            LIMIT 5
        ");
        $stmtSuppliers->execute([':school_id' => $schoolId]);
        $supplierBalances = $stmtSuppliers->fetchAll();

        // 10. Category Breakdown (Expenses)
        $stmtCategories = $this->db->prepare("
            SELECT COALESCE(expense_categories.name, 'General Expenses') as category_name,
                   COALESCE(SUM(expense_vouchers.amount), 0) as total_spent
            FROM expense_vouchers
            LEFT JOIN expense_categories ON expense_vouchers.category_id = expense_categories.id
            WHERE expense_vouchers.school_id = :school_id AND expense_vouchers.status = 'DISBURSED' AND {$expenseDateCond}
            GROUP BY expense_categories.name
            ORDER BY total_spent DESC
            LIMIT 6
        ");
        $stmtCategories->execute([':school_id' => $schoolId]);
        $categoryBreakdown = $stmtCategories->fetchAll();

        $netCashflow = $totalCollected - $totalExpenses;
        $collectionRate = $totalExpected > 0 ? round(($totalCollected / $totalExpected) * 100, 1) : 0;

        echo json_encode([
            'status' => 'success',
            'data'   => [
                'summary' => [
                    'timeframe'           => $timeframe,
                    'total_students'      => $totalStudents,
                    'total_expected'      => $totalExpected,
                    'total_collected'     => $totalCollected,
                    'total_outstanding'   => max(0, $totalExpected - $totalCollected),
                    'total_expenses'      => $totalExpenses,
                    'net_cashflow'        => $netCashflow,
                    'collection_rate'     => $collectionRate,
                    'pending_pledges'     => (float)($pledgesData['pending_pledges'] ?? 0),
                    'pledges_count'       => (int)($pledgesData['pledge_count'] ?? 0),
                    'unreconciled_count'  => $unreconciledCount
                ],
                'recent_payments'    => $recentPayments,
                'class_metrics'      => $classMetrics,
                'supplier_balances'  => $supplierBalances,
                'category_breakdown' => $categoryBreakdown,
                'term_info'          => [
                    'name'       => $termName,
                    'start_date' => $termStart,
                    'end_date'   => $termEnd
                ]
            ]
        ]);
    }
}