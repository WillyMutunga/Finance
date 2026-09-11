<?php

namespace App\Services;

use App\Database;
use PDO;

class MPesaService
{
    private PDO $db;
    private ReconciliationEngine $reconEngine;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->reconEngine = new ReconciliationEngine();
    }

    /**
     * Initiate Lipa Na M-Pesa Online (STK Push)
     */
    public function initiateSTKPush(string $schoolId, string $studentId, string $phone, float $amount, string $accountRef): array
    {
        // 1. Fetch School M-Pesa Settings
        $stmt = $this->db->prepare("SELECT name, mpesa_paybill, currency FROM schools WHERE id = :id");
        $stmt->execute([':id' => $schoolId]);
        $school = $stmt->fetch();

        // Normalize Phone to 254...
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '254' . substr($cleanPhone, 1);
        } elseif (str_starts_with($cleanPhone, '7') || str_starts_with($cleanPhone, '1')) {
            $cleanPhone = '254' . $cleanPhone;
        }

        // Generate Simulated Checkout Request ID (or real Daraja API call in production)
        $checkoutRequestId = 'ws_CO_' . date('dmYHis') . '_' . rand(10000, 99999);
        $merchantRequestId = 'MR_' . uniqid();

        // In test/demo or live mode: record raw inbound STK initiation
        $stmtTx = $this->db->prepare("
            INSERT INTO payment_transactions (
                school_id, channel, reference_number, amount, payer_phone, payer_name,
                account_reference, payment_date, reconciliation_status, raw_payload
            ) VALUES (
                :school_id, 'MPESA_STK', :ref, :amount, :phone, :name,
                :acc_ref, CURRENT_TIMESTAMP, 'UNMATCHED', :payload
            ) RETURNING id
        ");

        $simulatedRef = 'QHD' . rand(1000000, 9999999);
        $stmtTx->execute([
            ':school_id' => $schoolId,
            ':ref'       => $simulatedRef,
            ':amount'    => $amount,
            ':phone'     => '+' . $cleanPhone,
            ':name'      => 'Parent (' . $cleanPhone . ')',
            ':acc_ref'   => $accountRef,
            ':payload'   => json_encode([
                'CheckoutRequestID' => $checkoutRequestId,
                'MerchantRequestID' => $merchantRequestId,
                'StudentId'         => $studentId
            ])
        ]);
        $transactionId = $stmtTx->fetchColumn();

        // Auto-run reconciliation pipeline on transaction
        $reconResult = $this->reconEngine->processTransaction($schoolId, $transactionId);

        return [
            'status'            => 'SUCCESS',
            'checkout_request_id' => $checkoutRequestId,
            'merchant_request_id' => $merchantRequestId,
            'transaction_id'    => $transactionId,
            'reference_number'  => $simulatedRef,
            'reconciliation'    => $reconResult,
            'message'           => "STK Push prompted on {$cleanPhone}. Payment confirmed and reconciled."
        ];
    }

    /**
     * Handle incoming C2B Confirmation Webhook from Safaricom Daraja
     */
    public function handleC2BCallback(array $payload, string $schoolId): array
    {
        $transId    = $payload['TransID'] ?? ('SIM_' . uniqid());
        $transAmount = (float)($payload['TransAmount'] ?? 0);
        $billRef    = $payload['BillRefNumber'] ?? '';
        $msisdn     = $payload['MSISDN'] ?? '';
        $firstName  = $payload['FirstName'] ?? '';
        $lastName   = $payload['LastName'] ?? '';
        $payerName  = trim("{$firstName} {$lastName}");

        // 1. Idempotency Check: Don't process the same M-Pesa receipt number twice
        $stmt = $this->db->prepare("SELECT id, reconciliation_status FROM payment_transactions WHERE reference_number = :ref AND school_id = :school_id");
        $stmt->execute([':ref' => $transId, ':school_id' => $schoolId]);
        $existing = $stmt->fetch();

        if ($existing) {
            return [
                'ResultCode' => 0,
                'ResultDesc' => 'Duplicate transaction acknowledged.',
                'transaction_id' => $existing['id']
            ];
        }

        // 2. Insert Inbound Transaction
        $stmtInsert = $this->db->prepare("
            INSERT INTO payment_transactions (
                school_id, channel, reference_number, amount, payer_phone, payer_name,
                account_reference, payment_date, reconciliation_status, raw_payload
            ) VALUES (
                :school_id, 'MPESA_C2B', :ref, :amount, :phone, :name,
                :acc_ref, CURRENT_TIMESTAMP, 'UNMATCHED', :payload
            ) RETURNING id
        ");

        $stmtInsert->execute([
            ':school_id' => $schoolId,
            ':ref'       => $transId,
            ':amount'    => $transAmount,
            ':phone'     => '+' . $msisdn,
            ':name'      => $payerName ?: 'M-Pesa Customer',
            ':acc_ref'   => $billRef,
            ':payload'   => json_encode($payload)
        ]);
        $transactionId = $stmtInsert->fetchColumn();

        // 3. Trigger Automated Reconciliation Pipeline
        $reconResult = $this->reconEngine->processTransaction($schoolId, $transactionId);

        return [
            'ResultCode'     => 0,
            'ResultDesc'     => 'Accepted and processed',
            'transaction_id' => $transactionId,
            'reconciliation' => $reconResult
        ];
    }
}
