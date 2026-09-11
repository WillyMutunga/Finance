<?php

namespace App\Controllers;

use App\Database;
use App\Services\StaffPayrollService;
use Exception;

class StaffPayrollController
{
    private StaffPayrollService $service;

    public function __construct()
    {
        $this->service = new StaffPayrollService();
    }

    // ==========================================
    // 1. STATUTORY CONFIGS & RATES
    // ==========================================
    public function getStatutoryRates(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $rates = $this->service->getStatutoryRates($schoolId);
            echo json_encode(['status' => 'success', 'data' => $rates]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateStatutoryRates(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $rates = $this->service->updateStatutoryRates($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $rates, 'message' => 'Statutory rates updated successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 2. DEPARTMENTS
    // ==========================================
    public function getDepartments(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $depts = $this->service->getDepartments($schoolId);
            echo json_encode(['status' => 'success', 'data' => $depts]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createDepartment(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $dept = $this->service->createDepartment($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $dept, 'message' => 'Department created successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteDepartment(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $this->service->deleteDepartment($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Department deleted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 3. ALLOWANCES & DEDUCTIONS
    // ==========================================
    public function getAllowances(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $alws = $this->service->getAllowances($schoolId);
            echo json_encode(['status' => 'success', 'data' => $alws]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createAllowance(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $alw = $this->service->createAllowance($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $alw, 'message' => 'Allowance created successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteAllowance(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $this->service->deleteAllowance($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Allowance deleted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function getDeductions(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $deds = $this->service->getDeductionTypes($schoolId);
            echo json_encode(['status' => 'success', 'data' => $deds]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createDeduction(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $ded = $this->service->createDeductionType($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $ded, 'message' => 'Deduction created successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteDeduction(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $this->service->deleteDeductionType($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Deduction deleted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 4. STAFF MANAGEMENT
    // ==========================================
    public function getStaff(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $dept = $_GET['department'] ?? null;
            $search = $_GET['q'] ?? null;
            $staff = $this->service->getStaffMembers($schoolId, $dept, $search);
            echo json_encode(['status' => 'success', 'data' => $staff]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createStaff(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $staff = $this->service->createStaffMember($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $staff, 'message' => 'Staff member registered successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateStaff(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $staff = $this->service->updateStaffMember($schoolId, $id, $input);
            echo json_encode(['status' => 'success', 'data' => $staff, 'message' => 'Staff member updated successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteStaff(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $this->service->deleteStaffMember($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Staff member deleted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 5. PAYROLL PERIOD & PROCESSING
    // ==========================================
    public function getPayrollPeriod(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $month = $_GET['month'] ?? 'July 2026';
            $period = $this->service->getPayrollPeriodSummary($schoolId, $month);
            echo json_encode(['status' => 'success', 'data' => $period]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function processPayroll(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $month = trim($input['month'] ?? 'July 2026');
            $period = $this->service->processMonthlyPayroll($schoolId, $month);
            echo json_encode(['status' => 'success', 'data' => $period, 'message' => "Payroll for {$month} processed and locked successfully"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function getPayslip(string $staffId): void
    {
        try {
            $schoolId = Database::getTenantId();
            $month = $_GET['month'] ?? 'July 2026';
            $payslip = $this->service->getStaffPayslip($schoolId, $staffId, $month);
            echo json_encode(['status' => 'success', 'data' => $payslip]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}