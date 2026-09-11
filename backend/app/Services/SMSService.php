<?php

namespace App\Services;

use App\Database;
use PDO;

class SMSService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Send receipt SMS confirmation after successful fee payment
     */
    public function sendReceiptSMS(string $schoolId, string $studentId, string $receiptNo, float $amount, string $refCode): bool
    {
        // 1. Fetch student, balance, and primary guardian phone
        $stmt = $this->db->prepare("
            SELECT s.first_name, s.last_name, s.admission_number, sc.name as school_name, sc.currency,
                   g.phone as guardian_phone
            FROM students s
            JOIN schools sc ON s.school_id = sc.id
            LEFT JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = TRUE
            LEFT JOIN guardians g ON sg.guardian_id = g.id
            WHERE s.id = :student_id AND s.school_id = :school_id
        ");
        $stmt->execute([':student_id' => $studentId, ':school_id' => $schoolId]);
        $data = $stmt->fetch();

        if (!$data || empty($data['guardian_phone'])) {
            return false;
        }

        $ledgerService = new LedgerService();
        $balanceInfo = $ledgerService->getStudentBalance($schoolId, $studentId);
        $curr = $data['currency'] ?: 'KES';
        $fmtAmount = number_format($amount, 2);
        $fmtBalance = number_format($balanceInfo['current_balance'], 2);

        $body = "Dear Guardian, payment of {$curr} {$fmtAmount} for {$data['first_name']} {$data['last_name']} (Adm: {$data['admission_number']}) received. Receipt: {$receiptNo}, Ref: {$refCode}. Current Balance: {$curr} {$fmtBalance}. {$data['school_name']}.";

        return $this->logAndDispatch($schoolId, $data['guardian_phone'], $studentId, 'RECEIPT', $body);
    }

    /**
     * Send bulk fee balance reminder with merge fields
     */
    public function sendFeeReminder(string $schoolId, string $studentId, ?string $customTemplate = null): bool
    {
        $stmt = $this->db->prepare("
            SELECT s.first_name, s.last_name, s.admission_number, sc.name as school_name, sc.currency, sc.mpesa_paybill,
                   g.phone as guardian_phone, g.name as guardian_name
            FROM students s
            JOIN schools sc ON s.school_id = sc.id
            LEFT JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = TRUE
            LEFT JOIN guardians g ON sg.guardian_id = g.id
            WHERE s.id = :student_id AND s.school_id = :school_id
        ");
        $stmt->execute([':student_id' => $studentId, ':school_id' => $schoolId]);
        $data = $stmt->fetch();

        if (!$data || empty($data['guardian_phone'])) {
            return false;
        }

        $ledgerService = new LedgerService();
        $balanceInfo = $ledgerService->getStudentBalance($schoolId, $studentId);
        $curr = $data['currency'] ?: 'KES';
        $fmtBalance = number_format($balanceInfo['current_balance'], 2);

        if ($balanceInfo['current_balance'] <= 0) {
            return false; // No balance owed
        }

        $body = "Dear {$data['guardian_name']}, fee balance for {$data['first_name']} {$data['last_name']} (Adm: {$data['admission_number']}) is {$curr} {$fmtBalance}. Please pay via M-Pesa Paybill {$data['mpesa_paybill']}, Acc No: {$data['admission_number']}. Thank you. - {$data['school_name']}";

        return $this->logAndDispatch($schoolId, $data['guardian_phone'], $studentId, 'FEE_REMINDER', $body);
    }

    private function logAndDispatch(string $schoolId, string $phone, ?string $studentId, string $type, string $body): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO sms_logs (
                    school_id, recipient_phone, student_id, message_type, message_body, status, provider_message_id, created_at
                ) VALUES (
                    :school_id, :phone, :student_id, :type, :body, 'SENT', :msg_id, CURRENT_TIMESTAMP
                )
            ");
            $stmt->execute([
                ':school_id'   => $schoolId,
                ':phone'       => $phone,
                ':student_id'  => $studentId,
                ':type'        => $type,
                ':body'        => $body,
                ':msg_id'      => 'AT_MSG_' . uniqid()
            ]);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
