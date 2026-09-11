<?php

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class AccountingService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // ==========================================
    // 1. ACCOUNT TYPES
    // ==========================================
    public function getAccountTypes(string $schoolId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM account_types WHERE school_id = :school_id ORDER BY is_default DESC, name ASC");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createAccountType(string $schoolId, array $data): array
    {
        $name = strtoupper(trim($data['name'] ?? ''));
        $code = trim($data['code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 6)));
        $isDefault = !empty($data['is_default']);
        $description = trim($data['description'] ?? '');

        if (empty($name)) {
            throw new Exception('Account type name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO account_types (school_id, name, code, is_default, description)
            VALUES (:school_id, :name, :code, :is_default, :description)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'   => $schoolId,
            ':name'        => $name,
            ':code'        => $code,
            ':is_default'  => $isDefault ? 'true' : 'false',
            ':description' => $description
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateAccountType(string $schoolId, string $id, array $data): array
    {
        $name = strtoupper(trim($data['name'] ?? ''));
        $code = trim($data['code'] ?? '');
        $description = trim($data['description'] ?? '');

        if (empty($name)) {
            throw new Exception('Account type name is required.');
        }

        $stmt = $this->db->prepare("
            UPDATE account_types
            SET name = :name, code = :code, description = :description, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([
            ':id'          => $id,
            ':school_id'   => $schoolId,
            ':name'        => $name,
            ':code'        => $code,
            ':description' => $description
        ]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$res) {
            throw new Exception('Account type not found.');
        }
        return $res;
    }

    public function deleteAccountType(string $schoolId, string $id): bool
    {
        // Check if in use by vote heads
        $stmtCheck = $this->db->prepare("SELECT COUNT(*) FROM vote_heads WHERE account_type_id = :id AND school_id = :school_id");
        $stmtCheck->execute([':id' => $id, ':school_id' => $schoolId]);
        if ($stmtCheck->fetchColumn() > 0) {
            throw new Exception('Cannot delete account type because it is linked to active vote heads.');
        }

        $stmt = $this->db->prepare("DELETE FROM account_types WHERE id = :id AND school_id = :school_id AND is_default = false");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 2. VOTE HEADS REGISTER
    // ==========================================
    public function getVoteHeads(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT vh.*, at.name as account_type_name
            FROM vote_heads vh
            LEFT JOIN account_types at ON vh.account_type_id = at.id
            WHERE vh.school_id = :school_id
            ORDER BY vh.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createVoteHead(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $code = trim($data['account_code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 8)));
        $isOptional = !empty($data['is_optional']);
        $desc = trim($data['description'] ?? '');
        $accountTypeId = !empty($data['account_type_id']) ? $data['account_type_id'] : null;

        if (empty($name)) {
            throw new Exception('Vote Head name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO vote_heads (school_id, name, account_code, is_optional, description, account_type_id)
            VALUES (:school_id, :name, :code, :is_optional, :desc, :account_type_id)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'       => $schoolId,
            ':name'            => $name,
            ':code'            => $code,
            ':is_optional'     => $isOptional ? 'true' : 'false',
            ':desc'            => $desc,
            ':account_type_id' => $accountTypeId
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateVoteHead(string $schoolId, string $id, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $code = trim($data['account_code'] ?? '');
        $isOptional = !empty($data['is_optional']);
        $desc = trim($data['description'] ?? '');
        $accountTypeId = !empty($data['account_type_id']) ? $data['account_type_id'] : null;

        if (empty($name)) {
            throw new Exception('Vote Head name is required.');
        }

        $stmt = $this->db->prepare("
            UPDATE vote_heads
            SET name = :name, account_code = :code, is_optional = :is_optional, description = :desc, account_type_id = :account_type_id
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([
            ':id'              => $id,
            ':school_id'       => $schoolId,
            ':name'            => $name,
            ':code'            => $code,
            ':is_optional'     => $isOptional ? 'true' : 'false',
            ':desc'            => $desc,
            ':account_type_id' => $accountTypeId
        ]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$res) {
            throw new Exception('Vote head not found.');
        }
        return $res;
    }

    public function deleteVoteHead(string $schoolId, string $id): bool
    {
        // Check if in use in fee structures or budgets
        $stmtCheck = $this->db->prepare("SELECT COUNT(*) FROM fee_structure_items WHERE vote_head_id = :id");
        $stmtCheck->execute([':id' => $id]);
        if ($stmtCheck->fetchColumn() > 0) {
            throw new Exception('Cannot delete vote head because it is used in active fee structures.');
        }

        $stmt = $this->db->prepare("DELETE FROM vote_heads WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 3. BANK & CASH ACCOUNTS
    // ==========================================
    public function getAccounts(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT a.*, at.name as account_type_name
            FROM accounts a
            LEFT JOIN account_types at ON a.account_type_id = at.id
            WHERE a.school_id = :school_id
            ORDER BY a.is_cash_account ASC, a.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createAccount(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $accountNumber = trim($data['account_number'] ?? '');
        $bankName = trim($data['bank_name'] ?? 'Commercial Bank');
        $branch = trim($data['branch'] ?? 'Main Branch');
        $accountType = trim($data['account_type'] ?? 'OPERATIONS');
        $accountTypeId = !empty($data['account_type_id']) ? $data['account_type_id'] : null;
        $currency = trim($data['currency'] ?? 'KES');
        $openingBalance = floatval($data['opening_balance'] ?? 0);
        $isCash = !empty($data['is_cash_account']);
        $status = trim($data['status'] ?? 'ACTIVE');

        if (empty($name) || empty($accountNumber)) {
            throw new Exception('Account name and account number are required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO accounts (school_id, name, account_number, bank_name, branch, account_type, account_type_id, currency, opening_balance, current_balance, is_cash_account, status)
            VALUES (:school_id, :name, :account_number, :bank_name, :branch, :account_type, :account_type_id, :currency, :opening_balance, :current_balance, :is_cash, :status)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'        => $schoolId,
            ':name'             => $name,
            ':account_number'   => $accountNumber,
            ':bank_name'        => $bankName,
            ':branch'           => $branch,
            ':account_type'     => $accountType,
            ':account_type_id'  => $accountTypeId,
            ':currency'         => $currency,
            ':opening_balance'  => $openingBalance,
            ':current_balance'  => $openingBalance,
            ':is_cash'          => $isCash ? 'true' : 'false',
            ':status'           => $status
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateAccount(string $schoolId, string $id, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $accountNumber = trim($data['account_number'] ?? '');
        $bankName = trim($data['bank_name'] ?? '');
        $branch = trim($data['branch'] ?? '');
        $accountType = trim($data['account_type'] ?? '');
        $status = trim($data['status'] ?? 'ACTIVE');

        if (empty($name) || empty($accountNumber)) {
            throw new Exception('Account name and account number are required.');
        }

        $stmt = $this->db->prepare("
            UPDATE accounts
            SET name = :name, account_number = :account_number, bank_name = :bank_name, branch = :branch, account_type = :account_type, status = :status, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([
            ':id'             => $id,
            ':school_id'      => $schoolId,
            ':name'           => $name,
            ':account_number' => $accountNumber,
            ':bank_name'      => $bankName,
            ':branch'         => $branch,
            ':account_type'   => $accountType,
            ':status'         => $status
        ]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$res) {
            throw new Exception('Account not found.');
        }
        return $res;
    }

    public function deleteAccount(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM accounts WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 4. TAKE-ON BALANCES (OPENING BALANCES)
    // ==========================================
    public function getTakeOns(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT ato.*, a.account_number, a.bank_name
            FROM account_take_ons ato
            LEFT JOIN accounts a ON ato.account_id = a.id
            WHERE ato.school_id = :school_id
            ORDER BY ato.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createTakeOn(string $schoolId, array $data): array
    {
        $accountName = trim($data['account_name'] ?? '');
        $accountId = !empty($data['account_id']) ? $data['account_id'] : null;
        $financialYear = trim($data['financial_year'] ?? '2026');
        $balanceType = strtoupper(trim($data['balance_type'] ?? 'DEBIT'));
        $amount = floatval($data['amount'] ?? 0);
        $asOfDate = !empty($data['as_of_date']) ? $data['as_of_date'] : date('Y-m-d');
        $notes = trim($data['notes'] ?? '');

        if (empty($accountName) || $amount <= 0) {
            throw new Exception('Valid account name and opening balance amount are required.');
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO account_take_ons (school_id, account_id, account_name, financial_year, balance_type, amount, as_of_date, notes)
                VALUES (:school_id, :account_id, :account_name, :financial_year, :balance_type, :amount, :as_of_date, :notes)
                RETURNING *
            ");
            $stmt->execute([
                ':school_id'      => $schoolId,
                ':account_id'     => $accountId,
                ':account_name'   => $accountName,
                ':financial_year' => $financialYear,
                ':balance_type'   => $balanceType,
                ':amount'         => $amount,
                ':as_of_date'     => $asOfDate,
                ':notes'          => $notes
            ]);
            $takeOn = $stmt->fetch(PDO::FETCH_ASSOC);

            // If account_id provided, update account's opening and current balance
            if ($accountId) {
                $adj = ($balanceType === 'DEBIT') ? $amount : -$amount;
                $upd = $this->db->prepare("
                    UPDATE accounts
                    SET opening_balance = opening_balance + :amt, current_balance = current_balance + :amt, updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id AND school_id = :school_id
                ");
                $upd->execute([':amt' => $adj, ':id' => $accountId, ':school_id' => $schoolId]);
            }

            $this->db->commit();
            return $takeOn;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function deleteTakeOn(string $schoolId, string $id): bool
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("SELECT * FROM account_take_ons WHERE id = :id AND school_id = :school_id");
            $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
            $takeOn = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$takeOn) {
                $this->db->rollBack();
                return false;
            }

            if (!empty($takeOn['account_id'])) {
                $adj = ($takeOn['balance_type'] === 'DEBIT') ? -floatval($takeOn['amount']) : floatval($takeOn['amount']);
                $upd = $this->db->prepare("
                    UPDATE accounts
                    SET opening_balance = opening_balance + :amt, current_balance = current_balance + :amt, updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id AND school_id = :school_id
                ");
                $upd->execute([':amt' => $adj, ':id' => $takeOn['account_id'], ':school_id' => $schoolId]);
            }

            $del = $this->db->prepare("DELETE FROM account_take_ons WHERE id = :id AND school_id = :school_id");
            $del->execute([':id' => $id, ':school_id' => $schoolId]);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ==========================================
    // 5. INTER-ACCOUNT TRANSFERS
    // ==========================================
    public function getTransfers(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT at.*, u.name as created_by_name
            FROM account_transfers at
            LEFT JOIN users u ON at.created_by_user_id = u.id
            WHERE at.school_id = :school_id
            ORDER BY at.transfer_date DESC, at.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createTransfer(string $schoolId, array $data, ?string $userId = null): array
    {
        $fromAccountId = !empty($data['from_account_id']) ? $data['from_account_id'] : null;
        $fromAccountName = trim($data['from_account_name'] ?? $data['from_account'] ?? '');
        $toAccountId = !empty($data['to_account_id']) ? $data['to_account_id'] : null;
        $toAccountName = trim($data['to_account_name'] ?? $data['to_account'] ?? '');
        $amount = floatval($data['amount'] ?? 0);
        $transferDate = !empty($data['transfer_date']) ? $data['transfer_date'] : (!empty($data['date']) ? $data['date'] : date('Y-m-d'));
        $ref = !empty($data['reference']) ? trim($data['reference']) : 'TRF-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
        $narration = trim($data['narration'] ?? 'Inter-Account Transfer');

        if (empty($fromAccountName) || empty($toAccountName) || $amount <= 0) {
            throw new Exception('Please select both source and destination accounts, and specify an amount greater than zero.');
        }

        if ($fromAccountName === $toAccountName || ($fromAccountId && $fromAccountId === $toAccountId)) {
            throw new Exception('Source and destination accounts must be different.');
        }

        $this->db->beginTransaction();
        try {
            // Insert transfer record
            $stmt = $this->db->prepare("
                INSERT INTO account_transfers (school_id, from_account_id, from_account_name, to_account_id, to_account_name, amount, transfer_date, reference_number, narration, created_by_user_id)
                VALUES (:school_id, :from_id, :from_name, :to_id, :to_name, :amount, :tdate, :ref, :narration, :user_id)
                RETURNING *
            ");
            $stmt->execute([
                ':school_id'  => $schoolId,
                ':from_id'    => $fromAccountId,
                ':from_name'  => $fromAccountName,
                ':to_id'      => $toAccountId,
                ':to_name'    => $toAccountName,
                ':amount'     => $amount,
                ':tdate'      => $transferDate,
                ':ref'        => $ref,
                ':narration'  => $narration,
                ':user_id'    => $userId
            ]);
            $transfer = $stmt->fetch(PDO::FETCH_ASSOC);

            // Deduct from source account balance if ID exists or match by name
            if ($fromAccountId) {
                $updFrom = $this->db->prepare("UPDATE accounts SET current_balance = current_balance - :amt WHERE id = :id AND school_id = :school_id");
                $updFrom->execute([':amt' => $amount, ':id' => $fromAccountId, ':school_id' => $schoolId]);
            } else {
                $updFrom = $this->db->prepare("UPDATE accounts SET current_balance = current_balance - :amt WHERE name = :name AND school_id = :school_id");
                $updFrom->execute([':amt' => $amount, ':name' => $fromAccountName, ':school_id' => $schoolId]);
            }

            // Credit to destination account balance
            if ($toAccountId) {
                $updTo = $this->db->prepare("UPDATE accounts SET current_balance = current_balance + :amt WHERE id = :id AND school_id = :school_id");
                $updTo->execute([':amt' => $amount, ':id' => $toAccountId, ':school_id' => $schoolId]);
            } else {
                $updTo = $this->db->prepare("UPDATE accounts SET current_balance = current_balance + :amt WHERE name = :name AND school_id = :school_id");
                $updTo->execute([':amt' => $amount, ':name' => $toAccountName, ':school_id' => $schoolId]);
            }

            // Log in transaction ledger for auditability
            $checksum = hash('sha256', $schoolId . $ref . $amount . microtime());
            $stmtLedger = $this->db->prepare("
                INSERT INTO transaction_ledger (school_id, entry_type, debit_amount, credit_amount, description, recorded_by_user_id, checksum)
                VALUES (:school_id, :type, :debit, :credit, :desc, :user_id, :checksum)
            ");
            $stmtLedger->execute([
                ':school_id' => $schoolId,
                ':type'      => 'TRANSFER',
                ':debit'     => $amount,
                ':credit'    => $amount,
                ':desc'      => "TRANSFER [{$ref}]: {$fromAccountName} -> {$toAccountName} ({$narration})",
                ':user_id'   => $userId,
                ':checksum'  => $checksum
            ]);

            $this->db->commit();
            return $transfer;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ==========================================
    // 6. VOTE HEAD BUDGETS & VARIANCE ANALYSIS
    // ==========================================
    public function getBudgets(string $schoolId, string $financialYear = '2026'): array
    {
        // 1. Get all vote heads
        $voteHeads = $this->getVoteHeads($schoolId);

        // 2. Get budgets for this year
        $stmtBudgets = $this->db->prepare("SELECT * FROM vote_head_budgets WHERE school_id = :school_id AND financial_year = :year");
        $stmtBudgets->execute([':school_id' => $schoolId, ':year' => $financialYear]);
        $budgetMap = [];
        foreach ($stmtBudgets->fetchAll(PDO::FETCH_ASSOC) as $b) {
            $budgetMap[$b['vote_head_id']] = $b;
        }

        // 3. Compute actual expenditure for each vote head from expense_vouchers
        $stmtExp = $this->db->prepare("
            SELECT ev.category_id, ec.name as category_name, SUM(ev.amount) as total_spent
            FROM expense_vouchers ev
            LEFT JOIN expense_categories ec ON ev.category_id = ec.id
            WHERE ev.school_id = :school_id AND ev.status = 'DISBURSED'
            GROUP BY ev.category_id, ec.name
        ");
        $stmtExp->execute([':school_id' => $schoolId]);
        $expMap = [];
        foreach ($stmtExp->fetchAll(PDO::FETCH_ASSOC) as $ex) {
            if ($ex['category_id']) {
                $expMap[strtolower(trim($ex['category_name'] ?? ''))] = floatval($ex['total_spent']);
            }
        }

        $results = [];
        $totalBudgeted = 0;
        $totalActual = 0;

        foreach ($voteHeads as $vh) {
            $vhId = $vh['id'];
            $vhName = $vh['name'];
            $budgetRow = $budgetMap[$vhId] ?? null;
            $budgetedAmt = $budgetRow ? floatval($budgetRow['budgeted_amount']) : 0.00;

            // Look for matching actual spent by name fuzzy or votehead
            $normName = strtolower(trim($vhName));
            $actualSpent = 0.00;
            foreach ($expMap as $catName => $spent) {
                if (strpos($catName, $normName) !== false || strpos($normName, $catName) !== false) {
                    $actualSpent += $spent;
                }
            }

            $remaining = $budgetedAmt - $actualSpent;
            $utilization = $budgetedAmt > 0 ? round(($actualSpent / $budgetedAmt) * 100, 1) : 0.0;

            $totalBudgeted += $budgetedAmt;
            $totalActual += $actualSpent;

            $results[] = [
                'vote_head_id'      => $vhId,
                'vote_head_name'    => $vhName,
                'account_code'      => $vh['account_code'],
                'account_type_name' => $vh['account_type_name'] ?? 'Operations',
                'financial_year'    => $financialYear,
                'budgeted_amount'   => $budgetedAmt,
                'actual_spent'      => $actualSpent,
                'remaining'         => $remaining,
                'utilization'       => $utilization,
                'notes'             => $budgetRow['notes'] ?? ''
            ];
        }

        return [
            'financial_year' => $financialYear,
            'summary' => [
                'total_budgeted' => $totalBudgeted,
                'total_spent'    => $totalActual,
                'total_remaining'=> $totalBudgeted - $totalActual,
                'overall_util'   => $totalBudgeted > 0 ? round(($totalActual / $totalBudgeted) * 100, 1) : 0.0
            ],
            'items' => $results
        ];
    }

    public function setBudget(string $schoolId, array $data): array
    {
        $voteHeadId = trim($data['vote_head_id'] ?? '');
        $financialYear = trim($data['financial_year'] ?? '2026');
        $budgetedAmount = floatval($data['budgeted_amount'] ?? 0);
        $notes = trim($data['notes'] ?? '');

        if (empty($voteHeadId)) {
            throw new Exception('Vote Head is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO vote_head_budgets (school_id, vote_head_id, financial_year, budgeted_amount, notes, updated_at)
            VALUES (:school_id, :vote_head_id, :year, :amount, :notes, CURRENT_TIMESTAMP)
            ON CONFLICT (school_id, vote_head_id, financial_year)
            DO UPDATE SET budgeted_amount = EXCLUDED.budgeted_amount, notes = EXCLUDED.notes, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'     => $schoolId,
            ':vote_head_id'  => $voteHeadId,
            ':year'          => $financialYear,
            ':amount'        => $budgetedAmount,
            ':notes'         => $notes
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ==========================================
    // 7. GENERAL JOURNAL
    // ==========================================
    public function getJournalEntries(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT je.*, u.name as recorded_by_name
            FROM journal_entries je
            LEFT JOIN users u ON je.created_by_user_id = u.id
            WHERE je.school_id = :school_id
            ORDER BY je.entry_date DESC, je.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch line items for each
        foreach ($entries as &$entry) {
            $itemStmt = $this->db->prepare("SELECT * FROM journal_entry_items WHERE journal_entry_id = :id ORDER BY debit_amount DESC");
            $itemStmt->execute([':id' => $entry['id']]);
            $entry['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return $entries;
    }

    public function createJournalEntry(string $schoolId, array $data, ?string $userId = null): array
    {
        $entryDate = !empty($data['entry_date']) ? $data['entry_date'] : (!empty($data['date']) ? $data['date'] : date('Y-m-d'));
        $reference = trim($data['reference'] ?? $data['reference_number'] ?? '');
        $narration = trim($data['narration'] ?? '');
        $entryNumber = 'JRN-' . date('Y') . '-' . str_pad((string)rand(1000, 9999), 4, '0', STR_PAD_LEFT);

        if (empty($narration)) {
            throw new Exception('Narration/Justification is required for journal entries.');
        }

        // Support simple format (debit_account, credit_account, amount) or multi-line items
        $items = [];
        if (!empty($data['items']) && is_array($data['items'])) {
            $items = $data['items'];
        } else {
            $debitAcc = trim($data['debit_account'] ?? $data['debit'] ?? '');
            $creditAcc = trim($data['credit_account'] ?? $data['credit'] ?? '');
            $amount = floatval($data['amount'] ?? 0);

            if (empty($debitAcc) || empty($creditAcc) || $amount <= 0) {
                throw new Exception('Please provide valid Debit Account, Credit Account, and Amount.');
            }

            $items = [
                ['account_name' => $debitAcc, 'debit_amount' => $amount, 'credit_amount' => 0, 'memo' => $narration],
                ['account_name' => $creditAcc, 'debit_amount' => 0, 'credit_amount' => $amount, 'memo' => $narration]
            ];
        }

        // Calculate and verify debits == credits
        $totalDebit = 0;
        $totalCredit = 0;
        foreach ($items as $it) {
            $totalDebit += floatval($it['debit_amount'] ?? 0);
            $totalCredit += floatval($it['credit_amount'] ?? 0);
        }

        if (abs($totalDebit - $totalCredit) > 0.01 || $totalDebit <= 0) {
            throw new Exception("Double entry unbalanced! Total Debits (KES {$totalDebit}) must equal Total Credits (KES {$totalCredit}).");
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO journal_entries (school_id, entry_number, reference_number, entry_date, narration, total_debit, total_credit, created_by_user_id)
                VALUES (:school_id, :entry_no, :ref, :edate, :narration, :tdebit, :tcredit, :user_id)
                RETURNING *
            ");
            $stmt->execute([
                ':school_id'  => $schoolId,
                ':entry_no'   => $entryNumber,
                ':ref'        => $reference ?: $entryNumber,
                ':edate'      => $entryDate,
                ':narration'  => $narration,
                ':tdebit'     => $totalDebit,
                ':tcredit'    => $totalCredit,
                ':user_id'    => $userId
            ]);
            $entry = $stmt->fetch(PDO::FETCH_ASSOC);

            // Insert line items
            $itemStmt = $this->db->prepare("
                INSERT INTO journal_entry_items (journal_entry_id, account_id, account_name, debit_amount, credit_amount, memo)
                VALUES (:entry_id, :acc_id, :acc_name, :dr, :cr, :memo)
            ");
            foreach ($items as $it) {
                $itemStmt->execute([
                    ':entry_id'  => $entry['id'],
                    ':acc_id'    => !empty($it['account_id']) ? $it['account_id'] : null,
                    ':acc_name'  => trim($it['account_name'] ?? 'Account'),
                    ':dr'        => floatval($it['debit_amount'] ?? 0),
                    ':cr'        => floatval($it['credit_amount'] ?? 0),
                    ':memo'      => trim($it['memo'] ?? $narration)
                ]);
            }

            // Write to Transaction Ledger audit trail
            $checksum = hash('sha256', $schoolId . $entryNumber . $totalDebit . microtime());
            $stmtLedger = $this->db->prepare("
                INSERT INTO transaction_ledger (school_id, entry_type, debit_amount, credit_amount, description, recorded_by_user_id, checksum)
                VALUES (:school_id, :type, :debit, :credit, :desc, :user_id, :checksum)
            ");
            $stmtLedger->execute([
                ':school_id' => $schoolId,
                ':type'      => 'JOURNAL',
                ':debit'     => $totalDebit,
                ':credit'    => $totalCredit,
                ':desc'      => "JOURNAL [{$entryNumber}]: {$narration}",
                ':user_id'   => $userId,
                ':checksum'  => $checksum
            ]);

            $this->db->commit();
            $entry['items'] = $items;
            return $entry;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ==========================================
    // 8. GENERAL LEDGER (UNIFIED AUDIT TRAIL)
    // ==========================================
    public function getGeneralLedger(string $schoolId, ?string $startDate = null, ?string $endDate = null): array
    {
        $params = [':school_id' => $schoolId];
        $dateFilter = "";

        if ($startDate && $endDate) {
            $dateFilter = "AND tl.created_at >= :start_date AND tl.created_at <= :end_date";
            $params[':start_date'] = $startDate . ' 00:00:00';
            $params[':end_date'] = $endDate . ' 23:59:59';
        }

        $stmt = $this->db->prepare("
            SELECT tl.*, s.admission_number, s.first_name, s.last_name, u.name as recorded_by_name
            FROM transaction_ledger tl
            LEFT JOIN students s ON tl.student_id = s.id
            LEFT JOIN users u ON tl.recorded_by_user_id = u.id
            WHERE tl.school_id = :school_id {$dateFilter}
            ORDER BY tl.created_at DESC
            LIMIT 250
        ");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}