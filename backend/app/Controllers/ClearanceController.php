<?php

namespace App\Controllers;

use App\Database;
use PDO;

class ClearanceController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getClearanceRequests(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT cr.*, s.first_name, s.last_name, s.admission_number, c.name as class_name,
                   u.name as cleared_by_name
            FROM clearance_requests cr
            JOIN students s ON cr.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON cr.cleared_by = u.id
            WHERE cr.school_id = :school_id
            ORDER BY cr.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function auditStudentClearance(string $studentId): void
    {
        $schoolId = Database::getTenantId();

        // 1. Fee Balance Check
        $stmtBal = $this->db->prepare("
            SELECT COALESCE(SUM(debit_amount - credit_amount), 0) as balance
            FROM transaction_ledger
            WHERE student_id = :student_id AND school_id = :school_id
        ");
        $stmtBal->execute([':student_id' => $studentId, ':school_id' => $schoolId]);
        $feeBalance = (float)$stmtBal->fetchColumn();

        // 2. Pocket Money Account Check
        $stmtPocket = $this->db->prepare("
            SELECT balance FROM pocket_money_accounts WHERE student_id = :student_id AND school_id = :school_id
        ");
        $stmtPocket->execute([':student_id' => $studentId, ':school_id' => $schoolId]);
        $pocketBalance = (float)($stmtPocket->fetchColumn() ?: 0);

        // 3. Student details
        $stmtStudent = $this->db->prepare("
            SELECT s.*, c.name as class_name
            FROM students s
            JOIN classes c ON s.class_id = c.id
            WHERE s.id = :student_id AND s.school_id = :school_id
        ");
        $stmtStudent->execute([':student_id' => $studentId, ':school_id' => $schoolId]);
        $student = $stmtStudent->fetch(PDO::FETCH_ASSOC);

        $isEligible = ($feeBalance <= 0.00);

        echo json_encode([
            'status' => 'success',
            'data'   => [
                'student'           => $student,
                'fee_balance'       => $feeBalance,
                'pocket_balance'    => $pocketBalance,
                'is_eligible'       => $isEligible,
                'checks'            => [
                    'finance'  => $feeBalance <= 0 ? 'CLEARED' : 'PENDING_PAYMENT',
                    'library'  => 'CLEARED',
                    'boarding' => 'CLEARED',
                    'sports'   => 'CLEARED'
                ]
            ]
        ]);
    }

    public function createClearanceRequest(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $studentId = $input['student_id'] ?? null;
        $reason = $input['request_reason'] ?? 'GRADUATION';

        if (!$studentId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Student ID is required']);
            return;
        }

        // Calculate current balance
        $stmtBal = $this->db->prepare("SELECT COALESCE(SUM(debit_amount - credit_amount), 0) FROM transaction_ledger WHERE student_id = :student_id");
        $stmtBal->execute([':student_id' => $studentId]);
        $balance = (float)$stmtBal->fetchColumn();

        $certNo = 'CERT-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(4)));
        $isCleared = ($balance <= 0);

        $stmt = $this->db->prepare("
            INSERT INTO clearance_requests (
                school_id, student_id, request_reason, finance_status, finance_balance,
                library_status, boarding_status, sports_status, overall_status, certificate_number,
                cleared_at, remarks
            ) VALUES (
                :school_id, :student_id, :reason, :finance_status, :balance,
                'CLEARED', 'CLEARED', 'CLEARED', :overall_status, :cert_no,
                :cleared_at, :remarks
            ) RETURNING id
        ");
        $stmt->execute([
            ':school_id'       => $schoolId,
            ':student_id'      => $studentId,
            ':reason'          => $reason,
            ':finance_status'  => $isCleared ? 'CLEARED' : 'PENDING',
            ':balance'         => $balance,
            ':overall_status'  => $isCleared ? 'CLEARED' : 'PENDING',
            ':cert_no'         => $certNo,
            ':cleared_at'      => $isCleared ? date('Y-m-d H:i:s') : null,
            ':remarks'         => $input['remarks'] ?? 'Official Student Clearance'
        ]);

        echo json_encode([
            'status'  => 'success',
            'message' => $isCleared ? 'Student successfully cleared and certificate issued.' : 'Clearance initiated. Pending fee settlement.',
            'data'    => ['id' => $stmt->fetchColumn(), 'certificate_number' => $certNo, 'status' => $isCleared ? 'CLEARED' : 'PENDING']
        ]);
    }
}