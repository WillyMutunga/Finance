<?php

namespace App\Controllers;

use App\Database;
use App\Services\AccountingService;
use Exception;

class AccountingController
{
    private AccountingService $accountingService;

    public function __construct()
    {
        $this->accountingService = new AccountingService();
    }

    // ==========================================
    // 1. ACCOUNT TYPES
    // ==========================================
    public function getAccountTypes(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $types = $this->accountingService->getAccountTypes($schoolId);
            echo json_encode(['status' => 'success', 'data' => $types]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createAccountType(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $type = $this->accountingService->createAccountType($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $type, 'message' => 'Account Type created successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateAccountType(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $type = $this->accountingService->updateAccountType($schoolId, $id, $input);
            echo json_encode(['status' => 'success', 'data' => $type, 'message' => 'Account Type updated successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteAccountType(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $this->accountingService->deleteAccountType($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Account Type deleted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 2. VOTE HEADS REGISTER
    // ==========================================
    public function getVoteHeads(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $voteHeads = $this->accountingService->getVoteHeads($schoolId);
            echo json_encode(['status' => 'success', 'data' => $voteHeads]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createVoteHead(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $created = $this->accountingService->createVoteHead($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $created, 'message' => 'Vote Head created successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateVoteHead(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $updated = $this->accountingService->updateVoteHead($schoolId, $id, $input);
            echo json_encode(['status' => 'success', 'data' => $updated, 'message' => 'Vote Head updated successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteVoteHead(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $this->accountingService->deleteVoteHead($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Vote Head deleted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 3. BANK & CASH ACCOUNTS
    // ==========================================
    public function getAccounts(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $accounts = $this->accountingService->getAccounts($schoolId);
            echo json_encode(['status' => 'success', 'data' => $accounts]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createAccount(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $acc = $this->accountingService->createAccount($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $acc, 'message' => 'Account created successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateAccount(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $acc = $this->accountingService->updateAccount($schoolId, $id, $input);
            echo json_encode(['status' => 'success', 'data' => $acc, 'message' => 'Account updated successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteAccount(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $this->accountingService->deleteAccount($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Account deleted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 4. TAKE-ON BALANCES
    // ==========================================
    public function getTakeOns(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $takeOns = $this->accountingService->getTakeOns($schoolId);
            echo json_encode(['status' => 'success', 'data' => $takeOns]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createTakeOn(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $takeOn = $this->accountingService->createTakeOn($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $takeOn, 'message' => 'Opening balance recorded successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteTakeOn(string $id): void
    {
        try {
            $schoolId = Database::getTenantId();
            $this->accountingService->deleteTakeOn($schoolId, $id);
            echo json_encode(['status' => 'success', 'message' => 'Opening balance deleted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 5. INTER-ACCOUNT TRANSFERS
    // ==========================================
    public function getTransfers(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $transfers = $this->accountingService->getTransfers($schoolId);
            echo json_encode(['status' => 'success', 'data' => $transfers]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createTransfer(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $transfer = $this->accountingService->createTransfer($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $transfer, 'message' => 'Transfer completed successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 6. VOTE HEAD BUDGETS
    // ==========================================
    public function getBudgets(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $year = $_GET['year'] ?? '2026';
            $budgets = $this->accountingService->getBudgets($schoolId, $year);
            echo json_encode(['status' => 'success', 'data' => $budgets]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function setBudget(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $budget = $this->accountingService->setBudget($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $budget, 'message' => 'Budget estimate saved successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 7. GENERAL JOURNAL
    // ==========================================
    public function getJournalEntries(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $entries = $this->accountingService->getJournalEntries($schoolId);
            echo json_encode(['status' => 'success', 'data' => $entries]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function createJournalEntry(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $entry = $this->accountingService->createJournalEntry($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $entry, 'message' => 'Journal entry posted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    // ==========================================
    // 8. GENERAL LEDGER
    // ==========================================
    public function getGeneralLedger(): void
    {
        try {
            $schoolId = Database::getTenantId();
            $start = $_GET['start_date'] ?? null;
            $end = $_GET['end_date'] ?? null;
            $entries = $this->accountingService->getGeneralLedger($schoolId, $start, $end);
            echo json_encode(['status' => 'success', 'data' => $entries]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}