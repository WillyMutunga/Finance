<?php

namespace App\Controllers;

use App\Database;
use App\Services\LedgerService;
use App\Services\ReconciliationEngine;
use App\Services\SMSService;
use PDO;

class PaymentController
{
    private PDO $db;
    private LedgerService $ledgerService;
    private ReconciliationEngine $reconEngine;
    private SMSService $smsService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->ledgerService = new LedgerService();
        $this->reconEngine = new ReconciliationEngine();
        $this->smsService = new SMSService();
    }

    public function index(): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT 
                pt.*, 
                r.id as receipt_id,
                r.receipt_number, 
                s.id as student_id,
                s.first_name, 
                s.last_name, 
                s.admission_number, 
                s.boarding_status,
                c.name as class_name,
                tl.id as ledger_entry_id
            FROM payment_transactions pt
            LEFT JOIN receipts r ON pt.id = r.payment_transaction_id
            LEFT JOIN students s ON r.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN transaction_ledger tl ON r.ledger_entry_id = tl.id
            WHERE pt.school_id = :school_id
            ORDER BY pt.payment_date DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    /**
     * Manual Cash/Cheque/Bank slip/M-Pesa receipting
     */
    public function recordManual(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $studentId = trim($input['student_id'] ?? '');
        $amount    = (float)($input['amount'] ?? 0);
                $rawChannel = strtoupper(trim(str_replace([' ', '-'], '_', $input['channel'] ?? 'BANK_DEPOSIT')));
        $channel = match($rawChannel) {
            'M_PESA', 'MPESA', 'MPESA_C2B', 'MPESA_PAYBILL' => 'MPESA_C2B',
            'MPESA_STK', 'STK_PUSH'                          => 'MPESA_STK',
            'CASH', 'CASH_OFFICE'                            => 'CASH',
            'CHEQUE', 'CHECK', 'BANKERS_CHEQUE'              => 'CHEQUE',
            'BANK_TRANSFER', 'EFT', 'RTGS'                   => 'BANK_TRANSFER',
            'BANK_DEPOSIT', 'BANK_SLIP', 'BANK', 'DIRECT_DEPOSIT' => 'BANK_DEPOSIT',
            default                                          => 'MPESA_C2B'
        };
        $reference = trim($input['reference_number'] ?? ('REC-' . rand(10000, 99999)));
        $notes     = trim($input['notes'] ?? 'Fee Collection Receipt');
        $userId    = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        if (empty($studentId) || $amount <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Please select a student and enter a valid positive amount.']);
            return;
        }

        $this->db->beginTransaction();
        try {
            // 1. Create Payment Transaction
            $stmtTx = $this->db->prepare("
                INSERT INTO payment_transactions (
                    school_id, channel, reference_number, amount, payer_name,
                    account_reference, payment_date, reconciliation_status, reconciled_at
                ) VALUES (
                    :school_id, :channel, :ref, :amount, :payer_name,
                    :acc_ref, CURRENT_TIMESTAMP, 'MANUALLY_MATCHED', CURRENT_TIMESTAMP
                ) RETURNING id
            ");
            $stmtTx->execute([
                ':school_id'  => $schoolId,
                ':channel'    => $channel,
                ':ref'        => $reference,
                ':amount'     => $amount,
                ':payer_name' => $input['payer_name'] ?? 'Parent / Guardian',
                ':acc_ref'    => $notes
            ]);
            $transactionId = $stmtTx->fetchColumn();

            // 2. Finalize Reconciliation & Issue Receipt
            $result = $this->reconEngine->finalizeReconciliation(
                $schoolId,
                $transactionId,
                $studentId,
                $amount,
                'MANUAL_BURSAR_ENTRY',
                100.0,
                $notes,
                $reference,
                $channel,
                $userId
            );

            $this->db->commit();
            echo json_encode([
                'status'  => 'success',
                'message' => "Payment of KES " . number_format($amount, 2) . " recorded successfully with Receipt #" . ($result['receipt_number'] ?? ''),
                'data'    => $result
            ]);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * Maker Reversal Request (Cashier submits request)
     */
    public function requestReversal(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $paymentId = trim($input['payment_id'] ?? '');
        $receiptNo = trim($input['receipt_number'] ?? '');
        $studentId = trim($input['student_id'] ?? '');
        $amount    = (float)($input['amount'] ?? 0);
        $channel   = trim($input['channel'] ?? 'CASH');
        $reason    = trim($input['reason'] ?? 'Erroneous posting / duplicate transaction');
        $userId    = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        if (empty($receiptNo) || empty($reason)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Receipt number and reason are required.']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO payment_reversals (
                school_id, payment_transaction_id, receipt_number, student_id, amount, channel,
                requested_by_user_id, reason, status
            ) VALUES (
                :school_id, :payment_id, :receipt_no, :student_id, :amount, :channel,
                :user_id, :reason, 'PENDING'
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id'   => $schoolId,
            ':payment_id'  => !empty($paymentId) ? $paymentId : null,
            ':receipt_no'  => $receiptNo,
            ':student_id'  => $studentId,
            ':amount'      => $amount,
            ':channel'     => $channel,
            ':user_id'     => $userId,
            ':reason'      => $reason
        ]);
        $reversal = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'status'  => 'success',
            'message' => "Reversal request for receipt {$receiptNo} submitted for administrator approval.",
            'data'    => $reversal
        ]);
    }

    public function getPendingReversals(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT pr.*, s.first_name, s.last_name, s.admission_number, c.name as class_name, u.name as requested_by_name
            FROM payment_reversals pr
            JOIN students s ON pr.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON pr.requested_by_user_id = u.id
            WHERE pr.school_id = :school_id AND pr.status = 'PENDING'
            ORDER BY pr.requested_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function approveReversal(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $reviewerId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        $stmtRev = $this->db->prepare("SELECT * FROM payment_reversals WHERE id = :id AND school_id = :school_id");
        $stmtRev->execute([':id' => $id, ':school_id' => $schoolId]);
        $reversal = $stmtRev->fetch(PDO::FETCH_ASSOC);

        if (!$reversal) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Reversal request not found.']);
            return;
        }

        $this->db->beginTransaction();
        try {
            // Find corresponding ledger entry
            $stmtL = $this->db->prepare("
                SELECT id FROM transaction_ledger 
                WHERE school_id = :school_id AND receipt_number = :receipt_no AND entry_type = 'PAYMENT_CREDIT'
                LIMIT 1
            ");
            $stmtL->execute([':school_id' => $schoolId, ':receipt_no' => $reversal['receipt_number']]);
            $originalLedgerId = $stmtL->fetchColumn();

            $reversingLedger = null;
            if ($originalLedgerId) {
                $reversingLedger = $this->ledgerService->reverseEntry($schoolId, $originalLedgerId, $reversal['reason'], $reviewerId);
            } else {
                // Post debit reversal directly
                $reversingLedger = $this->ledgerService->recordEntry(
                    $schoolId,
                    $reversal['student_id'],
                    'REVERSAL',
                    (float)$reversal['amount'],
                    0.00,
                    "Reversal of Receipt {$reversal['receipt_number']} - {$reversal['reason']}",
                    null,
                    null,
                    $reversal['receipt_number'],
                    null,
                    $reviewerId
                );
            }

            // Update reversal status
            $stmtUp = $this->db->prepare("
                UPDATE payment_reversals 
                SET status = 'APPROVED', approved_by_user_id = :reviewer_id, reversing_ledger_id = :ledger_id, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ");
            $stmtUp->execute([
                ':reviewer_id' => $reviewerId,
                ':ledger_id'   => $reversingLedger['id'] ?? null,
                ':id'          => $id
            ]);

            $this->db->commit();
            echo json_encode([
                'status'  => 'success',
                'message' => "Receipt {$reversal['receipt_number']} reversed successfully and ledger adjusted.",
                'data'    => $reversingLedger
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function rejectReversal(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $rejectionReason = trim($input['rejection_reason'] ?? 'Reversal request rejected by administrator');
        $reviewerId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        $stmt = $this->db->prepare("
            UPDATE payment_reversals 
            SET status = 'REJECTED', approved_by_user_id = :reviewer_id, rejection_reason = :reason, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
        ");
        $stmt->execute([
            ':reviewer_id' => $reviewerId,
            ':reason'      => $rejectionReason,
            ':id'          => $id,
            ':school_id'   => $schoolId
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Reversal request rejected.']);
    }

    public function getReversedReceipts(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT pr.*, s.first_name, s.last_name, s.admission_number, c.name as class_name,
                   req.name as requested_by_name, app.name as approved_by_name
            FROM payment_reversals pr
            JOIN students s ON pr.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users req ON pr.requested_by_user_id = req.id
            LEFT JOIN users app ON pr.approved_by_user_id = app.id
            WHERE pr.school_id = :school_id AND pr.status = 'APPROVED'
            ORDER BY pr.reviewed_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function getOverpayments(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT 
                s.id, s.admission_number, s.first_name, s.last_name, s.gender, s.boarding_status,
                c.name as class_name,
                COALESCE(SUM(tl.debit_amount), 0) as total_billed,
                COALESCE(SUM(tl.credit_amount), 0) as total_paid,
                (COALESCE(SUM(tl.credit_amount), 0) - COALESCE(SUM(tl.debit_amount), 0)) as credit_balance
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN transaction_ledger tl ON s.id = tl.student_id
            WHERE s.school_id = :school_id AND s.status = 'ACTIVE'
            GROUP BY s.id, c.name
            HAVING (COALESCE(SUM(tl.credit_amount), 0) - COALESCE(SUM(tl.debit_amount), 0)) > 0
            ORDER BY credit_balance DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function transferOverpayment(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $sourceStudentId = trim($input['source_student_id'] ?? '');
        $targetStudentId = trim($input['target_student_id'] ?? '');
        $amount          = (float)($input['amount'] ?? 0);
        $notes           = trim($input['notes'] ?? 'Credit transfer to sibling/learner');
        $userId          = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        if (empty($sourceStudentId) || empty($targetStudentId) || $amount <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Source student, target student, and positive amount are required.']);
            return;
        }

        $this->db->beginTransaction();
        try {
            $ref = 'TRF-' . date('Y') . '-' . sprintf('%04d', rand(1000, 9999));

            // 1. Debit Source Student (reducing their overpayment)
            $this->ledgerService->recordEntry(
                $schoolId,
                $sourceStudentId,
                'INVOICE_CHARGE',
                $amount,
                0.00,
                "Credit Balance Transfer to student ({$ref}) - {$notes}",
                null,
                null,
                $ref,
                null,
                $userId
            );

            // 2. Credit Target Student (paying towards their fees)
            $this->ledgerService->recordEntry(
                $schoolId,
                $targetStudentId,
                'PAYMENT_CREDIT',
                0.00,
                $amount,
                "Credit Balance Received from student ({$ref}) - {$notes}",
                null,
                null,
                $ref,
                null,
                $userId
            );

            $this->db->commit();
            echo json_encode([
                'status'  => 'success',
                'message' => "Successfully transferred KES " . number_format($amount, 2) . " credit balance (Ref: {$ref})."
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function getReceipt(string $id): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT r.*, sc.name as school_name, sc.address as school_address, sc.phone as school_phone,
                   sc.email as school_email, sc.currency, sc.mpesa_paybill,
                   s.first_name, s.last_name, s.admission_number, c.name as class_name,
                   tl.created_at as transaction_time
            FROM receipts r
            JOIN schools sc ON r.school_id = sc.id
            JOIN students s ON r.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            JOIN transaction_ledger tl ON r.ledger_entry_id = tl.id
            WHERE (r.id = :id OR r.receipt_number = :id) AND r.school_id = :school_id
        ");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        $receipt = $stmt->fetch();

        if (!$receipt) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Receipt not found']);
            return;
        }

        $balanceInfo = $this->ledgerService->getStudentBalance($schoolId, $receipt['student_id']);
        $receipt['student_balance'] = $balanceInfo['current_balance'];

        echo json_encode(['status' => 'success', 'data' => $receipt]);
    }
}