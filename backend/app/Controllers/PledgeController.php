<?php

namespace App\Controllers;

use App\Database;
use App\Services\SMSService;
use PDO;

class PledgeController
{
    private PDO $db;
    private SMSService $smsService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->smsService = new SMSService();
    }

    public function index(): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT p.*, s.first_name, s.last_name, s.admission_number, c.name as class_name,
                   g.name as guardian_name, g.phone as guardian_phone
            FROM pledges p
            JOIN students s ON p.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN guardians g ON p.guardian_id = g.id
            WHERE p.school_id = :school_id
            ORDER BY p.expected_payment_date ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
    }

    public function create(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $studentId    = trim($input['student_id'] ?? '');
        $guardianId   = trim($input['guardian_id'] ?? '');
        $amount       = (float)($input['amount'] ?? 0);
        $expectedDate = trim($input['expected_payment_date'] ?? '');
        $notes        = trim($input['notes'] ?? '');

        if (empty($studentId) || $amount <= 0 || empty($expectedDate)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Student, amount and expected payment date are required']);
            return;
        }

        // If guardianId not provided, fetch primary guardian
        if (empty($guardianId)) {
            $stmtG = $this->db->prepare("
                SELECT guardian_id FROM student_guardians 
                WHERE student_id = :student_id AND is_primary = TRUE LIMIT 1
            ");
            $stmtG->execute([':student_id' => $studentId]);
            $guardianId = $stmtG->fetchColumn() ?: null;
        }

        $stmt = $this->db->prepare("
            INSERT INTO pledges (
                school_id, student_id, guardian_id, amount, pledge_date, expected_payment_date, status, notes
            ) VALUES (
                :school_id, :student_id, :guardian_id, :amount, CURRENT_DATE, :expected_date, 'PENDING', :notes
            ) RETURNING id
        ");
        $stmt->execute([
            ':school_id'     => $schoolId,
            ':student_id'    => $studentId,
            ':guardian_id'   => $guardianId,
            ':amount'        => $amount,
            ':expected_date' => $expectedDate,
            ':notes'         => $notes
        ]);

        echo json_encode(['status' => 'success', 'data' => ['id' => $stmt->fetchColumn()]]);
    }

    public function sendReminder(string $id): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT p.*, s.first_name, s.last_name, s.admission_number, g.phone as guardian_phone, g.name as guardian_name,
                   sc.name as school_name, sc.currency, sc.mpesa_paybill
            FROM pledges p
            JOIN students s ON p.student_id = s.id
            JOIN schools sc ON p.school_id = sc.id
            LEFT JOIN guardians g ON p.guardian_id = g.id
            WHERE p.id = :id AND p.school_id = :school_id
        ");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        $pledge = $stmt->fetch();

        if (!$pledge || empty($pledge['guardian_phone'])) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Pledge or guardian phone not found']);
            return;
        }

        $curr = $pledge['currency'] ?: 'KES';
        $fmtAmount = number_format($pledge['amount'], 2);
        $date = date('d M Y', strtotime($pledge['expected_payment_date']));

        $msg = "Dear {$pledge['guardian_name']}, this is a friendly reminder of your fee pledge of {$curr} {$fmtAmount} for {$pledge['first_name']} (Adm: {$pledge['admission_number']}) due on {$date}. Paybill: {$pledge['mpesa_paybill']}, Acc: {$pledge['admission_number']}. {$pledge['school_name']}";

        // Record in SMS logs
        $stmtLog = $this->db->prepare("
            INSERT INTO sms_logs (school_id, recipient_phone, student_id, message_type, message_body, status, provider_message_id)
            VALUES (:school_id, :phone, :student_id, 'PLEDGE_ALERT', :body, 'SENT', :msg_id)
        ");
        $stmtLog->execute([
            ':school_id'   => $schoolId,
            ':phone'       => $pledge['guardian_phone'],
            ':student_id'  => $pledge['student_id'],
            ':body'        => $msg,
            ':msg_id'      => 'AT_PLG_' . uniqid()
        ]);

        echo json_encode(['status' => 'success', 'message' => "Pledge reminder SMS sent to {$pledge['guardian_phone']}."]);
    }
}
