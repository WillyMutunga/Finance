<?php

namespace App\Controllers;

use App\Database;
use App\Services\LedgerService;
use App\Services\MPesaService;
use PDO;

class ParentPortalController
{
    private PDO $db;
    private LedgerService $ledgerService;
    private MPesaService $mpesaService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->ledgerService = new LedgerService();
        $this->mpesaService = new MPesaService();
    }

    /**
     * Complete Student Financial Profile for Parent View / PWA
     */
    public function studentSummary(string $studentId): void
    {
        $schoolId = Database::getTenantId();

        // 1. Fetch Student & School Profile
        $stmt = $this->db->prepare("
            SELECT s.*, c.name as class_name, st.name as stream_name,
                   sc.name as school_name, sc.email as school_email, sc.phone as school_phone,
                   sc.currency, sc.mpesa_paybill,
                   g.id as guardian_id, g.name as guardian_name, g.phone as guardian_phone
            FROM students s
            JOIN schools sc ON s.school_id = sc.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            LEFT JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = TRUE
            LEFT JOIN guardians g ON sg.guardian_id = g.id
            WHERE (s.id::text = :student_id OR LOWER(s.admission_number) = LOWER(:student_id)) AND s.school_id = :school_id
        ");
        $stmt->execute([':student_id' => $studentId, ':school_id' => $schoolId]);
        $student = $stmt->fetch();

        if (!$student) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Student not found']);
            return;
        }

        $studentId = $student['id']; // normalize to actual UUID

        // 2. Fetch Siblings linked to this parent
        $siblings = [];
        if (!empty($student['guardian_id'])) {
            $stmtSib = $this->db->prepare("
                SELECT s.id, s.admission_number, s.first_name, s.last_name, c.name as class_name
                FROM students s
                JOIN student_guardians sg ON s.id = sg.student_id
                JOIN classes c ON s.class_id = c.id
                WHERE sg.guardian_id = :guardian_id AND s.id != :student_id AND s.school_id = :school_id
            ");
            $stmtSib->execute([
                ':guardian_id' => $student['guardian_id'],
                ':student_id'  => $studentId,
                ':school_id'   => $schoolId
            ]);
            $siblings = $stmtSib->fetchAll();
        }

        // 3. Balance Calculation
        $balance = $this->ledgerService->getStudentBalance($schoolId, $studentId);

        // 4. Receipts History
        $stmtRct = $this->db->prepare("
            SELECT r.*, r.issued_at as date,
                   s.admission_number, s.first_name, s.last_name,
                   c.name as class_name,
                   pt.payment_mode, pt.reference_code, pt.payer_name
            FROM receipts r
            LEFT JOIN students s ON r.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN payment_transactions pt ON r.payment_transaction_id = pt.id
            WHERE r.student_id = :student_id AND r.school_id = :school_id
            ORDER BY r.issued_at DESC
        ");
        $stmtRct->execute([':student_id' => $studentId, ':school_id' => $schoolId]);
        $receipts = $stmtRct->fetchAll();

        // 5. Ledger Statement
        $stmtLedger = $this->db->prepare("
            SELECT tl.*
            FROM transaction_ledger tl
            WHERE tl.student_id = :student_id AND tl.school_id = :school_id
            ORDER BY tl.created_at ASC
        ");
        $stmtLedger->execute([':student_id' => $studentId, ':school_id' => $schoolId]);
        $ledger = $stmtLedger->fetchAll();

        // 6. Active Pledges
        $stmtPlg = $this->db->prepare("
            SELECT * FROM pledges
            WHERE student_id = :student_id AND school_id = :school_id
            ORDER BY expected_payment_date ASC
        ");
        $stmtPlg->execute([':student_id' => $studentId, ':school_id' => $schoolId]);
        $pledges = $stmtPlg->fetchAll();

        echo json_encode([
            'status' => 'success',
            'data'   => [
                'student'   => $student,
                'siblings'  => $siblings,
                'balance'   => $balance,
                'receipts'  => $receipts,
                'statement' => $ledger,
                'pledges'   => $pledges
            ]
        ]);
    }

    /**
     * Parent Initiates Direct M-Pesa STK Push from Phone
     */
    public function paySTK(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $studentId = trim($input['student_id'] ?? '');
        $phone     = trim($input['phone'] ?? '');
        $amount    = (float)($input['amount'] ?? 0);

        if (empty($studentId) || empty($phone) || $amount <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Student ID, Phone number, and Amount are required.']);
            return;
        }

        // Fetch student admission number for account reference
        $stmt = $this->db->prepare("SELECT admission_number FROM students WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $studentId, ':school_id' => $schoolId]);
        $admNo = $stmt->fetchColumn();

        if (!$admNo) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Student not found']);
            return;
        }

        $result = $this->mpesaService->initiateSTKPush($schoolId, $studentId, $phone, $amount, $admNo);
        echo json_encode(['status' => 'success', 'data' => $result]);
    }
}
