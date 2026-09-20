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
            LIMIT 250
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function getGatewayConfig(): void
    {
        $schoolId = Database::getTenantId();
        $config = $this->smsService->getGatewayConfig($schoolId);
        // Mask API Key slightly for safety if present
        $maskedKey = !empty($config['api_key']) 
            ? (strlen($config['api_key']) > 8 ? substr($config['api_key'], 0, 4) . '...' . substr($config['api_key'], -4) : '********')
            : '';

        echo json_encode([
            'status' => 'success',
            'data' => array_merge($config, [
                'has_api_key' => !empty($config['api_key']),
                'masked_api_key' => $maskedKey
            ])
        ]);
    }

    public function saveGatewayConfig(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $existing = $this->smsService->getGatewayConfig($schoolId);

        // If client sends empty api_key but has_api_key was true, keep existing
        $apiKey = trim($input['api_key'] ?? '');
        if (empty($apiKey) && !empty($existing['api_key'])) {
            $apiKey = $existing['api_key'];
        }

        $config = [
            'provider'   => trim($input['provider'] ?? 'africastalking'),
            'api_key'    => $apiKey,
            'username'   => trim($input['username'] ?? ''),
            'sender_id'  => trim($input['sender_id'] ?? 'SCHOOLFIN'),
            'is_sandbox' => !empty($input['is_sandbox']),
            'is_enabled' => isset($input['is_enabled']) ? (bool)$input['is_enabled'] : true,
        ];

        $this->smsService->saveGatewayConfig($schoolId, $config);

        echo json_encode([
            'status' => 'success',
            'message' => 'SMS Gateway configuration saved successfully.'
        ]);
    }

    public function sendTestSMS(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $phone   = trim($input['phone'] ?? '');
        $message = trim($input['message'] ?? 'Test SMS from School Finance Portal. Gateway connection is functional.');

        if (empty($phone)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Phone number is required for test dispatch.']);
            return;
        }

        $res = $this->smsService->dispatch($schoolId, $phone, null, 'TEST_SMS', $message);

        if ($res['success']) {
            echo json_encode([
                'status' => 'success',
                'message' => "Test SMS sent successfully to {$phone}!",
                'data' => $res
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => $res['error_message'] ?? 'Failed to send test SMS.',
                'data' => $res
            ]);
        }
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

        $successCount = 0;
        $failedCount  = 0;
        $lastError    = null;

        foreach ($recipients as $r) {
            $phone = trim($r['phone'] ?? $r['guardian_phone'] ?? '');
            if (empty($phone)) {
                $failedCount++;
                continue;
            }

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

            $result = $this->smsService->dispatch($schoolId, $phone, $studentId, $msgType, $message);
            if ($result['success']) {
                $successCount++;
            } else {
                $failedCount++;
                $lastError = $result['error_message'] ?? 'Gateway Error';
            }
        }

        if ($failedCount > 0 && $successCount === 0) {
            echo json_encode([
                'status' => 'error',
                'message' => "All {$failedCount} SMS dispatches failed. " . ($lastError ?: 'Please verify your SMS Gateway configuration.'),
                'dispatched_count' => 0,
                'failed_count' => $failedCount,
                'last_error' => $lastError
            ]);
        } else {
            echo json_encode([
                'status' => 'success',
                'message' => "SMS Broadcast complete: {$successCount} sent, {$failedCount} failed.",
                'dispatched_count' => $successCount,
                'failed_count' => $failedCount,
                'cost_kes' => $successCount * 0.80
            ]);
        }
    }
}