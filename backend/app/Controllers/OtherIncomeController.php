<?php

namespace App\Controllers;

use App\Services\OtherIncomeService;
use App\Database;

class OtherIncomeController
{
    private OtherIncomeService $service;

    public function __construct()
    {
        $this->service = new OtherIncomeService();
    }

    // 1. Categories
    public function categories(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getCategories($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createCategory(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $cat = $this->service->createCategory($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $cat]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // 2. Customers
    public function customers(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getCustomers($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createCustomer(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $customer = $this->service->createCustomer($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $customer]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateCustomer(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $customer = $this->service->updateCustomer($schoolId, $id, $input);
            echo json_encode(['status' => 'success', 'data' => $customer]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteCustomer(string $id): void
    {
        $schoolId = Database::getTenantId();

        try {
            $this->service->deleteCustomer($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Customer deleted successfully.']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // 3. Invoices
    public function invoices(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getInvoices($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createInvoice(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $inv = $this->service->createInvoice($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $inv]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function payInvoice(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        try {
            $receipt = $this->service->payInvoice($schoolId, $id, $input, $userId);
            echo json_encode(['status' => 'success', 'data' => $receipt]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // 4. Receipts
    public function receipts(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getReceipts($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createReceipt(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        try {
            $receipt = $this->service->createReceipt($schoolId, $input, $userId);
            echo json_encode(['status' => 'success', 'data' => $receipt]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // 5. Take-Ons
    public function takeOns(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getTakeOns($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createTakeOn(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $takeOn = $this->service->createTakeOn($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $takeOn]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // 6. Donors & Donations
    public function donors(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getDonors($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createDonor(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $donor = $this->service->createDonor($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $donor]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function donations(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getDonations($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createDonation(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        try {
            $don = $this->service->createDonation($schoolId, $input, $userId);
            echo json_encode(['status' => 'success', 'data' => $don]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}