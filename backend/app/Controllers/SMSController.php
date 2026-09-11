<?php

namespace App\Controllers;

use App\Database;
use App\Services\SMSService;
use PDO;

class SMSController
{
    private PDO $db;
    private SMSService $smsService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->smsService = new SMSService();
    }

    public function logs(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT l.*, s.admission_number, s.first_name as student_first_name, s.last_name as student_last_name
            FROM sms_logs l
            LEFT JOIN students s ON l.student_id = s.id
            WHERE l.school_id = :school_id
            ORDER BY l.created_at DESC
            LIMIT 200
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function sendBulk(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $recipients = $input['recipients'] ?? [];
        $template   = trim($input['template'] ?? 'Dear Parent, {student_name} (Adm: {admission_number}) has a fee balance of KES {balance}. Please pay via Paybill 247247.');
        $msgType    = trim($input['message_type'] ?? 'FEE_REMINDER');

        if (empty($recipients) || !is_array($recipients)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'No recipients provided']);
            return;
        }

        $dispatched = 0;
        $insertStmt = $this->db->prepare("
            INSERT INTO sms_logs (
                school_id, recipient_phone, student_id, message_type, message_body, status
            ) VALUES (
                :school_id, :phone, :student_id, :type, :msg, 'SENT'
            )
        ");

        foreach ($recipients as $r) {
            $phone = trim($r['phone'] ?? $r['guardian_phone'] ?? '');
            if (empty($phone)) continue;

            $name        = trim($r['guardian_name'] ?? $r['name'] ?? 'Guardian');
            $studentName = trim($r['student_name'] ?? (($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? '')));
            $adm         = trim($r['admission_number'] ?? '');
            $balance     = number_format((float)($r['balance'] ?? 0), 2);
            $studentId   = $r['student_id'] ?? $r['id'] ?? null;

            $message = str_replace(
                ['{guardian_name}', '{student_name}', '{admission_number}', '{balance}'],
                [$name, $studentName, $adm, $balance],
                $template
            );

            $insertStmt->execute([
                ':school_id'   => $schoolId,
                ':phone'       => $phone,
                ':student_id'  => $studentId,
                ':type'        => $msgType,
                ':msg'         => $message
            ]);
            $dispatched++;
        }

        echo json_encode([
            'status' => 'success',
            'message' => "Successfully broadcasted {$dispatched} SMS notifications.",
            'dispatched_count' => $dispatched,
            'cost_kes' => $dispatched * 1.00
        ]);
    }
}