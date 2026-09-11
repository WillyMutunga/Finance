<?php

namespace App\Controllers;

use App\Database;
use App\Services\ExpenseService;
use PDO;

class ExpenseController
{
    private PDO $db;
    private ExpenseService $expenseService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->expenseService = new ExpenseService();
    }

    public function index(): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT ev.*, ec.name as category_name, ec.code as category_code,
                   u1.name as requested_by_name, u2.name as approved_by_name, u3.name as disbursed_by_name
            FROM expense_vouchers ev
            JOIN expense_categories ec ON ev.category_id = ec.id
            LEFT JOIN users u1 ON ev.requested_by_user_id = u1.id
            LEFT JOIN users u2 ON ev.approved_by_user_id = u2.id
            LEFT JOIN users u3 ON ev.disbursed_by_user_id = u3.id
            WHERE ev.school_id = :school_id
            ORDER BY ev.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
    }

    public function categories(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("SELECT * FROM expense_categories WHERE school_id = :school_id ORDER BY name ASC");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
    }

    public function create(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $categoryId    = trim($input['category_id'] ?? '');
        $payeeName     = trim($input['payee_name'] ?? '');
        $amount        = (float)($input['amount'] ?? 0);
        $paymentMethod = trim($input['payment_method'] ?? 'BANK_TRANSFER');
        $description   = trim($input['description'] ?? '');
        $requestedBy   = trim($input['requested_by_user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        if (empty($categoryId) || empty($payeeName) || $amount <= 0 || empty($description)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing required voucher details']);
            return;
        }

        try {
            $result = $this->expenseService->createVoucher(
                $schoolId,
                $categoryId,
                $payeeName,
                $amount,
                $paymentMethod,
                $description,
                $requestedBy,
                $input['lpo_number'] ?? null,
                $input['cheque_number'] ?? null,
                $input['bank_account'] ?? null,
                $input['supplier_id'] ?? null
            );
            echo json_encode(['status' => 'success', 'data' => $result]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function approve(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $approverId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000002'); // Headteacher

        try {
            $result = $this->expenseService->approveVoucher($schoolId, $id, $approverId);
            echo json_encode(['status' => 'success', 'data' => $result]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function disburse(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $disburserId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001'); // Bursar

        try {
            $result = $this->expenseService->disburseVoucher($schoolId, $id, $disburserId);
            echo json_encode(['status' => 'success', 'data' => $result]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function cancel(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');
        $reason = trim($input['reason'] ?? 'Voucher cancelled by user');

        try {
            $result = $this->expenseService->cancelVoucher($schoolId, $id, $userId, $reason);
            echo json_encode(['status' => 'success', 'data' => $result]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // LPOs
    public function lpos(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->expenseService->getLpos($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createLpo(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        try {
            $data = $this->expenseService->createLpo($schoolId, $input, $userId);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'LPO created successfully']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateLpoStatus(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = trim($input['status'] ?? 'DELIVERED');

        try {
            $data = $this->expenseService->updateLpoStatus($schoolId, $id, $status);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'LPO status updated']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // Bills
    public function bills(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->expenseService->getBills($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createBill(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $data = $this->expenseService->createBill($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Supplier bill recorded successfully']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function payBill(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $payAmount = (float)($input['amount'] ?? 0);
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        try {
            $data = $this->expenseService->payBill($schoolId, $id, $payAmount, $userId);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Bill payment recorded']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // Suppliers
    public function suppliers(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->expenseService->getSuppliers($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createSupplier(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $data = $this->expenseService->createSupplier($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Supplier added successfully']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateSupplier(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $data = $this->expenseService->updateSupplier($schoolId, $id, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Supplier updated successfully']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteSupplier(string $id): void
    {
        $schoolId = Database::getTenantId();
        try {
            $this->expenseService->deleteSupplier($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Supplier removed']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // Supplier Take Ons
    public function supplierTakeOns(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->expenseService->getSupplierTakeOns($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createSupplierTakeOn(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $data = $this->expenseService->createSupplierTakeOn($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Opening balance recorded']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // Fee Refunds
    public function feeRefunds(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->expenseService->getFeeRefunds($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createFeeRefund(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        try {
            $data = $this->expenseService->createFeeRefund($schoolId, $input, $userId);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Fee refund request submitted']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function approveFeeRefund(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000002');

        try {
            $data = $this->expenseService->approveFeeRefund($schoolId, $id, $userId);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Fee refund approved']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function disburseFeeRefund(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        try {
            $data = $this->expenseService->disburseFeeRefund($schoolId, $id, $userId);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Fee refund disbursed and ledger updated']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // Petty Cash
    public function pettyCash(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->expenseService->getPettyCash($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function recordPettyCash(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        try {
            $data = $this->expenseService->recordPettyCash($schoolId, $input, $userId);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Petty cash transaction recorded']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}