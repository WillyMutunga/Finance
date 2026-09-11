<?php

namespace App\Controllers;

use App\Database;
use App\Services\LedgerService;
use PDO;

class AdjustmentController
{
    private PDO $db;
    private LedgerService $ledgerService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->ledgerService = new LedgerService();
    }

    public function index(): void
    {
        $schoolId = Database::getTenantId();
        $type = $_GET['type'] ?? null;

        $sql = "
            SELECT 
                fa.*,
                s.admission_number,
                s.first_name,
                s.last_name,
                c.name as class_name,
                u.name as approved_by_name
            FROM fee_adjustments fa
            JOIN students s ON fa.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON fa.approved_by_user_id = u.id
            WHERE fa.school_id = :school_id
        ";
        $params = [':school_id' => $schoolId];

        if (!empty($type)) {
            $sql .= " AND fa.adjustment_type = :type";
            $params[':type'] = strtoupper($type);
        }

        $sql .= " ORDER BY fa.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function create(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $studentId = trim($input['student_id'] ?? '');
        $type      = strtoupper(trim($input['adjustment_type'] ?? 'DISCOUNT_WAIVER'));
        $amount    = (float)($input['amount'] ?? 0);
        $reason    = trim($input['reason'] ?? 'Fee adjustment approved by administration');
        $userId    = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        if (empty($studentId) || $amount <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Student and positive amount are required']);
            return;
        }

        $prefix = ($type === 'CREDIT_NOTE') ? 'CN' : (($type === 'DEBIT_NOTE') ? 'DN' : 'DW');
        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM fee_adjustments WHERE school_id = :school_id AND adjustment_type = :type");
        $countStmt->execute([':school_id' => $schoolId, ':type' => $type]);
        $nextNum = (int)$countStmt->fetchColumn() + 1;
        $refNumber = sprintf('%s-%s-%04d', $prefix, date('Y'), $nextNum);

        $this->db->beginTransaction();
        try {
            if ($type === 'DEBIT_NOTE') {
                $ledger = $this->ledgerService->recordEntry(
                    $schoolId,
                    $studentId,
                    'INVOICE_CHARGE',
                    $amount,
                    0.00,
                    "Debit Note: {$refNumber} - {$reason}",
                    null,
                    null,
                    $refNumber,
                    null,
                    $userId
                );
            } else {
                $ledger = $this->ledgerService->recordEntry(
                    $schoolId,
                    $studentId,
                    'DISCOUNT_WAIVER',
                    0.00,
                    $amount,
                    "{$type}: {$refNumber} - {$reason}",
                    null,
                    null,
                    $refNumber,
                    null,
                    $userId
                );
            }

            $stmt = $this->db->prepare("
                INSERT INTO fee_adjustments (
                    school_id, student_id, adjustment_type, amount, reference_number,
                    reason, approved_by_user_id, ledger_entry_id
                ) VALUES (
                    :school_id, :student_id, :type, :amount, :ref_no,
                    :reason, :user_id, :ledger_id
                ) RETURNING *
            ");
            $stmt->execute([
                ':school_id'   => $schoolId,
                ':student_id'  => $studentId,
                ':type'        => $type,
                ':amount'      => $amount,
                ':ref_no'      => $refNumber,
                ':reason'      => $reason,
                ':user_id'     => $userId,
                ':ledger_id'   => $ledger['id']
            ]);
            $record = $stmt->fetch(PDO::FETCH_ASSOC);

            $this->db->commit();
            echo json_encode([
                'status' => 'success',
                'message' => "Successfully issued {$type} {$refNumber} for KES " . number_format($amount, 2),
                'data' => $record
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * 1. Payments in Kind (Agricultural Produce / Goods / Labor)
     */
    public function getPaymentsInKind(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT 
                pik.*,
                s.admission_number,
                s.first_name,
                s.last_name,
                c.name as class_name,
                u.name as received_by_name
            FROM payments_in_kind pik
            JOIN students s ON pik.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON pik.received_by_user_id = u.id
            WHERE pik.school_id = :school_id
            ORDER BY pik.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function createPaymentInKind(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $studentId   = trim($input['student_id'] ?? '');
        $itemName    = trim($input['item_name'] ?? 'Maize Produce');
        $quantity    = (float)($input['quantity'] ?? 0);
        $unit        = trim($input['unit_of_measure'] ?? 'Bags');
        $unitPrice   = (float)($input['unit_price'] ?? 0);
        $deliveredBy = trim($input['delivered_by'] ?? 'Parent / Guardian');
        $notes       = trim($input['notes'] ?? 'Agricultural produce delivered to school store');
        $userId      = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        if (empty($studentId) || $quantity <= 0 || $unitPrice <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Student, quantity, and positive unit rate are required.']);
            return;
        }

        $totalValue = $quantity * $unitPrice;

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM payments_in_kind WHERE school_id = :school_id");
        $countStmt->execute([':school_id' => $schoolId]);
        $nextNum = (int)$countStmt->fetchColumn() + 1;
        $receiptNumber = sprintf('PIK-%s-%04d', date('Y'), $nextNum);

        $this->db->beginTransaction();
        try {
            $ledger = $this->ledgerService->recordEntry(
                $schoolId,
                $studentId,
                'PAYMENT_CREDIT',
                0.00,
                $totalValue,
                "Payment In Kind: {$quantity} {$unit} of {$itemName} @ KES {$unitPrice} (Voucher {$receiptNumber})",
                null,
                null,
                $receiptNumber,
                null,
                $userId
            );

            $stmt = $this->db->prepare("
                INSERT INTO payments_in_kind (
                    school_id, student_id, item_name, quantity, unit_of_measure, unit_price, total_value,
                    receipt_number, delivered_by, received_by_user_id, notes, ledger_entry_id
                ) VALUES (
                    :school_id, :student_id, :item_name, :quantity, :unit, :unit_price, :total_value,
                    :receipt_no, :delivered_by, :user_id, :notes, :ledger_id
                ) RETURNING *
            ");
            $stmt->execute([
                ':school_id'    => $schoolId,
                ':student_id'   => $studentId,
                ':item_name'    => $itemName,
                ':quantity'     => $quantity,
                ':unit'         => $unit,
                ':unit_price'   => $unitPrice,
                ':total_value'  => $totalValue,
                ':receipt_no'   => $receiptNumber,
                ':delivered_by' => $deliveredBy,
                ':user_id'      => $userId,
                ':notes'        => $notes,
                ':ledger_id'    => $ledger['id']
            ]);
            $record = $stmt->fetch(PDO::FETCH_ASSOC);

            $this->db->commit();
            echo json_encode([
                'status'  => 'success',
                'message' => "Successfully recorded in-kind payment {$receiptNumber} valued at KES " . number_format($totalValue, 2),
                'data'    => $record
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * 2. Bursaries & Scholarships
     */
    public function getBursaries(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT b.*, s.admission_number, s.first_name, s.last_name, c.name as class_name, t.name as term_name
            FROM bursaries b
            JOIN students s ON b.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN terms t ON b.term_id = t.id
            WHERE b.school_id = :school_id
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function createBursary(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $studentId   = trim($input['student_id'] ?? '');
        $sponsorName = trim($input['sponsor_name'] ?? 'NG-CDF Bursary Fund');
        $chequeNo    = trim($input['cheque_number'] ?? ('CHQ-' . rand(100000, 999999)));
        $amount      = (float)($input['amount'] ?? 0);
        $date        = trim($input['disbursement_date'] ?? date('Y-m-d'));
        $termId      = !empty($input['term_id']) ? trim($input['term_id']) : null;
        $notes       = trim($input['notes'] ?? 'Bursary allocation credited to learner fees');
        $userId      = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        if (empty($studentId) || $amount <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Please select a student and specify a valid amount.']);
            return;
        }

        $this->db->beginTransaction();
        try {
            $refNumber = "BUR-" . date('Y') . '-' . sprintf('%04d', rand(1000, 9999));

            $ledger = $this->ledgerService->recordEntry(
                $schoolId,
                $studentId,
                'PAYMENT_CREDIT',
                0.00,
                $amount,
                "Bursary Disbursement: {$sponsorName} (Cheque/Ref: {$chequeNo})",
                $termId,
                null,
                $refNumber,
                null,
                $userId
            );

            $stmt = $this->db->prepare("
                INSERT INTO bursaries (
                    school_id, student_id, sponsor_name, cheque_number, amount,
                    disbursement_date, term_id, notes, status, ledger_entry_id
                ) VALUES (
                    :school_id, :student_id, :sponsor_name, :cheque_no, :amount,
                    :disbursement_date, :term_id, :notes, 'DISBURSED', :ledger_id
                ) RETURNING *
            ");
            $stmt->execute([
                ':school_id'          => $schoolId,
                ':student_id'         => $studentId,
                ':sponsor_name'       => $sponsorName,
                ':cheque_no'          => $chequeNo,
                ':amount'             => $amount,
                ':disbursement_date'  => $date,
                ':term_id'            => $termId,
                ':notes'              => $notes,
                ':ledger_id'          => $ledger['id']
            ]);
            $record = $stmt->fetch(PDO::FETCH_ASSOC);

            $this->db->commit();
            echo json_encode([
                'status'  => 'success',
                'message' => "Bursary of KES " . number_format($amount, 2) . " from {$sponsorName} credited successfully.",
                'data'    => $record
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * 3. Government Grants / Capitation
     */
    public function getGrants(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT g.*, t.name as term_name
            FROM grants g
            LEFT JOIN terms t ON g.term_id = t.id
            WHERE g.school_id = :school_id
            ORDER BY g.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function createGrant(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $grantType = trim($input['grant_type'] ?? 'Ministry of Education (FDSE Capitation)');
        $title     = trim($input['title'] ?? 'Term Free Day Secondary Education Grant');
        $amount    = (float)($input['amount'] ?? 0);
        $ref       = trim($input['reference_number'] ?? ('MOE-' . rand(10000, 99999)));
        $bankAcc   = trim($input['bank_account'] ?? 'Main Operations Account (KCB)');
        $termId    = !empty($input['term_id']) ? trim($input['term_id']) : null;
        $notes     = trim($input['notes'] ?? 'Direct capitation deposit');

        if ($amount <= 0 || empty($title)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Grant title and positive amount are required.']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO grants (
                school_id, grant_type, title, amount, reference_number,
                bank_account, term_id, notes
            ) VALUES (
                :school_id, :grant_type, :title, :amount, :ref,
                :bank_acc, :term_id, :notes
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id'   => $schoolId,
            ':grant_type'  => $grantType,
            ':title'       => $title,
            ':amount'      => $amount,
            ':ref'         => $ref,
            ':bank_acc'    => $bankAcc,
            ':term_id'     => $termId,
            ':notes'       => $notes
        ]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'status'  => 'success',
            'message' => "Grant {$ref} of KES " . number_format($amount, 2) . " recorded successfully.",
            'data'    => $record
        ]);
    }

    /**
     * 4. Fee Pledges
     */
    public function getPledges(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT p.*, s.admission_number, s.first_name, s.last_name, c.name as class_name
            FROM pledges p
            JOIN students s ON p.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE p.school_id = :school_id
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function createPledge(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $studentId = trim($input['student_id'] ?? '');
        $pledger   = trim($input['pledger_name'] ?? 'Parent / Sponsor');
        $phone     = trim($input['pledger_phone'] ?? '');
        $amount    = (float)($input['amount'] ?? 0);
        $dueDate   = trim($input['expected_payment_date'] ?? date('Y-m-d', strtotime('+30 days')));
        $notes     = trim($input['notes'] ?? 'Committed to clear fees before end of term');

        if (empty($studentId) || $amount <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Please select a student and specify pledged amount.']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO pledges (
                school_id, student_id, pledger_name, pledger_phone, amount,
                expected_payment_date, notes, status
            ) VALUES (
                :school_id, :student_id, :pledger, :phone, :amount,
                :due_date, :notes, 'PENDING'
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':student_id'=> $studentId,
            ':pledger'   => $pledger,
            ':phone'     => $phone,
            ':amount'    => $amount,
            ':due_date'  => $dueDate,
            ':notes'     => $notes
        ]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'status'  => 'success',
            'message' => "Fee pledge of KES " . number_format($amount, 2) . " recorded for {$pledger}.",
            'data'    => $record
        ]);
    }
}