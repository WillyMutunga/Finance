<?php

namespace App\Controllers;

use App\Services\IntegrationService;
use App\Database;

class IntegrationController
{
    private IntegrationService $service;

    public function __construct()
    {
        $this->service = new IntegrationService();
    }

    public function overview(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getOverview($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function bankAccounts(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getBankAccounts($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createBankAccount(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $data = $this->service->createBankAccount($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateBankAccount(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $data = $this->service->updateBankAccount($schoolId, $id, $input);
            echo json_encode(['status' => 'success', 'data' => $data]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteBankAccount(string $id): void
    {
        $schoolId = Database::getTenantId();

        try {
            $this->service->deleteBankAccount($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Bank integration removed.']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function transactions(): void
    {
        $schoolId = Database::getTenantId();
        $channel = $_GET['channel'] ?? null;
        $status = $_GET['status'] ?? null;
        $search = $_GET['q'] ?? null;

        $data = $this->service->getTransactions($schoolId, $channel, $status, $search);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function attempts(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getAttempts($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function triggerSTKPush(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $result = $this->service->triggerSTKPush($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $result]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function simulatePayment(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $result = $this->service->simulatePayment($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $result]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function settings(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getSettings($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function updateSettings(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $data = $this->service->updateSettings($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}