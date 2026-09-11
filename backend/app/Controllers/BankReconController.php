<?php

namespace App\Controllers;

use App\Database;
use App\Services\LedgerService;
use PDO;

class BankReconController
{
    private PDO $db;
    private LedgerService $ledgerService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->ledgerService = new LedgerService();
    }

    public function getStatements(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT bs.*, u.name as uploaded_by_name,
                   (SELECT COUNT(*) FROM bank_statement_lines WHERE statement_id = bs.id) as total_lines_count,
                   (SELECT COUNT(*) FROM bank_statement_lines WHERE statement_id = bs.id AND reconciliation_status = 'MATCHED') as matched_lines_count
            FROM bank_statements bs
            LEFT JOIN users u ON bs.uploaded_by = u.id
            WHERE bs.school_id = :school_id
            ORDER BY bs.statement_date DESC, bs.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $statements = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $statements]);
    }

    public function getStatementLines(string $statementId): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT bsl.*, s.first_name, s.last_name, s.admission_number, c.name as class_name
            FROM bank_statement_lines bsl
            LEFT JOIN students s ON bsl.matched_student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE bsl.statement_id = :statement_id AND bsl.school_id = :school_id
            ORDER BY bsl.transaction_date ASC, bsl.created_at ASC
        ");
        $stmt->execute([':statement_id' => $statementId, ':school_id' => $schoolId]);
        $lines = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $lines]);
    }

    public function uploadStatement(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $bankName = $input['bank_name'] ?? 'Equity Bank';
        $accountNumber = $input['account_number'] ?? '011293847561';
        $statementDate = $input['statement_date'] ?? date('Y-m-d');
        $openingBalance = (float)($input['opening_balance'] ?? 0);
        $closingBalance = (float)($input['closing_balance'] ?? 0);
        $fileName = $input['file_name'] ?? 'statement_' . date('Ymd_His') . '.csv';
        $rawLines = $input['lines'] ?? [];

        if (empty($rawLines) && !empty($_FILES['file']['tmp_name'])) {
            $csvData = file_get_contents($_FILES['file']['tmp_name']);
            $rows = array_map('str_getcsv', explode("\n", $csvData));
            $header = array_shift($rows);
            foreach ($rows as $r) {
                if (count($r) >= 4 && !empty(trim($r[0]))) {
                    $rawLines[] = [
                        'transaction_date' => date('Y-m-d', strtotime(trim($r[0]))),
                        'reference_number' => trim($r[1] ?? ''),
                        'description'      => trim($r[2] ?? ''),
                        'debit'            => (float)($r[3] ?? 0),
                        'credit'           => (float)($r[4] ?? 0),
                        'running_balance'  => (float)($r[5] ?? 0)
                    ];
                }
            }
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO bank_statements (school_id, bank_name, account_number, statement_date, opening_balance, closing_balance, file_name, total_lines)
                VALUES (:school_id, :bank_name, :account_number, :statement_date, :opening_balance, :closing_balance, :file_name, :total_lines)
                RETURNING id
            ");
            $stmt->execute([
                ':school_id'       => $schoolId,
                ':bank_name'       => $bankName,
                ':account_number'  => $accountNumber,
                ':statement_date'  => $statementDate,
                ':opening_balance' => $openingBalance,
                ':closing_balance' => $closingBalance,
                ':file_name'       => $fileName,
                ':total_lines'     => count($rawLines)
            ]);
            $statementId = $stmt->fetchColumn();

            // Fetch active students for heuristic admission number extraction
            $stmtStudents = $this->db->prepare("SELECT id, admission_number, first_name, last_name FROM students WHERE school_id = :school_id");
            $stmtStudents->execute([':school_id' => $schoolId]);
            $students = $stmtStudents->fetchAll(PDO::FETCH_ASSOC);

            $matchedCount = 0;
            $lineStmt = $this->db->prepare("
                INSERT INTO bank_statement_lines (statement_id, school_id, transaction_date, reference_number, description, debit, credit, running_balance, reconciliation_status, matched_student_id, matched_at)
                VALUES (:statement_id, :school_id, :transaction_date, :reference_number, :description, :debit, :credit, :running_balance, :status, :matched_student_id, :matched_at)
            ");

            foreach ($rawLines as $line) {
                $desc = $line['description'] ?? '';
                $ref = $line['reference_number'] ?? '';
                $credit = (float)($line['credit'] ?? 0);
                $debit = (float)($line['debit'] ?? 0);
                $txDate = $line['transaction_date'] ?? date('Y-m-d');
                $runBal = isset($line['running_balance']) ? (float)$line['running_balance'] : null;

                $matchedStudentId = null;
                $status = 'UNMATCHED';

                // Attempt auto-match on student admission number
                foreach ($students as $st) {
                    $adm = preg_quote($st['admission_number'], '/');
                    if (preg_match("/\b{$adm}\b/i", $desc) || preg_match("/\b{$adm}\b/i", $ref)) {
                        $matchedStudentId = $st['id'];
                        $status = 'MATCHED';
                        $matchedCount++;
                        break;
                    }
                }

                $lineStmt->execute([
                    ':statement_id'       => $statementId,
                    ':school_id'          => $schoolId,
                    ':transaction_date'   => $txDate,
                    ':reference_number'   => $ref,
                    ':description'        => $desc,
                    ':debit'              => $debit,
                    ':credit'             => $credit,
                    ':running_balance'    => $runBal,
                    ':status'             => $status,
                    ':matched_student_id' => $matchedStudentId,
                    ':matched_at'         => $matchedStudentId ? date('Y-m-d H:i:s') : null
                ]);
            }

            // Update matched count on statement
            $stmtUpd = $this->db->prepare("UPDATE bank_statements SET matched_lines = :matched_lines WHERE id = :id");
            $stmtUpd->execute([':matched_lines' => $matchedCount, ':id' => $statementId]);

            $this->db->commit();

            echo json_encode([
                'status'  => 'success',
                'message' => "Bank statement imported successfully. {$matchedCount} of " . count($rawLines) . " lines matched.",
                'data'    => ['statement_id' => $statementId, 'total_lines' => count($rawLines), 'matched_lines' => $matchedCount]
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function matchLine(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $lineId = $input['line_id'] ?? null;
        $studentId = $input['student_id'] ?? null;

        if (!$lineId || !$studentId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Line ID and Student ID required']);
            return;
        }

        $stmt = $this->db->prepare("
            UPDATE bank_statement_lines 
            SET matched_student_id = :student_id, reconciliation_status = 'MATCHED', matched_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
        ");
        $stmt->execute([':student_id' => $studentId, ':id' => $lineId, ':school_id' => $schoolId]);

        echo json_encode(['status' => 'success', 'message' => 'Bank statement line matched successfully']);
    }

    public function getReconciliationReports(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT brr.*, u.name as reconciled_by_name, ba.bank_name, ba.account_number
            FROM bank_reconciliation_reports brr
            LEFT JOIN users u ON brr.reconciled_by = u.id
            LEFT JOIN bank_integrations ba ON brr.bank_account_id = ba.id
            WHERE brr.school_id = :school_id
            ORDER BY brr.reconciliation_date DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $reports]);
    }

    public function createReconciliationReport(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $reconDate = $input['reconciliation_date'] ?? date('Y-m-d');
        $stmtClosing = (float)($input['statement_closing_balance'] ?? 0);
        $cashbookBal = (float)($input['cashbook_balance'] ?? 0);
        $unpresented = (float)($input['unpresented_cheques_total'] ?? 0);
        $depositsInTransit = (float)($input['deposits_in_transit_total'] ?? 0);
        $bankCharges = (float)($input['bank_charges_total'] ?? 0);

        $adjustedBankBal = $stmtClosing + $depositsInTransit - $unpresented;
        $adjustedCashbookBal = $cashbookBal - $bankCharges;
        $variance = $adjustedBankBal - $adjustedCashbookBal;

        $stmt = $this->db->prepare("
            INSERT INTO bank_reconciliation_reports (
                school_id, bank_account_id, reconciliation_date, statement_closing_balance, cashbook_balance,
                unpresented_cheques_total, deposits_in_transit_total, bank_charges_total,
                adjusted_bank_balance, adjusted_cashbook_balance, variance, status, notes
            ) VALUES (
                :school_id, :bank_account_id, :recon_date, :stmt_closing, :cashbook_bal,
                :unpresented, :deposits, :charges,
                :adj_bank, :adj_cashbook, :variance, :status, :notes
            ) RETURNING id
        ");
        $stmt->execute([
            ':school_id'        => $schoolId,
            ':bank_account_id'  => $input['bank_account_id'] ?? null,
            ':recon_date'       => $reconDate,
            ':stmt_closing'     => $stmtClosing,
            ':cashbook_bal'     => $cashbookBal,
            ':unpresented'      => $unpresented,
            ':deposits'         => $depositsInTransit,
            ':charges'          => $bankCharges,
            ':adj_bank'         => $adjustedBankBal,
            ':adj_cashbook'     => $adjustedCashbookBal,
            ':variance'         => $variance,
            ':status'           => abs($variance) < 0.01 ? 'RECONCILED' : 'DISCREPANCY',
            ':notes'            => $input['notes'] ?? 'Monthly Bank Reconciliation'
        ]);

        echo json_encode([
            'status'  => 'success',
            'message' => 'Bank reconciliation report created successfully',
            'data'    => [
                'id'                      => $stmt->fetchColumn(),
                'adjusted_bank_balance'   => $adjustedBankBal,
                'adjusted_cashbook_balance' => $adjustedCashbookBal,
                'variance'                => $variance
            ]
        ]);
    }
}