<?php

namespace App\Controllers;

use App\Database;
use App\Services\MPesaService;

class WebhookController
{
    private MPesaService $mpesaService;

    public function __construct()
    {
        $this->mpesaService = new MPesaService();
    }

    /**
     * M-Pesa C2B Confirmation URL Webhook
     */
    public function mpesaC2BConfirmation(): void
    {
        $schoolId = $_GET['school_id'] ?? Database::getTenantId();
        $payload = json_decode(file_get_contents('php://input'), true) ?? [];

        $response = $this->mpesaService->handleC2BCallback($payload, $schoolId);
        header('Content-Type: application/json');
        echo json_encode($response);
    }

    /**
     * M-Pesa C2B Validation URL Webhook
     */
    public function mpesaC2BValidation(): void
    {
        header('Content-Type: application/json');
        echo json_encode([
            'ResultCode' => 0,
            'ResultDesc' => 'Accepted'
        ]);
    }

    /**
     * M-Pesa STK Push Callback Webhook
     */
    public function mpesaSTKCallback(): void
    {
        $schoolId = $_GET['school_id'] ?? Database::getTenantId();
        $payload = json_decode(file_get_contents('php://input'), true) ?? [];

        header('Content-Type: application/json');
        echo json_encode([
            'ResultCode' => 0,
            'ResultDesc' => 'STK Callback Received'
        ]);
    }

    /**
     * Interactive Simulator for M-Pesa C2B Paybill Transactions
     */
    public function simulateC2B(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $accountRef = trim($input['account_reference'] ?? $input['admission_number'] ?? '');
        $amount     = (float)($input['amount'] ?? 0);
        $phone      = trim($input['phone'] ?? '+254700000000');
        $payerName  = trim($input['payer_name'] ?? 'M-Pesa Test Payer');
        $transId    = trim($input['trans_id'] ?? ('QHD' . rand(1000000, 9999999)));

        if (empty($accountRef) || $amount <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Account reference (Admission Number) and Amount are required.']);
            return;
        }

        $names = explode(' ', $payerName);
        $firstName = $names[0] ?? 'Mpesa';
        $lastName = $names[1] ?? 'Payer';

        $payload = [
            'TransactionType'   => 'Pay Bill',
            'TransID'           => $transId,
            'TransTime'         => date('YmdHis'),
            'TransAmount'       => (string)$amount,
            'BusinessShortCode' => '247247',
            'BillRefNumber'     => $accountRef,
            'InvoiceNumber'     => '',
            'OrgAccountBalance' => '',
            'ThirdPartyTransID' => '',
            'MSISDN'            => $phone,
            'FirstName'         => $firstName,
            'LastName'          => $lastName
        ];

        $response = $this->mpesaService->handleC2BCallback($payload, $schoolId);
        echo json_encode($response);
    }
}
