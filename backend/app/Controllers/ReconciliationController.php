<?php

namespace App\Controllers;

use App\Database;
use App\Services\ReconciliationEngine;
use PDO;

class ReconciliationController
{
    private PDO $db;
    private ReconciliationEngine $reconEngine;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->reconEngine = new ReconciliationEngine();
    }

    /**
     * Get Exception Queue (Unmatched & Ambiguous Transactions)
     */
    public function exceptions(): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT pt.*
            FROM payment_transactions pt
            WHERE pt.school_id = :school_id
              AND pt.reconciliation_status IN ('UNMATCHED', 'AMBIGUOUS')
            ORDER BY pt.payment_date DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $exceptions = $stmt->fetchAll();

        echo json_encode([
            'status' => 'success',
            'count'  => count($exceptions),
            'data'   => $exceptions
        ]);
    }

    /**
     * Trigger batch automated reconciliation run across all pending items
     */
    public function autoReconcileAll(): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT id FROM payment_transactions 
            WHERE school_id = :school_id AND reconciliation_status IN ('UNMATCHED', 'AMBIGUOUS')
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $pending = $stmt->fetchAll();

        $matchedCount = 0;
        $unmatchedCount = 0;

        foreach ($pending as $item) {
            $res = $this->reconEngine->processTransaction($schoolId, $item['id']);
            if (isset($res['status']) && $res['status'] === 'SUCCESS') {
                $matchedCount++;
            } else {
                $unmatchedCount++;
            }
        }

        echo json_encode([
            'status'          => 'success',
            'matched_count'   => $matchedCount,
            'unmatched_count' => $unmatchedCount,
            'message'         => "Automated reconciliation processed. {$matchedCount} transactions matched and credited."
        ]);
    }

    /**
     * Resolve an exception manually by assigning to a specific student
     */
    public function manualResolve(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $transactionId = trim($input['transaction_id'] ?? '');
        $studentId     = trim($input['student_id'] ?? '');
        $notes         = trim($input['notes'] ?? 'Manual allocation by Bursar');
        $userId        = trim($input['user_id'] ?? 'b0000000-0000-0000-0000-000000000001');

        if (empty($transactionId) || empty($studentId)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Transaction ID and Student ID are required']);
            return;
        }

        try {
            $result = $this->reconEngine->manualMatch($schoolId, $transactionId, $studentId, $userId, $notes);
            echo json_encode(['status' => 'success', 'data' => $result]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * List Reconciliation Matches Audit Trail (for Auditors)
     */
    public function matchesLog(): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT rm.*, s.first_name, s.last_name, s.admission_number, pt.reference_number, pt.amount,
                   pt.payer_name, pt.payer_phone, r.receipt_number, u.name as matched_by_name
            FROM reconciliation_matches rm
            JOIN payment_transactions pt ON rm.payment_transaction_id = pt.id
            JOIN students s ON rm.student_id = s.id
            LEFT JOIN receipts r ON rm.receipt_id = r.id
            LEFT JOIN users u ON rm.matched_by_user_id = u.id
            WHERE rm.school_id = :school_id
            ORDER BY rm.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
    }
}
