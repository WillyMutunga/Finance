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
     * Retrieve SMS Gateway config for tenant/school
     */
    public function getGatewayConfig(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT config_key, config_value 
            FROM system_configurations 
            WHERE school_id = :school_id AND category = 'SMS_GATEWAY'
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        return [
            'provider'       => $rows['sms_provider'] ?? getenv('SMS_PROVIDER') ?: 'africastalking',
            'api_key'        => $rows['sms_api_key'] ?? getenv('AT_API_KEY') ?: '',
            'username'       => $rows['sms_username'] ?? getenv('AT_USERNAME') ?: '',
            'sender_id'      => $rows['sms_sender_id'] ?? getenv('AT_SENDER_ID') ?: 'SCHOOLFIN',
            'is_sandbox'     => ($rows['sms_is_sandbox'] ?? getenv('AT_SANDBOX') ?: 'false') === 'true',
            'is_enabled'     => ($rows['sms_is_enabled'] ?? 'true') === 'true',
        ];
    }

    /**
     * Save SMS Gateway config for tenant/school
     */
    public function saveGatewayConfig(string $schoolId, array $config): bool
    {
        $keys = [
            'sms_provider'   => $config['provider'] ?? 'africastalking',
            'sms_api_key'    => $config['api_key'] ?? '',
            'sms_username'   => $config['username'] ?? '',
            'sms_sender_id'  => $config['sender_id'] ?? 'SCHOOLFIN',
            'sms_is_sandbox' => !empty($config['is_sandbox']) ? 'true' : 'false',
            'sms_is_enabled' => !empty($config['is_enabled']) ? 'true' : 'false',
        ];

        foreach ($keys as $k => $v) {
            // Check if key already exists
            $check = $this->db->prepare("SELECT id FROM system_configurations WHERE school_id = :school_id AND config_key = :k");
            $check->execute([':school_id' => $schoolId, ':k' => $k]);
            $existing = $check->fetch();

            if ($existing) {
                $up = $this->db->prepare("UPDATE system_configurations SET config_value = :v, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
                $up->execute([':v' => $v, ':id' => $existing['id']]);
            } else {
                $id = $this->generateUUID();
                $ins = $this->db->prepare("
                    INSERT INTO system_configurations (id, school_id, category, config_key, config_value, created_at, updated_at)
                    VALUES (:id, :school_id, 'SMS_GATEWAY', :k, :v, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ");
                $ins->execute([':id' => $id, ':school_id' => $schoolId, ':k' => $k, ':v' => $v]);
            }
        }

        return true;
    }

    /**
     * Normalize Kenyan & international phone numbers to E.164 (+254...)
     */
    public function normalizePhoneNumber(string $phone): string
    {
        $clean = preg_replace('/[^0-9+]/', '', trim($phone));
        if (strpos($clean, '+') === 0) {
            return $clean;
        }
        if (strpos($clean, '254') === 0) {
            return '+' . $clean;
        }
        if (strpos($clean, '0') === 0) {
            return '+254' . substr($clean, 1);
        }
        if (strlen($clean) === 9 && ($clean[0] === '7' || $clean[0] === '1')) {
            return '+254' . $clean;
        }
        return '+' . $clean;
    }

    /**
     * Dispatch single SMS and log result in database
     */
    public function dispatch(string $schoolId, string $phone, ?string $studentId, string $type, string $body): array
    {
        $normalizedPhone = $this->normalizePhoneNumber($phone);
        $config = $this->getGatewayConfig($schoolId);

        // Validation: Empty or unconfigured credentials
        if (empty($config['api_key']) || empty($config['username'])) {
            $errorMsg = "SMS Gateway Not Configured: Missing {$config['provider']} API Key or Username. Please configure your gateway credentials in SMS Settings.";
            $logId = $this->logSMS($schoolId, $normalizedPhone, $studentId, $type, $body, 'GATEWAY_ERROR', null, $errorMsg);
            return [
                'success'       => false,
                'status'        => 'GATEWAY_ERROR',
                'error_message' => $errorMsg,
                'log_id'        => $logId
            ];
        }

        if (!$config['is_enabled']) {
            $errorMsg = "SMS Gateway is currently disabled in system settings.";
            $logId = $this->logSMS($schoolId, $normalizedPhone, $studentId, $type, $body, 'DISABLED', null, $errorMsg);
            return [
                'success'       => false,
                'status'        => 'DISABLED',
                'error_message' => $errorMsg,
                'log_id'        => $logId
            ];
        }

        // Call Africa's Talking API
        $response = $this->sendViaAfricasTalking($config, $normalizedPhone, $body);

        if ($response['success']) {
            $logId = $this->logSMS($schoolId, $normalizedPhone, $studentId, $type, $body, 'DELIVERED', $response['message_id'] ?? null, null);
            return [
                'success'    => true,
                'status'     => 'DELIVERED',
                'message_id' => $response['message_id'] ?? null,
                'log_id'     => $logId
            ];
        } else {
            $logId = $this->logSMS($schoolId, $normalizedPhone, $studentId, $type, $body, 'GATEWAY_ERROR', null, $response['error']);
            return [
                'success'       => false,
                'status'        => 'GATEWAY_ERROR',
                'error_message' => $response['error'],
                'log_id'        => $logId
            ];
        }
    }

    /**
     * Africa's Talking SMS API Handler
     */
    private function sendViaAfricasTalking(array $config, string $phone, string $body): array
    {
        $isSandbox = !empty($config['is_sandbox']);
        $url = $isSandbox 
            ? 'https://api.sandbox.africastalking.com/version1/messaging' 
            : 'https://api.africastalking.com/version1/messaging';

        $postData = [
            'username' => $config['username'],
            'to'       => $phone,
            'message'  => $body,
        ];

        if (!empty($config['sender_id']) && !$isSandbox) {
            $postData['from'] = $config['sender_id'];
        }

        if (!function_exists('curl_init')) {
            return [
                'success' => false,
                'error'   => 'PHP cURL extension is not enabled on this server.'
            ];
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apiKey: ' . $config['api_key'],
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            return [
                'success' => false,
                'error'   => "Gateway Connection Error: {$curlErr}"
            ];
        }

        $json = json_decode($result, true);

        if ($httpCode === 201 || $httpCode === 200) {
            $recipients = $json['SMSMessageData']['Recipients'] ?? [];
            if (!empty($recipients)) {
                $first = $recipients[0];
                $status = $first['status'] ?? 'Success';
                if ($status === 'Success') {
                    return [
                        'success'    => true,
                        'message_id' => $first['messageId'] ?? null,
                        'cost'       => $first['cost'] ?? null
                    ];
                } else {
                    return [
                        'success' => false,
                        'error'   => "Africa's Talking Rejected: Status '{$status}' for recipient {$phone} (Status Code: " . ($first['statusCode'] ?? 'N/A') . ")"
                    ];
                }
            }
            return [
                'success'    => true,
                'message_id' => 'AT_UNKNOWN',
            ];
        }

        $errorMsg = $json['errorMessage'] ?? $json['message'] ?? $result ?: "HTTP {$httpCode} from SMS Gateway";
        return [
            'success' => false,
            'error'   => "SMS Gateway HTTP {$httpCode}: {$errorMsg}"
        ];
    }

    /**
     * Send receipt SMS confirmation after successful fee payment
     */
    public function sendReceiptSMS(string $schoolId, string $studentId, string $receiptNo, float $amount, string $refCode): array
    {
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
            return ['success' => false, 'error_message' => 'No guardian phone number linked to student'];
        }

        $ledgerService = new LedgerService();
        $balanceInfo = $ledgerService->getStudentBalance($schoolId, $studentId);
        $curr = $data['currency'] ?: 'KES';
        $fmtAmount = number_format($amount, 2);
        $fmtBalance = number_format($balanceInfo['current_balance'], 2);

        $body = "Dear Guardian, payment of {$curr} {$fmtAmount} for {$data['first_name']} {$data['last_name']} (Adm: {$data['admission_number']}) received. Receipt: {$receiptNo}, Ref: {$refCode}. Current Balance: {$curr} {$fmtBalance}. {$data['school_name']}.";

        return $this->dispatch($schoolId, $data['guardian_phone'], $studentId, 'RECEIPT', $body);
    }

    /**
     * Send bulk fee balance reminder with merge fields
     */
    public function sendFeeReminder(string $schoolId, string $studentId, ?string $customTemplate = null): array
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
            return ['success' => false, 'error_message' => 'No guardian phone number found'];
        }

        $ledgerService = new LedgerService();
        $balanceInfo = $ledgerService->getStudentBalance($schoolId, $studentId);
        $curr = $data['currency'] ?: 'KES';
        $fmtBalance = number_format($balanceInfo['current_balance'], 2);

        if ($balanceInfo['current_balance'] <= 0) {
            return ['success' => false, 'error_message' => 'Student has no outstanding fee balance'];
        }

        $body = "Dear {$data['guardian_name']}, fee balance for {$data['first_name']} {$data['last_name']} (Adm: {$data['admission_number']}) is {$curr} {$fmtBalance}. Please pay via M-Pesa Paybill {$data['mpesa_paybill']}, Acc No: {$data['admission_number']}. Thank you. - {$data['school_name']}";

        return $this->dispatch($schoolId, $data['guardian_phone'], $studentId, 'FEE_REMINDER', $body);
    }

    /**
     * Helper to write log entry in database
     */
    private function logSMS(string $schoolId, string $phone, ?string $studentId, string $type, string $body, string $status, ?string $msgId, ?string $error): string
    {
        try {
            $id = $this->generateUUID();
            $stmt = $this->db->prepare("
                INSERT INTO sms_logs (
                    id, school_id, recipient_phone, student_id, message_type, message_body, status, provider_message_id, error_message, created_at
                ) VALUES (
                    :id, :school_id, :phone, :student_id, :type, :body, :status, :msg_id, :error_msg, CURRENT_TIMESTAMP
                )
            ");
            $stmt->execute([
                ':id'        => $id,
                ':school_id' => $schoolId,
                ':phone'     => $phone,
                ':student_id'=> $studentId,
                ':type'      => $type,
                ':body'      => $body,
                ':status'    => $status,
                ':msg_id'    => $msgId,
                ':error_msg' => $error
            ]);
            return $id;
        } catch (\Exception $e) {
            error_log("Failed to log SMS: " . $e->getMessage());
            return '';
        }
    }

    private function generateUUID(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}

