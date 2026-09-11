<?php

namespace App\Services;

use App\Database;
use PDO;

class ReconciliationEngine
{
    private PDO $db;
    private LedgerService $ledgerService;
    private SMSService $smsService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->ledgerService = new LedgerService();
        $this->smsService = new SMSService();
    }

    /**
     * Process an inbound payment transaction through automated matching rules
     */
    public function processTransaction(string $schoolId, string $transactionId): array
    {
        // 1. Fetch the raw payment transaction
        $stmt = $this->db->prepare("
            SELECT * FROM payment_transactions 
            WHERE id = :id AND school_id = :school_id
        ");
        $stmt->execute([':id' => $transactionId, ':school_id' => $schoolId]);
        $tx = $stmt->fetch();

        if (!$tx) {
            return ['status' => 'ERROR', 'message' => 'Transaction not found'];
        }

        if ($tx['reconciliation_status'] === 'AUTO_MATCHED' || $tx['reconciliation_status'] === 'MANUALLY_MATCHED') {
            return ['status' => 'ALREADY_RECONCILED', 'transaction_id' => $transactionId];
        }

        $accountRef = trim($tx['account_reference'] ?? '');
        $payerPhone = trim($tx['payer_phone'] ?? '');
        $payerName  = trim($tx['payer_name'] ?? '');
        $amount     = (float)$tx['amount'];

        $matchedStudent = null;
        $matchStrategy  = null;
        $confidence     = 0.0;
        $matchNotes     = '';

        // -------------------------------------------------------------
        // Rule 1: Exact Admission Number in BillRefNumber / Account Ref
        // -------------------------------------------------------------
        if (!empty($accountRef)) {
            // Clean account reference (remove spaces, hashes, etc.)
            $cleanRef = preg_replace('/[^a-zA-Z0-9\-_]/', '', $accountRef);
            
            $stmt = $this->db->prepare("
                SELECT s.*, c.name as class_name 
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE s.school_id = :school_id 
                  AND (LOWER(s.admission_number) = LOWER(:ref) 
                       OR LOWER(s.admission_number) LIKE LOWER(:wildcard_ref))
            ");
            $stmt->execute([
                ':school_id'     => $schoolId,
                ':ref'           => $cleanRef,
                ':wildcard_ref'  => '%' . $cleanRef . '%'
            ]);
            $candidates = $stmt->fetchAll();

            if (count($candidates) === 1) {
                $matchedStudent = $candidates[0];
                $matchStrategy  = 'EXACT_ADMISSION_NO';
                $confidence     = 100.0;
                $matchNotes     = "Matched Admission Number '{$matchedStudent['admission_number']}' from payment reference '{$accountRef}'";
            }
        }

        // -------------------------------------------------------------
        // Rule 2: Registered Guardian Phone Number Match
        // -------------------------------------------------------------
        if (!$matchedStudent && !empty($payerPhone)) {
            // Normalize phone (e.g. +254..., 254..., 07...)
            $cleanPhone = preg_replace('/[^0-9]/', '', $payerPhone);
            if (strlen($cleanPhone) >= 9) {
                $last9 = substr($cleanPhone, -9);
                
                $stmt = $this->db->prepare("
                    SELECT s.*, g.name as guardian_name, g.phone as guardian_phone
                    FROM students s
                    JOIN student_guardians sg ON s.id = sg.student_id
                    JOIN guardians g ON sg.guardian_id = g.id
                    WHERE s.school_id = :school_id
                      AND g.phone LIKE :phone_pattern
                ");
                $stmt->execute([
                    ':school_id'     => $schoolId,
                    ':phone_pattern' => '%' . $last9
                ]);
                $phoneCandidates = $stmt->fetchAll();

                if (count($phoneCandidates) === 1) {
                    $matchedStudent = $phoneCandidates[0];
                    $matchStrategy  = 'GUARDIAN_PHONE';
                    $confidence     = 95.0;
                    $matchNotes     = "Matched single student linked to registered guardian phone '{$matchedStudent['guardian_phone']}'";
                } elseif (count($phoneCandidates) > 1) {
                    // Siblings case: Try to disambiguate by name in account_reference or payer_name
                    foreach ($phoneCandidates as $cand) {
                        if (
                            (!empty($accountRef) && stripos($accountRef, $cand['first_name']) !== false) ||
                            (!empty($payerName) && stripos($payerName, $cand['first_name']) !== false)
                        ) {
                            $matchedStudent = $cand;
                            $matchStrategy  = 'GUARDIAN_PHONE_SIBLING_DISAMBIGUATION';
                            $confidence     = 90.0;
                            $matchNotes     = "Matched sibling '{$cand['first_name']}' via guardian phone & first name in note";
                            break;
                        }
                    }

                    if (!$matchedStudent) {
                        // Mark as ambiguous so bursar can choose between siblings
                        $this->markAsAmbiguous($schoolId, $transactionId, "Guardian phone matches " . count($phoneCandidates) . " siblings. Manual allocation required.");
                        return [
                            'status' => 'AMBIGUOUS',
                            'transaction_id' => $transactionId,
                            'candidates' => $phoneCandidates
                        ];
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // Rule 3: Fuzzy Student Name Match in Account Reference
        // -------------------------------------------------------------
        if (!$matchedStudent && !empty($accountRef) && strlen($accountRef) >= 3) {
            $words = explode(' ', $accountRef);
            foreach ($words as $word) {
                $word = trim($word);
                if (strlen($word) < 3) continue;

                $stmt = $this->db->prepare("
                    SELECT s.* FROM students s
                    WHERE s.school_id = :school_id
                      AND (LOWER(s.first_name) = LOWER(:name) OR LOWER(s.last_name) = LOWER(:name))
                ");
                $stmt->execute([':school_id' => $schoolId, ':name' => $word]);
                $nameMatches = $stmt->fetchAll();

                if (count($nameMatches) === 1) {
                    $matchedStudent = $nameMatches[0];
                    $matchStrategy  = 'FUZZY_NAME_MATCH';
                    $confidence     = 85.0;
                    $matchNotes     = "Matched unique student by name '{$word}' in payment reference";
                    break;
                }
            }
        }

        // -------------------------------------------------------------
        // Decision & Action
        // -------------------------------------------------------------
        if ($matchedStudent && $confidence >= 80.0) {
            return $this->finalizeReconciliation(
                $schoolId,
                $transactionId,
                $matchedStudent['id'],
                $amount,
                $matchStrategy,
                $confidence,
                $matchNotes,
                $tx['reference_number'],
                $tx['channel']
            );
        } else {
            // Place into Unmatched Exceptions Queue
            $this->markAsUnmatched($schoolId, $transactionId, "No confident match found. Sent to Exceptions Queue.");
            return [
                'status'         => 'UNMATCHED',
                'transaction_id' => $transactionId,
                'message'        => 'Placed in Exceptions Queue for manual review'
            ];
        }
    }

    /**
     * Finalize reconciliation: Create Ledger Credit, Issue Sequential Receipt, Trigger SMS
     */
    public function finalizeReconciliation(
        string $schoolId,
        string $transactionId,
        string $studentId,
        float $amount,
        string $strategy,
        float $confidence,
        string $notes,
        string $paymentRef,
        string $channel,
        ?string $manualUserId = null
    ): array {
        // 1. Generate Next Receipt Number (e.g. RCT-2026-0042)
        $receiptNumber = $this->generateNextReceiptNumber($schoolId);

        // 2. Fetch current term
        $stmtTerm = $this->db->prepare("SELECT id FROM terms WHERE school_id = :school_id AND is_current = TRUE LIMIT 1");
        $stmtTerm->execute([':school_id' => $schoolId]);
        $currentTermId = $stmtTerm->fetchColumn() ?: null;

        // 3. Record Immutable Ledger Entry
        $desc = "Fee Payment [Channel: {$channel}, Ref: {$paymentRef}]";
        $ledgerResult = $this->ledgerService->recordEntry(
            $schoolId,
            $studentId,
            'PAYMENT_CREDIT',
            0.00,
            $amount,
            $desc,
            $currentTermId,
            $transactionId,
            $receiptNumber,
            null,
            $manualUserId
        );

        // 4. Create Formal Receipt Record
        $stmtRct = $this->db->prepare("
            INSERT INTO receipts (
                school_id, receipt_number, student_id, ledger_entry_id, payment_transaction_id,
                amount, payment_mode, reference_code, issued_at
            ) VALUES (
                :school_id, :receipt_number, :student_id, :ledger_entry_id, :payment_transaction_id,
                :amount, :payment_mode, :reference_code, CURRENT_TIMESTAMP
            ) RETURNING id
        ");
        $stmtRct->execute([
            ':school_id'               => $schoolId,
            ':receipt_number'          => $receiptNumber,
            ':student_id'              => $studentId,
            ':ledger_entry_id'         => $ledgerResult['id'],
            ':payment_transaction_id'  => $transactionId,
            ':amount'                  => $amount,
            ':payment_mode'            => $channel,
            ':reference_code'          => $paymentRef
        ]);
        $receiptId = $stmtRct->fetchColumn();

        // 5. Update Payment Transaction Status
        $stmtTx = $this->db->prepare("
            UPDATE payment_transactions 
            SET reconciliation_status = :status, reconciled_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
        ");
        $stmtTx->execute([
            ':status'    => ($manualUserId ? 'MANUALLY_MATCHED' : 'AUTO_MATCHED'),
            ':id'        => $transactionId,
            ':school_id' => $schoolId
        ]);

        // 6. Record in Reconciliation Matches Log (Audit trail for match decisions)
        $stmtMatch = $this->db->prepare("
            INSERT INTO reconciliation_matches (
                school_id, payment_transaction_id, student_id, ledger_entry_id, receipt_id,
                match_strategy, confidence_score, matched_by_user_id, match_notes
            ) VALUES (
                :school_id, :payment_transaction_id, :student_id, :ledger_entry_id, :receipt_id,
                :match_strategy, :confidence_score, :matched_by_user_id, :match_notes
            )
        ");
        $stmtMatch->execute([
            ':school_id'               => $schoolId,
            ':payment_transaction_id'  => $transactionId,
            ':student_id'              => $studentId,
            ':ledger_entry_id'         => $ledgerResult['id'],
            ':receipt_id'              => $receiptId,
            ':match_strategy'          => $strategy,
            ':confidence_score'        => $confidence,
            ':matched_by_user_id'      => $manualUserId,
            ':match_notes'             => $notes
        ]);

        // 7. Dispatch Automated Receipt SMS to Guardian
        $this->smsService->sendReceiptSMS($schoolId, $studentId, $receiptNumber, $amount, $paymentRef);

        return [
            'status'           => 'SUCCESS',
            'transaction_id'   => $transactionId,
            'student_id'       => $studentId,
            'receipt_number'   => $receiptNumber,
            'amount'           => $amount,
            'match_strategy'   => $strategy,
            'confidence_score' => $confidence
        ];
    }

    /**
     * Manual Override: Resolve an exception from the queue
     */
    public function manualMatch(string $schoolId, string $transactionId, string $studentId, string $userId, string $notes): array
    {
        $stmt = $this->db->prepare("SELECT * FROM payment_transactions WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $transactionId, ':school_id' => $schoolId]);
        $tx = $stmt->fetch();

        if (!$tx) {
            throw new \Exception("Transaction not found.");
        }

        return $this->finalizeReconciliation(
            $schoolId,
            $transactionId,
            $studentId,
            (float)$tx['amount'],
            'MANUAL_OVERRIDE',
            100.0,
            $notes ?: 'Manually reconciled by Bursar',
            $tx['reference_number'],
            $tx['channel'],
            $userId
        );
    }

    private function generateNextReceiptNumber(string $schoolId): string
    {
        $year = date('Y');
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM receipts 
            WHERE school_id = :school_id AND receipt_number LIKE :prefix
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':prefix'    => "RCT-{$year}-%"
        ]);
        $count = (int)$stmt->fetchColumn() + 1;
        return sprintf("RCT-%s-%04d", $year, $count);
    }

    private function markAsAmbiguous(string $schoolId, string $transactionId, string $reason): void
    {
        $stmt = $this->db->prepare("
            UPDATE payment_transactions 
            SET reconciliation_status = 'AMBIGUOUS'
            WHERE id = :id AND school_id = :school_id
        ");
        $stmt->execute([':id' => $transactionId, ':school_id' => $schoolId]);
    }

    private function markAsUnmatched(string $schoolId, string $transactionId, string $reason): void
    {
        $stmt = $this->db->prepare("
            UPDATE payment_transactions 
            SET reconciliation_status = 'UNMATCHED'
            WHERE id = :id AND school_id = :school_id
        ");
        $stmt->execute([':id' => $transactionId, ':school_id' => $schoolId]);
    }
}
