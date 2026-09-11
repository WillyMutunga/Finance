<?php
declare(strict_types=1);

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class PocketMoneyService
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getWallets(string $schoolId, ?string $search = null, ?string $classId = null): array
    {
        $params = [':school_id' => $schoolId];
        $where = "WHERE st.school_id = :school_id";

        if ($search) {
            $where .= " AND (st.first_name ILIKE :q OR st.last_name ILIKE :q OR st.admission_number ILIKE :q)";
            $params[':q'] = "%$search%";
        }

        if ($classId && $classId !== 'ALL') {
            $where .= " AND st.class_id = :cid";
            $params[':cid'] = $classId;
        }

        $stmt = $this->db->prepare("
            SELECT st.id as student_id,
                   st.admission_number as adm_no,
                   st.first_name,
                   st.last_name,
                   (st.first_name || ' ' || st.last_name) as student_name,
                   c.name as class_name,
                   COALESCE(pma.id, NULL) as account_id,
                   COALESCE(pma.current_balance, 0.00) as balance,
                   COALESCE(pma.daily_spend_limit, 0.00) as daily_limit,
                   COALESCE(pma.is_locked, FALSE) as is_locked,
                   COALESCE(SUM(CASE WHEN t.transaction_type = 'DEPOSIT' THEN t.amount ELSE 0 END), 0.00) as total_deposits,
                   COALESCE(SUM(CASE WHEN t.transaction_type IN ('WITHDRAWAL', 'CANTEEN_PURCHASE', 'STORE_CHARGE') THEN t.amount ELSE 0 END), 0.00) as total_withdrawals
            FROM students st
            LEFT JOIN classes c ON st.class_id = c.id
            LEFT JOIN pocket_money_accounts pma ON st.id = pma.student_id
            LEFT JOIN pocket_money_transactions t ON st.id = t.student_id
            {$where}
            GROUP BY st.id, st.admission_number, st.first_name, st.last_name, c.name, pma.id, pma.current_balance, pma.daily_spend_limit, pma.is_locked
            ORDER BY st.first_name ASC
        ");
        $stmt->execute($params);
        $wallets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totBalance = 0.00;
        $totDeposits = 0.00;
        $totWithdrawals = 0.00;

        foreach ($wallets as &$w) {
            $bal = (float)$w['balance'];
            $dep = (float)$w['total_deposits'];
            $wit = (float)$w['total_withdrawals'];
            $totBalance += $bal;
            $totDeposits += $dep;
            $totWithdrawals += $wit;
        }

        return [
            'summary' => [
                'total_accounts'   => count($wallets),
                'total_balance'    => $totBalance,
                'total_deposits'   => $totDeposits,
                'total_withdrawn'  => $totWithdrawals
            ],
            'wallets' => $wallets
        ];
    }

    public function recordTransaction(string $schoolId, array $data): array
    {
        $studentId = $data['student_id'] ?? null;
        $type = strtoupper(trim($data['transaction_type'] ?? 'DEPOSIT')); // DEPOSIT or WITHDRAWAL
        $amount = floatval($data['amount'] ?? 0);
        $channel = trim($data['channel'] ?? 'Cash');
        $servedBy = trim($data['served_by'] ?? 'Accounts Desk');
        $notes = trim($data['notes'] ?? '');

        if (!$studentId) {
            throw new Exception('Student is required.');
        }
        if ($amount <= 0) {
            throw new Exception('Amount must be greater than zero.');
        }

        $this->db->beginTransaction();
        try {
            // 1. Ensure pocket money account exists
            $stmtAcc = $this->db->prepare("SELECT * FROM pocket_money_accounts WHERE student_id = :sid AND school_id = :school_id FOR UPDATE");
            $stmtAcc->execute([':sid' => $studentId, ':school_id' => $schoolId]);
            $account = $stmtAcc->fetch(PDO::FETCH_ASSOC);

            if (!$account) {
                $stmtNew = $this->db->prepare("
                    INSERT INTO pocket_money_accounts (school_id, student_id, current_balance)
                    VALUES (:school_id, :sid, 0.00)
                    RETURNING *
                ");
                $stmtNew->execute([':school_id' => $schoolId, ':sid' => $studentId]);
                $account = $stmtNew->fetch(PDO::FETCH_ASSOC);
            }

            $currentBal = (float)$account['current_balance'];

            if ($type === 'DEPOSIT') {
                $newBal = $currentBal + $amount;
            } else {
                // Withdrawal / Outflow
                if ($currentBal < $amount) {
                    throw new Exception("Insufficient wallet funds. Current balance: KES " . number_format($currentBal, 2) . ", requested: KES " . number_format($amount, 2));
                }
                $newBal = $currentBal - $amount;
            }

            // Reference number
            $count = $this->db->query("SELECT COUNT(*) FROM pocket_money_transactions WHERE school_id = '{$schoolId}'")->fetchColumn();
            $ref = ($type === 'DEPOSIT' ? 'DEP-' : 'WTH-') . str_pad((string)($count + 1), 6, '0', STR_PAD_LEFT);

            // 2. Insert transaction
            $stmtTx = $this->db->prepare("
                INSERT INTO pocket_money_transactions (
                    school_id, account_id, student_id, transaction_type, amount, balance_after,
                    channel, reference_no, served_by, notes
                ) VALUES (
                    :school_id, :aid, :sid, :type, :amt, :new_bal,
                    :channel, :ref, :served_by, :notes
                )
                RETURNING *
            ");
            $stmtTx->execute([
                ':school_id' => $schoolId,
                ':aid'       => $account['id'],
                ':sid'       => $studentId,
                ':type'      => $type,
                ':amt'       => $amount,
                ':new_bal'   => $newBal,
                ':channel'   => $channel,
                ':ref'       => $ref,
                ':served_by' => $servedBy,
                ':notes'     => $notes
            ]);
            $tx = $stmtTx->fetch(PDO::FETCH_ASSOC);

            // 3. Update account balance
            $this->db->prepare("UPDATE pocket_money_accounts SET current_balance = :bal, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                ->execute([':bal' => $newBal, ':id' => $account['id']]);

            $this->db->commit();
            return $tx;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getTransactions(string $schoolId, ?string $studentId = null, ?string $type = null): array
    {
        $params = [':school_id' => $schoolId];
        $where = "WHERE t.school_id = :school_id";

        if ($studentId) {
            $where .= " AND t.student_id = :sid";
            $params[':sid'] = $studentId;
        }

        if ($type && $type !== 'ALL') {
            $where .= " AND t.transaction_type = :type";
            $params[':type'] = $type;
        }

        $stmt = $this->db->prepare("
            SELECT t.*,
                   st.admission_number as adm_no,
                   (st.first_name || ' ' || st.last_name) as student_name,
                   c.name as class_name
            FROM pocket_money_transactions t
            JOIN students st ON t.student_id = st.id
            LEFT JOIN classes c ON st.class_id = c.id
            {$where}
            ORDER BY t.created_at DESC
        ");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}