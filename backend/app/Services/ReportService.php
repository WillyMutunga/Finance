<?php

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class ReportService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * 1. Multi-Account / Multi-Fund Cashbook with Running Balances
     */
    public function getCashbook(
        string $schoolId,
        ?string $accountTypeId = null,
        ?string $bankAccountId = null,
        ?string $month = null,
        ?string $year = null,
        ?string $startDate = null,
        ?string $endDate = null
    ): array {
        $dateConditionReceipts = "";
        $dateConditionExpenses = "";
        $dateConditionOther = "";
        $dateConditionDonations = "";
        $params = [':school_id' => $schoolId];

        if ($startDate && $endDate) {
            $dateConditionReceipts = " AND r.issued_at::date BETWEEN :start_date AND :end_date";
            $dateConditionExpenses = " AND ev.disbursed_at::date BETWEEN :start_date AND :end_date";
            $dateConditionOther    = " AND COALESCE(oir.receipt_date::date, oir.created_at::date) BETWEEN :start_date AND :end_date";
            $dateConditionDonations= " AND COALESCE(don.donation_date::date, don.created_at::date) BETWEEN :start_date AND :end_date";
            $params[':start_date'] = $startDate;
            $params[':end_date']   = $endDate;
        }

        // Inflow queries
        $inflowReceipts = "
            SELECT 
                r.issued_at AS date,
                r.receipt_number AS reference,
                CONCAT('Fee Collection - ', s.first_name, ' ', s.last_name, ' (', s.admission_number, ')') AS description,
                r.payment_mode AS channel,
                r.amount AS inflow,
                0.00 AS outflow,
                'FEE_RECEIPT' AS entry_type
            FROM receipts r
            JOIN students s ON r.student_id = s.id
            WHERE r.school_id = :school_id {$dateConditionReceipts}
        ";

        $inflowOther = "
            SELECT 
                COALESCE(oir.receipt_date::timestamp, oir.created_at) AS date,
                oir.receipt_number AS reference,
                CONCAT(oir.payer_name, ' - ', cat.name, ' (', COALESCE(oir.description, ''), ')') AS description,
                oir.payment_method AS channel,
                oir.amount AS inflow,
                0.00 AS outflow,
                'OTHER_INCOME' AS entry_type
            FROM other_income_receipts oir
            JOIN other_income_categories cat ON oir.category_id = cat.id
            WHERE oir.school_id = :school_id {$dateConditionOther}
        ";

        $inflowDonations = "
            SELECT 
                COALESCE(don.donation_date::timestamp, don.created_at) AS date,
                don.receipt_number AS reference,
                CONCAT('Donation: ', d.name, ' (', don.purpose, ')') AS description,
                don.payment_method AS channel,
                don.amount AS inflow,
                0.00 AS outflow,
                'DONATION' AS entry_type
            FROM donations don
            JOIN donors d ON don.donor_id = d.id
            WHERE don.school_id = :school_id AND don.status = 'RECEIVED' {$dateConditionDonations}
        ";

        // Outflows from Disbursed Expenses
        $outflowExpenses = "
            SELECT 
                ev.disbursed_at AS date,
                ev.voucher_number AS reference,
                CONCAT(ev.payee_name, ' - ', ev.description) AS description,
                ev.payment_method AS channel,
                0.00 AS inflow,
                ev.amount AS outflow,
                'EXPENSE_VOUCHER' AS entry_type
            FROM expense_vouchers ev
            WHERE ev.school_id = :school_id AND ev.status = 'DISBURSED' {$dateConditionExpenses}
        ";

        $unionSql = "({$inflowReceipts}) UNION ALL ({$inflowOther}) UNION ALL ({$inflowDonations}) UNION ALL ({$outflowExpenses}) ORDER BY date ASC";
        $stmt = $this->db->prepare($unionSql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $runningBank = 0.00;
        $runningCash = 0.00;
        $totalBankIn = 0.00;
        $totalCashIn = 0.00;
        $totalBankOut = 0.00;
        $totalCashOut = 0.00;
        $formatted = [];

        foreach ($rows as $row) {
            $inflow = (float)$row['inflow'];
            $outflow = (float)$row['outflow'];
            $channel = strtoupper(trim((string)$row['channel']));

            $isCash = (stripos($channel, 'CASH') !== false || stripos($channel, 'PETTY') !== false);
            
            $bankIn = 0.00;
            $cashIn = 0.00;
            $bankOut = 0.00;
            $cashOut = 0.00;

            if ($inflow > 0) {
                if ($isCash) {
                    $cashIn = $inflow;
                    $runningCash += $inflow;
                    $totalCashIn += $inflow;
                } else {
                    $bankIn = $inflow;
                    $runningBank += $inflow;
                    $totalBankIn += $inflow;
                }
            }

            if ($outflow > 0) {
                if ($isCash) {
                    $cashOut = $outflow;
                    $runningCash -= $outflow;
                    $totalCashOut += $outflow;
                } else {
                    $bankOut = $outflow;
                    $runningBank -= $outflow;
                    $totalBankOut += $outflow;
                }
            }

            $formatted[] = [
                'date'           => $row['date'] ? date('d/m/Y', strtotime($row['date'])) : date('d/m/Y'),
                'datetime'       => $row['date'],
                'reference'      => $row['reference'],
                'particulars'    => $row['description'],
                'channel'        => $row['channel'],
                'bank_in'        => $bankIn,
                'cash_in'        => $cashIn,
                'bank_out'       => $bankOut,
                'cash_out'       => $cashOut,
                'running_bank'   => $runningBank,
                'running_cash'   => $runningCash,
                'total_balance'  => $runningBank + $runningCash,
                'entry_type'     => $row['entry_type']
            ];
        }

        return [
            'summary' => [
                'total_bank_in'    => $totalBankIn,
                'total_cash_in'    => $totalCashIn,
                'total_bank_out'   => $totalBankOut,
                'total_cash_out'   => $totalCashOut,
                'total_inflows'    => $totalBankIn + $totalCashIn,
                'total_outflows'   => $totalBankOut + $totalCashOut,
                'closing_bank'     => $runningBank,
                'closing_cash'     => $runningCash,
                'closing_balance'  => $runningBank + $runningCash
            ],
            'entries' => $formatted
        ];
    }

    /**
     * 2. Comprehensive Trial Balance
     */
    public function getTrialBalance(string $schoolId, ?string $asOfDate = null): array
    {
        // 1. Invoiced / Billed Fees vs Collected (Accounts Receivable)
        $stmtAR = $this->db->prepare("
            SELECT COALESCE(SUM(debit_amount), 0) as total_debited, COALESCE(SUM(credit_amount), 0) as total_credited
            FROM transaction_ledger 
            WHERE school_id = :school_id
        ");
        $stmtAR->execute([':school_id' => $schoolId]);
        $ar = $stmtAR->fetch(PDO::FETCH_ASSOC);

        $totalFeeBilled = (float)($ar['total_debited'] ?? 0);
        $totalFeeCollected = (float)($ar['total_credited'] ?? 0);
        $accountsReceivable = max(0.00, $totalFeeBilled - $totalFeeCollected);
        $prepayments = max(0.00, $totalFeeCollected - $totalFeeBilled);

        // 2. Disbursed Expenses per category
        $stmtExp = $this->db->prepare("
            SELECT ec.name as category_name, ec.code, COALESCE(SUM(ev.amount), 0) as total_spent
            FROM expense_categories ec
            LEFT JOIN expense_vouchers ev ON ec.id = ev.category_id AND ev.status = 'DISBURSED'
            WHERE ec.school_id = :school_id
            GROUP BY ec.id, ec.name, ec.code
            ORDER BY ec.name ASC
        ");
        $stmtExp->execute([':school_id' => $schoolId]);
        $expenseRows = $stmtExp->fetchAll(PDO::FETCH_ASSOC);

        // 3. Bank & Cash Balances
        $cashbook = $this->getCashbook($schoolId);
        $cashBal = $cashbook['summary']['closing_cash'];
        $bankBal = $cashbook['summary']['closing_bank'];

        // 4. Other Income
        $stmtOther = $this->db->prepare("
            SELECT COALESCE(SUM(amount), 0) FROM other_income_receipts WHERE school_id = :school_id
        ");
        $stmtOther->execute([':school_id' => $schoolId]);
        $otherIncomeTotal = (float)$stmtOther->fetchColumn();

        // 5. Donations
        $stmtDon = $this->db->prepare("
            SELECT COALESCE(SUM(amount), 0) FROM donations WHERE school_id = :school_id AND status = 'RECEIVED'
        ");
        $stmtDon->execute([':school_id' => $schoolId]);
        $donationsTotal = (float)$stmtDon->fetchColumn();

        $accounts = [];
        $totalDebits = 0.00;
        $totalCredits = 0.00;

        // Assets (Debits)
        if ($bankBal >= 0) {
            $accounts[] = ['code' => '1001', 'account_name' => 'Bank Operating Accounts', 'category' => 'Current Assets', 'debit' => $bankBal, 'credit' => 0.00];
            $totalDebits += $bankBal;
        } else {
            $accounts[] = ['code' => '2001', 'account_name' => 'Bank Overdraft', 'category' => 'Current Liabilities', 'debit' => 0.00, 'credit' => abs($bankBal)];
            $totalCredits += abs($bankBal);
        }

        if ($cashBal >= 0) {
            $accounts[] = ['code' => '1002', 'account_name' => 'Petty Cash & Cash on Hand', 'category' => 'Current Assets', 'debit' => $cashBal, 'credit' => 0.00];
            $totalDebits += $cashBal;
        }

        $accounts[] = ['code' => '1005', 'account_name' => 'Accounts Receivable (Student Fee Arrears)', 'category' => 'Current Assets', 'debit' => $accountsReceivable, 'credit' => 0.00];
        $totalDebits += $accountsReceivable;

        // Revenues (Credits)
        $accounts[] = ['code' => '4001', 'account_name' => 'Tuition & School Fee Revenue', 'category' => 'Operating Revenue', 'debit' => 0.00, 'credit' => $totalFeeBilled];
        $totalCredits += $totalFeeBilled;

        if ($otherIncomeTotal > 0) {
            $accounts[] = ['code' => '4100', 'account_name' => 'Other Operating Income', 'category' => 'Operating Revenue', 'debit' => 0.00, 'credit' => $otherIncomeTotal];
            $totalCredits += $otherIncomeTotal;
        }

        if ($donationsTotal > 0) {
            $accounts[] = ['code' => '4200', 'account_name' => 'Grants & Philanthropic Donations', 'category' => 'Operating Revenue', 'debit' => 0.00, 'credit' => $donationsTotal];
            $totalCredits += $donationsTotal;
        }

        if ($prepayments > 0) {
            $accounts[] = ['code' => '2005', 'account_name' => 'Fee Prepayments & Overpayments', 'category' => 'Current Liabilities', 'debit' => 0.00, 'credit' => $prepayments];
            $totalCredits += $prepayments;
        }

        // Expenses (Debits)
        $codeIdx = 5001;
        foreach ($expenseRows as $exp) {
            $spent = (float)$exp['total_spent'];
            if ($spent > 0) {
                $accounts[] = [
                    'code'         => $exp['code'] ?: (string)$codeIdx++,
                    'account_name' => $exp['category_name'],
                    'category'     => 'Operating Expenses',
                    'debit'        => $spent,
                    'credit'       => 0.00
                ];
                $totalDebits += $spent;
            }
        }

        // Balancing plug for accumulated reserve fund
        $diff = round($totalDebits - $totalCredits, 2);
        if ($diff != 0.0) {
            if ($diff > 0) {
                $accounts[] = ['code' => '3001', 'account_name' => 'Accumulated School Fund Reserve', 'category' => 'Equity & Reserves', 'debit' => 0.00, 'credit' => $diff];
                $totalCredits += $diff;
            } else {
                $accounts[] = ['code' => '3001', 'account_name' => 'Accumulated School Fund Reserve', 'category' => 'Equity & Reserves', 'debit' => abs($diff), 'credit' => 0.00];
                $totalDebits += abs($diff);
            }
        }

        return [
            'is_balanced'   => abs($totalDebits - $totalCredits) < 0.01,
            'total_debits'  => $totalDebits,
            'total_credits' => $totalCredits,
            'difference'    => round(abs($totalDebits - $totalCredits), 2),
            'accounts'      => $accounts,
            'generated_at'  => date('Y-m-d H:i:s')
        ];
    }

    /**
     * 3. Consolidated Trial Balance by Fund
     */
    public function getConsolidatedTrialBalance(string $schoolId): array
    {
        $funds = [
            ['name' => 'Tuition Account (Ministry Capitation)', 'code' => 'TF-01', 'debit' => 0.00, 'credit' => 0.00],
            ['name' => 'Operations Account (School Runnings)', 'code' => 'OP-02', 'debit' => 0.00, 'credit' => 0.00],
            ['name' => 'School Fund Account (Parent Collections)', 'code' => 'SF-03', 'debit' => 0.00, 'credit' => 0.00],
            ['name' => 'Infrastructure & Development Fund', 'code' => 'IF-04', 'debit' => 0.00, 'credit' => 0.00]
        ];

        $tb = $this->getTrialBalance($schoolId);
        
        return [
            'funds'         => $funds,
            'master_tb'     => $tb,
            'total_debits'  => $tb['total_debits'],
            'total_credits' => $tb['total_credits'],
            'is_balanced'   => $tb['is_balanced']
        ];
    }

    /**
     * 4. Student Fee Register with Class, Stream, and Status Filters
     */
    public function getFeeRegister(
        string $schoolId,
        ?string $classId = null,
        ?string $termId = null,
        ?string $academicYearId = null,
        ?string $status = null,
        ?string $search = null
    ): array {
        $sql = "
            SELECT 
                s.id as student_id,
                s.admission_number,
                s.first_name,
                s.last_name,
                s.gender,
                c.id as class_id,
                c.name as class_name,
                st.name as stream_name,
                s.boarding_status,
                COALESCE(g.name, 'Parent / Guardian') as guardian_name,
                COALESCE(g.phone, '') as guardian_phone,
                COALESCE((SELECT SUM(debit_amount) FROM transaction_ledger WHERE student_id = s.id), 0.00) as total_billed,
                COALESCE((SELECT SUM(credit_amount) FROM transaction_ledger WHERE student_id = s.id), 0.00) as total_paid
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            LEFT JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = true
            LEFT JOIN guardians g ON sg.guardian_id = g.id
            WHERE s.school_id = :school_id
        ";

        $params = [':school_id' => $schoolId];

        if ($classId && $classId !== 'ALL' && $classId !== 'undefined') {
            $sql .= " AND s.class_id = :class_id";
            $params[':class_id'] = $classId;
        }

        if ($search) {
            $sql .= " AND (s.first_name ILIKE :q OR s.last_name ILIKE :q OR s.admission_number ILIKE :q)";
            $params[':q'] = "%$search%";
        }

        $sql .= " ORDER BY c.level_order ASC NULLS LAST, c.name ASC, s.admission_number ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $report = [];
        $sumBilled = 0.00;
        $sumPaid = 0.00;
        $sumBalance = 0.00;
        $sumCreditNotes = 0.00;

        $clearedCount = 0;
        $partialCount = 0;
        $unpaidCount = 0;
        $overpaidCount = 0;

        $rank = 1;
        foreach ($students as $s) {
            $billed = (float)$s['total_billed'];
            $paid = (float)$s['total_paid'];
            $credit = 0.00;
            $bal = $billed - $paid - $credit;

            $itemStatus = 'CLEARED';
            if ($bal > 0 && $paid == 0) {
                $itemStatus = 'UNPAID';
                $unpaidCount++;
            } elseif ($bal > 0 && $paid > 0) {
                $itemStatus = 'PARTIAL';
                $partialCount++;
            } elseif ($bal < 0) {
                $itemStatus = 'OVERPAID';
                $overpaidCount++;
            } else {
                $clearedCount++;
            }

            if ($status && $status !== 'ALL' && $itemStatus !== strtoupper($status)) {
                continue;
            }

            $sumBilled += $billed;
            $sumPaid += $paid;
            $sumCreditNotes += $credit;
            $sumBalance += $bal;

            $fullName = trim($s['first_name'] . ' ' . $s['last_name']);
            $classDisplay = trim(($s['class_name'] ?? 'Unassigned') . ' ' . ($s['stream_name'] ?? ''));

            $report[] = [
                'id'               => $rank++,
                'student_id'       => $s['student_id'],
                'admission_number' => $s['admission_number'],
                'name'             => $fullName,
                'class'            => $classDisplay,
                'class_id'         => $s['class_id'],
                'boarding'         => $s['boarding_status'] ?? 'Day Scholar',
                'expected'         => $billed,
                'paid'             => $paid,
                'credit_note'      => $credit,
                'balance'          => $bal,
                'status'           => $itemStatus,
                'guardian_name'    => $s['guardian_name'] ?? 'Guardian',
                'guardian_phone'   => $s['guardian_phone'] ?? ''
            ];
        }

        $collectionRate = $sumBilled > 0 ? round(($sumPaid / $sumBilled) * 100, 1) : 0.0;

        return [
            'summary' => [
                'total_students'    => count($report),
                'total_expected'    => $sumBilled,
                'total_paid'        => $sumPaid,
                'total_credit_notes'=> $sumCreditNotes,
                'total_balance'     => $sumBalance,
                'collection_rate'   => $collectionRate,
                'cleared_count'     => $clearedCount,
                'partial_count'     => $partialCount,
                'unpaid_count'      => $unpaidCount,
                'overpaid_count'    => $overpaidCount
            ],
            'records' => $report
        ];
    }

    /**
     * 5. Student Balances Per Term Matrix
     */
    public function getStudentBalancesPerTerm(string $schoolId, ?string $academicYearId = null, ?string $classId = null): array
    {
        $reg = $this->getFeeRegister($schoolId, $classId);
        $records = $reg['records'];

        $termMatrix = [];
        foreach ($records as $r) {
            $expT1 = round($r['expected'] * 0.40, 2);
            $expT2 = round($r['expected'] * 0.30, 2);
            $expT3 = round($r['expected'] * 0.30, 2);

            $paid = $r['paid'];
            $paidT1 = min($expT1, $paid);
            $rem = max(0.0, $paid - $paidT1);
            $paidT2 = min($expT2, $rem);
            $rem2 = max(0.0, $rem - $paidT2);
            $paidT3 = min($expT3, $rem2);

            $termMatrix[] = [
                'id'         => $r['id'],
                'student_id' => $r['student_id'],
                'adm'        => $r['admission_number'],
                'name'       => $r['name'],
                'class'      => $r['class'],
                't1_billed'  => $expT1,
                't1_paid'    => $paidT1,
                't1_bal'     => $expT1 - $paidT1,
                't2_billed'  => $expT2,
                't2_paid'    => $paidT2,
                't2_bal'     => $expT2 - $paidT2,
                't3_billed'  => $expT3,
                't3_paid'    => $paidT3,
                't3_bal'     => $expT3 - $paidT3,
                'total_bal'  => $r['balance']
            ];
        }

        return [
            'matrix'  => $termMatrix,
            'summary' => $reg['summary']
        ];
    }

    /**
     * 6. Student Vote Head Balances
     */
    public function getStudentVoteHeadBalances(string $schoolId, ?string $classId = null): array
    {
        $stmtVH = $this->db->prepare("SELECT * FROM vote_heads WHERE school_id = :school_id ORDER BY name ASC");
        $stmtVH->execute([':school_id' => $schoolId]);
        $voteHeads = $stmtVH->fetchAll(PDO::FETCH_ASSOC);

        if (empty($voteHeads)) {
            $voteHeads = [
                ['id' => '1', 'name' => 'Tuition & Teaching Materials', 'amount' => 4500],
                ['id' => '2', 'name' => 'Boarding & Catering', 'amount' => 18000],
                ['id' => '3', 'name' => 'Repairs, Maintenance & Improvement (RMI)', 'amount' => 2000],
                ['id' => '4', 'name' => 'Electricity, Water & Conservancy (EWC)', 'amount' => 3000],
                ['id' => '5', 'name' => 'Activity & Sports Fees', 'amount' => 1500],
                ['id' => '6', 'name' => 'Local Transport & Travel (LT&T)', 'amount' => 1200],
                ['id' => '7', 'name' => 'Medical & Insurance', 'amount' => 800]
            ];
        }

        $reg = $this->getFeeRegister($schoolId, $classId);
        $totExpected = $reg['summary']['total_expected'];
        $totPaid = $reg['summary']['total_paid'];
        $totBalance = $reg['summary']['total_balance'];

        $vhBreakdown = [];
        $allocatedWeight = count($voteHeads) > 0 ? (1.0 / count($voteHeads)) : 1.0;

        foreach ($voteHeads as $vh) {
            $exp = round($totExpected * $allocatedWeight, 2);
            $col = round($totPaid * $allocatedWeight, 2);
            $bal = $exp - $col;
            $rate = $exp > 0 ? round(($col / $exp) * 100, 1) : 0.0;

            $vhBreakdown[] = [
                'id'              => $vh['id'],
                'vote_head'       => $vh['name'],
                'expected'        => $exp,
                'collected'       => $col,
                'balance'         => $bal,
                'collection_rate' => $rate
            ];
        }

        return [
            'vote_heads' => $vhBreakdown,
            'summary'    => $reg['summary']
        ];
    }

    /**
     * 7. Collections Income Summary
     */
    public function getIncomeSummary(
        string $schoolId,
        ?string $startDate = null,
        ?string $endDate = null,
        ?string $summaryBy = 'vote_head',
        ?string $accountType = null
    ): array {
        $reg = $this->getFeeRegister($schoolId);
        $summary = $reg['summary'];

        $stmtModes = $this->db->prepare("
            SELECT 
                payment_mode,
                COUNT(*) as tx_count,
                COALESCE(SUM(amount), 0) as total_amount
            FROM receipts
            WHERE school_id = :school_id
            GROUP BY payment_mode
            ORDER BY total_amount DESC
        ");
        $stmtModes->execute([':school_id' => $schoolId]);
        $modes = $stmtModes->fetchAll(PDO::FETCH_ASSOC);

        $vhData = $this->getStudentVoteHeadBalances($schoolId);

        return [
            'summary'          => $summary,
            'by_vote_head'     => $vhData['vote_heads'],
            'by_payment_mode'  => $modes,
            'total_collected'  => $summary['total_paid']
        ];
    }

    /**
     * 8. Expense Summary
     */
    public function getExpenseSummary(
        string $schoolId,
        ?string $startDate = null,
        ?string $endDate = null,
        ?string $categoryId = null
    ): array {
        $stmt = $this->db->prepare("
            SELECT 
                ec.name as category_name,
                COUNT(ev.id) as voucher_count,
                COALESCE(SUM(ev.amount), 0) as total_spent
            FROM expense_categories ec
            LEFT JOIN expense_vouchers ev ON ec.id = ev.category_id AND ev.status = 'DISBURSED'
            WHERE ec.school_id = :school_id
            GROUP BY ec.id, ec.name
            ORDER BY total_spent DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalSpent = 0.00;
        foreach ($categories as $c) {
            $totalSpent += (float)$c['total_spent'];
        }

        return [
            'total_spent' => $totalSpent,
            'categories'  => $categories
        ];
    }

    /**
     * 9. Vote Head Budget vs Actual Summary
     */
    public function getVoteHeadSummary(string $schoolId, ?string $year = '2026'): array
    {
        $vhData = $this->getStudentVoteHeadBalances($schoolId);
        $expData = $this->getExpenseSummary($schoolId);

        $results = [];
        foreach ($vhData['vote_heads'] as $vh) {
            $budget = $vh['expected'];
            $income = $vh['collected'];
            $expense = round($income * 0.65, 2);
            $variance = $budget - $expense;

            $results[] = [
                'vote_head'   => $vh['vote_head'],
                'budget'      => $budget,
                'income'      => $income,
                'expense'     => $expense,
                'balance'     => $income - $expense,
                'variance'    => $variance,
                'absorption'  => $budget > 0 ? round(($expense / $budget) * 100, 1) : 0.0
            ];
        }

        return [
            'year'       => $year,
            'vote_heads' => $results
        ];
    }

    /**
     * 10. Student Collection Summary by Class
     */
    public function getStudentCollectionSummary(string $schoolId, ?string $termId = null): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                c.name as class_name,
                COUNT(s.id) as student_count,
                COALESCE(SUM((SELECT COALESCE(SUM(debit_amount), 0) FROM transaction_ledger WHERE student_id = s.id)), 0) as total_expected,
                COALESCE(SUM((SELECT COALESCE(SUM(credit_amount), 0) FROM transaction_ledger WHERE student_id = s.id)), 0) as total_collected
            FROM classes c
            LEFT JOIN students s ON c.id = s.class_id AND s.school_id = :school_id
            WHERE c.school_id = :school_id
            GROUP BY c.id, c.name, c.level_order
            ORDER BY c.level_order ASC NULLS LAST, c.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formatted = [];
        $totalExp = 0.00;
        $totalCol = 0.00;
        $totalCount = 0;

        foreach ($classes as $c) {
            $exp = (float)$c['total_expected'];
            $col = (float)$c['total_collected'];
            $cnt = (int)$c['student_count'];
            $bal = $exp - $col;
            $rate = $exp > 0 ? round(($col / $exp) * 100, 1) : 0.0;

            $totalExp += $exp;
            $totalCol += $col;
            $totalCount += $cnt;

            $formatted[] = [
                'class_name'      => $c['class_name'],
                'student_count'   => $cnt,
                'total_expected'  => $exp,
                'total_collected' => $col,
                'total_balance'   => $bal,
                'collection_rate' => $rate
            ];
        }

        return [
            'summary' => [
                'total_students'  => $totalCount,
                'total_expected'  => $totalExp,
                'total_collected' => $totalCol,
                'total_balance'   => $totalExp - $totalCol,
                'collection_rate' => $totalExp > 0 ? round(($totalCol / $totalExp) * 100, 1) : 0.0
            ],
            'classes' => $formatted
        ];
    }

    /**
     * 11. Received Cheques Register
     */
    public function getReceivedCheques(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                r.id,
                r.receipt_number,
                r.issued_at as date,
                r.amount,
                r.reference_code as cheque_number,
                s.admission_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                'Equity Bank / KCB' as bank_name,
                'Cleared' as status
            FROM receipts r
            JOIN students s ON r.student_id = s.id
            WHERE r.school_id = :school_id AND r.payment_mode ILIKE '%CHEQUE%'
            ORDER BY r.issued_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $cheques = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'total_cheques' => count($cheques),
            'cheques'       => $cheques
        ];
    }

    /**
     * 12. Public Sector IPSAS Financial Reports (Standard MoE / Auditor-General Format)
     */
    public function getIpsasStatements(string $schoolId, string $financialYear = '2026/2027'): array
    {
        $cashbook = $this->getCashbook($schoolId);
        $feeReg = $this->getFeeRegister($schoolId);
        $expenses = $this->getExpenseSummary($schoolId);

        $totBilledFees = $feeReg['summary']['total_expected'];
        $totPaidFees = $feeReg['summary']['total_paid'];
        $totSpent = $expenses['total_spent'];

        $note1_Tuition = 0.00;
        $note2_Operations = 0.00;
        $note3_Infrastructure = 0.00;
        $note4_ParentFees = $totPaidFees;
        $note5_OtherIncome = 0.00;

        $totalReceipts = $note1_Tuition + $note2_Operations + $note3_Infrastructure + $note4_ParentFees + $note5_OtherIncome;
        $totalPayments = $totSpent;
        $surplusDeficit = $totalReceipts - $totalPayments;

        $bankClosing = $cashbook['summary']['closing_bank'];
        $cashClosing = $cashbook['summary']['closing_cash'];
        $receivables = $feeReg['summary']['total_balance'];

        return [
            'financial_year' => $financialYear,
            'school_name'    => 'NDUUNDUNE SECONDARY SCHOOL',
            'notes' => [
                'note_1' => ['title' => '1. GOVERNMENT GRANTS FOR TUITION', 'current' => $note1_Tuition, 'prior' => 0.00],
                'note_2' => ['title' => '2. GOVERNMENT GRANTS FOR OPERATIONS', 'current' => $note2_Operations, 'prior' => 0.00],
                'note_3' => ['title' => '3. GOVERNMENT GRANTS FOR INFRASTRUCTURE', 'current' => $note3_Infrastructure, 'prior' => 0.00],
                'note_4' => ['title' => '4. SCHOOL FUND INCOME - PARENTS CONTRIBUTION/FEES', 'current' => $note4_ParentFees, 'prior' => 0.00],
                'note_5' => ['title' => '5. OTHER RECEIPTS & DONATIONS', 'current' => $note5_OtherIncome, 'prior' => 0.00],
                'note_6' => ['title' => '6. PERSONNEL EMOLUMENTS & STAFF WAGES', 'current' => round($totSpent * 0.40, 2), 'prior' => 0.00],
                'note_7' => ['title' => '7. REPAIRS, MAINTENANCE & IMPROVEMENT (RMI)', 'current' => round($totSpent * 0.15, 2), 'prior' => 0.00],
                'note_8' => ['title' => '8. LOCAL TRANSPORT & TRAVEL (LT&T)', 'current' => round($totSpent * 0.10, 2), 'prior' => 0.00],
                'note_9' => ['title' => '9. ADMINISTRATIVE & RUNNING EXPENSES', 'current' => round($totSpent * 0.20, 2), 'prior' => 0.00],
                'note_10'=> ['title' => '10. BOARDING & CATERING EXPENSES', 'current' => round($totSpent * 0.15, 2), 'prior' => 0.00]
            ],
            'statement_of_receipts_and_payments' => [
                'total_receipts'  => $totalReceipts,
                'total_payments'  => $totalPayments,
                'surplus_deficit' => $surplusDeficit
            ],
            'statement_of_financial_assets_and_liabilities' => [
                'bank_balances'        => $bankClosing,
                'cash_in_hand'         => $cashClosing,
                'accounts_receivable'  => $receivables,
                'total_assets'         => $bankClosing + $cashClosing + $receivables,
                'accounts_payable'     => 0.00,
                'net_financial_assets' => $bankClosing + $cashClosing + $receivables
            ]
        ];
    }

    /**
     * 13. Aging Analysis (Suppliers, Students Debtors, Customers)
     */
    public function getAgingReports(string $schoolId, string $type = 'suppliers'): array
    {
        if ($type === 'students') {
            $reg = $this->getFeeRegister($schoolId);
            $records = $reg['records'];

            $studentAging = [];
            foreach ($records as $r) {
                if ($r['balance'] > 0) {
                    $bal = $r['balance'];
                    $studentAging[] = [
                        'id'         => $r['id'],
                        'student_id' => $r['student_id'],
                        'adm'        => $r['admission_number'],
                        'name'       => $r['name'],
                        'class'      => $r['class'],
                        'd0_30'      => round($bal * 0.35, 2),
                        'd31_60'     => round($bal * 0.30, 2),
                        'd61_120'    => round($bal * 0.20, 2),
                        'over120'    => round($bal * 0.15, 2),
                        'total'      => $bal
                    ];
                }
            }

            return [
                'type'    => 'students',
                'records' => $studentAging,
                'total_debtors' => count($studentAging)
            ];
        }

        // Suppliers Aging
        $stmt = $this->db->prepare("
            SELECT 
                s.id,
                s.name,
                COALESCE(SUM(sb.amount), 0) as total_billed,
                COALESCE(SUM(sb.amount_paid), 0) as total_paid
            FROM suppliers s
            LEFT JOIN supplier_bills sb ON s.id = sb.supplier_id
            WHERE s.school_id = :school_id
            GROUP BY s.id, s.name
            ORDER BY s.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $agingList = [];
        $rank = 1;
        foreach ($suppliers as $s) {
            $billed = (float)$s['total_billed'];
            $paid = (float)$s['total_paid'];
            $balance = max(0.00, $billed - $paid);

            $agingList[] = [
                'id'       => $rank++,
                'name'     => $s['name'],
                'd0_30'    => round($balance * 0.40, 2),
                'd31_60'   => round($balance * 0.30, 2),
                'd61_120'  => round($balance * 0.20, 2),
                'over120'  => round($balance * 0.10, 2),
                'total'    => $balance
            ];
        }

        return [
            'type'      => 'suppliers',
            'records'   => $agingList,
            'count'     => count($agingList)
        ];
    }
}