<?php

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class IntegrationService
{
    private PDO $db;
    private ReconciliationEngine $reconEngine;
    private MPesaService $mpesaService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->reconEngine = new ReconciliationEngine();
        $this->mpesaService = new MPesaService();
    }

    /**
     * Get High-Level Integrations Telemetry & Overview
     */
    public function getOverview(string $schoolId): array
    {
        $stmtTot = $this->db->prepare("
            SELECT COUNT(*) as total_txs,
                   COALESCE(SUM(amount), 0) as total_amount,
                   COUNT(CASE WHEN reconciliation_status IN ('AUTO_MATCHED', 'MANUALLY_MATCHED') THEN 1 END) as matched_txs,
                   COUNT(CASE WHEN reconciliation_status IN ('UNMATCHED', 'AMBIGUOUS') THEN 1 END) as pending_exceptions
            FROM payment_transactions 
            WHERE school_id = :school_id
        ");
        $stmtTot->execute([':school_id' => $schoolId]);
        $stats = $stmtTot->fetch(PDO::FETCH_ASSOC);

        $totCount = (int)$stats['total_txs'];
        $matchCount = (int)$stats['matched_txs'];
        $matchRate = $totCount > 0 ? round(($matchCount / $totCount) * 100, 1) : 100.0;

        $stmtBanks = $this->db->prepare("SELECT COUNT(*) FROM bank_integrations WHERE school_id = :school_id AND status = 'CONNECTED'");
        $stmtBanks->execute([':school_id' => $schoolId]);
        $activeGateways = (int)$stmtBanks->fetchColumn();

        return [
            'total_transactions_count' => $totCount,
            'total_volume_amount' => (float)$stats['total_amount'],
            'matched_transactions_count' => $matchCount,
            'pending_exceptions_count' => (int)$stats['pending_exceptions'],
            'auto_reconciliation_rate' => $matchRate,
            'active_gateways_count' => $activeGateways
        ];
    }

    /**
     * Get Connected Bank Accounts & Gateways
     */
    public function getBankAccounts(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM bank_integrations 
            WHERE school_id = :school_id 
            ORDER BY created_at ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createBankAccount(string $schoolId, array $data): array
    {
        $bankName = trim($data['bank_name'] ?? '');
        $accName = trim($data['account_name'] ?? '');
        $accNo = trim($data['account_number'] ?? '');
        $paybill = trim($data['paybill'] ?? '');
        $branch = trim($data['branch'] ?? 'Main Branch');
        $pattern = trim($data['auto_match_pattern'] ?? 'ADM-NO');

        if (empty($bankName) || empty($accName) || empty($accNo)) {
            throw new Exception("Bank Name, Account Name, and Account Number are required.");
        }

        $stmt = $this->db->prepare("
            INSERT INTO bank_integrations (
                school_id, bank_name, account_name, account_number, paybill, branch, auto_match_pattern, status
            ) VALUES (
                :school_id, :bank_name, :acc_name, :acc_no, :paybill, :branch, :pattern, 'CONNECTED'
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':bank_name' => $bankName,
            ':acc_name' => $accName,
            ':acc_no' => $accNo,
            ':paybill' => $paybill ?: null,
            ':branch' => $branch ?: 'Main Branch',
            ':pattern' => $pattern
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateBankAccount(string $schoolId, string $id, array $data): array
    {
        $stmt = $this->db->prepare("
            UPDATE bank_integrations
            SET bank_name = COALESCE(:bank_name, bank_name),
                account_name = COALESCE(:acc_name, account_name),
                account_number = COALESCE(:acc_no, account_number),
                paybill = COALESCE(:paybill, paybill),
                branch = COALESCE(:branch, branch),
                auto_match_pattern = COALESCE(:pattern, auto_match_pattern),
                status = COALESCE(:status, status),
                last_synced_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([
            ':bank_name' => !empty($data['bank_name']) ? trim($data['bank_name']) : null,
            ':acc_name' => !empty($data['account_name']) ? trim($data['account_name']) : null,
            ':acc_no' => !empty($data['account_number']) ? trim($data['account_number']) : null,
            ':paybill' => isset($data['paybill']) ? trim($data['paybill']) : null,
            ':branch' => isset($data['branch']) ? trim($data['branch']) : null,
            ':pattern' => isset($data['auto_match_pattern']) ? trim($data['auto_match_pattern']) : null,
            ':status' => isset($data['status']) ? trim($data['status']) : null,
            ':id' => $id,
            ':school_id' => $schoolId
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new Exception("Bank integration not found.");
        return $row;
    }

    public function deleteBankAccount(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM bank_integrations WHERE id = :id AND school_id = :school_id");
        return $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
    }

    /**
     * Get Inbound Live IPN Transactions
     */
    public function getTransactions(string $schoolId, ?string $channel = null, ?string $status = null, ?string $search = null): array
    {
        $sql = "
            SELECT pt.*,
                   s.first_name, s.last_name, s.admission_number,
                   r.receipt_number as issued_receipt_number,
                   c.name as class_name
            FROM payment_transactions pt
            LEFT JOIN receipts r ON pt.id = r.payment_transaction_id
            LEFT JOIN students s ON r.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE pt.school_id = :school_id
        ";
        $params = [':school_id' => $schoolId];

        if ($channel && $channel !== 'ALL') {
            $sql .= " AND pt.channel = :channel";
            $params[':channel'] = $channel;
        }

        if ($status && $status !== 'ALL') {
            $sql .= " AND pt.reconciliation_status = :status";
            $params[':status'] = $status;
        }

        if ($search) {
            $sql .= " AND (pt.reference_number ILIKE :q OR pt.payer_name ILIKE :q OR pt.payer_phone ILIKE :q OR pt.account_reference ILIKE :q)";
            $params[':q'] = "%{$search}%";
        }

        $sql .= " ORDER BY pt.payment_date DESC LIMIT 200";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get STK Telemetry & Attempts Log
     */
    public function getAttempts(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT a.*, s.first_name, s.last_name, s.admission_number, c.name as class_name
            FROM stk_attempts a
            LEFT JOIN students s ON a.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE a.school_id = :school_id
            ORDER BY a.created_at DESC
            LIMIT 100
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Initiate Parent STK Push Prompt
     */
    public function triggerSTKPush(string $schoolId, array $data): array
    {
        $studentId = $data['student_id'] ?? '';
        $phone = trim($data['phone_number'] ?? '');
        $amount = (float)($data['amount'] ?? 0);
        $admNo = trim($data['account_reference'] ?? '');

        if (empty($phone) || $amount <= 0) {
            throw new Exception("Phone number and a valid amount are required.");
        }

        // If studentId provided, fetch admission number if missing
        if ($studentId && empty($admNo)) {
            $sStmt = $this->db->prepare("SELECT admission_number FROM students WHERE id = :id AND school_id = :school_id");
            $sStmt->execute([':id' => $studentId, ':school_id' => $schoolId]);
            $admNo = $sStmt->fetchColumn() ?: 'FEES';
        }

        $result = $this->mpesaService->initiateSTKPush($schoolId, $studentId ?: '00000000-0000-0000-0000-000000000000', $phone, $amount, $admNo);

        // Record into stk_attempts
        $stmtAtt = $this->db->prepare("
            INSERT INTO stk_attempts (
                school_id, student_id, phone_number, amount, account_reference,
                checkout_request_id, merchant_request_id, status, response_description
            ) VALUES (
                :school_id, :student_id, :phone, :amount, :ref,
                :checkout_id, :merchant_id, 'SUCCESS', 'STK Prompt successfully dispatched to parent device'
            )
        ");
        $stmtAtt->execute([
            ':school_id' => $schoolId,
            ':student_id' => $studentId ?: null,
            ':phone' => $phone,
            ':amount' => $amount,
            ':ref' => $admNo,
            ':checkout_id' => $result['checkout_request_id'] ?? null,
            ':merchant_id' => $result['merchant_request_id'] ?? null
        ]);

        return $result;
    }

    /**
     * Multi-Channel Inbound Payment Simulator
     */
    public function simulatePayment(string $schoolId, array $data): array
    {
        $channel = $data['channel'] ?? 'MPESA_C2B';
        $amount = (float)($data['amount'] ?? 0);
        $accountRef = trim($data['account_reference'] ?? '');
        $payerPhone = trim($data['payer_phone'] ?? '+254712345678');
        $payerName = trim($data['payer_name'] ?? 'Walk-in Parent');
        $refNo = trim($data['reference_number'] ?? '') ?: ('SIM' . strtoupper(substr(uniqid(), -7)));

        if ($amount <= 0) throw new Exception("Amount must be greater than zero.");
        if (empty($accountRef)) throw new Exception("Account / Admission Reference is required.");

        // Clean phone
        $cleanPhone = preg_replace('/[^0-9]/', '', $payerPhone);
        if (str_starts_with($cleanPhone, '0')) $cleanPhone = '254' . substr($cleanPhone, 1);
        elseif (!str_starts_with($cleanPhone, '254')) $cleanPhone = '254' . $cleanPhone;

        // Insert into payment_transactions
        $stmt = $this->db->prepare("
            INSERT INTO payment_transactions (
                school_id, channel, reference_number, amount, payer_phone, payer_name,
                account_reference, payment_date, reconciliation_status, raw_payload
            ) VALUES (
                :school_id, :channel, :ref, :amount, :phone, :name,
                :acc_ref, CURRENT_TIMESTAMP, 'UNMATCHED', :payload
            ) RETURNING id
        ");

        $stmt->execute([
            ':school_id' => $schoolId,
            ':channel' => $channel,
            ':ref' => $refNo,
            ':amount' => $amount,
            ':phone' => '+' . $cleanPhone,
            ':name' => $payerName,
            ':acc_ref' => $accountRef,
            ':payload' => json_encode([
                'Simulator' => true,
                'SimulatedChannel' => $channel,
                'Timestamp' => date('c'),
                'AccountRef' => $accountRef
            ])
        ]);

        $txId = $stmt->fetchColumn();

        // Process through automated reconciliation rules
        $reconResult = $this->reconEngine->processTransaction($schoolId, $txId);

        return [
            'status' => 'success',
            'transaction_id' => $txId,
            'reference_number' => $refNo,
            'reconciliation' => $reconResult,
            'message' => "Incoming {$channel} webhook received & processed through reconciliation pipeline."
        ];
    }

    /**
     * Get & Update Gateway Settings
     */
    public function getSettings(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT mpesa_paybill, sms_sender_id, currency,
                   CASE WHEN mpesa_consumer_key IS NOT NULL AND mpesa_consumer_key != '' THEN TRUE ELSE FALSE END as has_consumer_key,
                   CASE WHEN mpesa_passkey IS NOT NULL AND mpesa_passkey != '' THEN TRUE ELSE FALSE END as has_passkey
            FROM schools WHERE id = :id
        ");
        $stmt->execute([':id' => $schoolId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: [];
    }

    public function updateSettings(string $schoolId, array $data): array
    {
        $stmt = $this->db->prepare("
            UPDATE schools 
            SET mpesa_paybill = COALESCE(:paybill, mpesa_paybill),
                sms_sender_id = COALESCE(:sender_id, sms_sender_id),
                mpesa_consumer_key = COALESCE(:key, mpesa_consumer_key),
                mpesa_consumer_secret = COALESCE(:secret, mpesa_consumer_secret),
                mpesa_passkey = COALESCE(:passkey, mpesa_passkey),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");
        $stmt->execute([
            ':paybill' => !empty($data['mpesa_paybill']) ? trim($data['mpesa_paybill']) : null,
            ':sender_id' => !empty($data['sms_sender_id']) ? trim($data['sms_sender_id']) : null,
            ':key' => !empty($data['mpesa_consumer_key']) ? trim($data['mpesa_consumer_key']) : null,
            ':secret' => !empty($data['mpesa_consumer_secret']) ? trim($data['mpesa_consumer_secret']) : null,
            ':passkey' => !empty($data['mpesa_passkey']) ? trim($data['mpesa_passkey']) : null,
            ':id' => $schoolId
        ]);
        return $this->getSettings($schoolId);
    }
}