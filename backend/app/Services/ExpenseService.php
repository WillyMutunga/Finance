<?php

namespace App\Services;

use App\Database;
use PDO;

class ExpenseService
{
    private PDO $db;
    private LedgerService $ledgerService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->ledgerService = new LedgerService();
    }

    /**
     * Create a new expense voucher request
     */
    public function createVoucher(
        string $schoolId,
        string $categoryId,
        string $payeeName,
        float $amount,
        string $paymentMethod,
        string $description,
        string $requestedByUserId,
        ?string $lpoNumber = null,
        ?string $chequeNumber = null,
        ?string $bankAccount = null,
        ?string $supplierId = null
    ): array {
        $voucherNumber = $this->generateNextVoucherNumber($schoolId);

        // Fetch current term
        $stmtTerm = $this->db->prepare("SELECT id FROM terms WHERE school_id = :school_id AND is_current = TRUE LIMIT 1");
        $stmtTerm->execute([':school_id' => $schoolId]);
        $currentTermId = $stmtTerm->fetchColumn() ?: null;

        $isValidUuid = function(?string $uuid): bool {
            return !empty($uuid) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid) === 1;
        };

        // Validate category_id exists
        $validCatId = null;
        if ($isValidUuid($categoryId)) {
            $catCheck = $this->db->prepare("SELECT id FROM expense_categories WHERE id = :cid");
            $catCheck->execute([':cid' => $categoryId]);
            $validCatId = $catCheck->fetchColumn();
        }
        if (!$validCatId) {
            $catFallback = $this->db->prepare("SELECT id FROM expense_categories WHERE school_id = :school_id LIMIT 1");
            $catFallback->execute([':school_id' => $schoolId]);
            $validCatId = $catFallback->fetchColumn();
        }
        if (!$validCatId) {
            $catIns = $this->db->prepare("INSERT INTO expense_categories (school_id, name, code, description) VALUES (:school_id, 'General & Operations', 'EXP-GEN', 'General operating expenses') RETURNING id");
            $catIns->execute([':school_id' => $schoolId]);
            $validCatId = $catIns->fetchColumn();
        }
        $categoryId = $validCatId;

        // Validate requested_by_user_id exists
        $validUserId = null;
        if ($isValidUuid($requestedByUserId)) {
            $userCheck = $this->db->prepare("SELECT id FROM users WHERE id = :uid");
            $userCheck->execute([':uid' => $requestedByUserId]);
            $validUserId = $userCheck->fetchColumn();
        }
        if (!$validUserId) {
            $adminUser = $this->db->query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1")->fetchColumn();
            $requestedByUserId = $adminUser;
        } else {
            $requestedByUserId = $validUserId;
        }

        $stmt = $this->db->prepare("
            INSERT INTO expense_vouchers (
                school_id, voucher_number, category_id, term_id, payee_name, amount,
                payment_method, description, lpo_number, status, requested_by_user_id,
                created_at, updated_at
            ) VALUES (
                :school_id, :voucher_number, :category_id, :term_id, :payee_name, :amount,
                :payment_method, :description, :lpo_number, 'REQUESTED', :requested_by,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING *
        ");

        $stmt->execute([
            ':school_id'       => $schoolId,
            ':voucher_number'  => $voucherNumber,
            ':category_id'     => $categoryId,
            ':term_id'         => $currentTermId,
            ':payee_name'      => $payeeName,
            ':amount'          => $amount,
            ':payment_method'  => $paymentMethod,
            ':description'     => $description,
            ':lpo_number'      => $lpoNumber ?: ('LPO-' . date('Y') . '-' . rand(100, 999)),
            ':requested_by'    => $requestedByUserId
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Headteacher / Director Approval Step
     */
    public function approveVoucher(string $schoolId, string $voucherId, string $approverUserId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM expense_vouchers WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $voucherId, ':school_id' => $schoolId]);
        $v = $stmt->fetch();

        if (!$v) {
            throw new \Exception("Voucher not found.");
        }

        if ($v['status'] !== 'REQUESTED') {
            throw new \Exception("Voucher is not in REQUESTED status.");
        }

        $isValidUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $approverUserId) === 1;
        $validApprover = null;
        if ($isValidUuid) {
            $uCheck = $this->db->prepare("SELECT id FROM users WHERE id = :uid");
            $uCheck->execute([':uid' => $approverUserId]);
            $validApprover = $uCheck->fetchColumn();
        }
        if (!$validApprover) {
            $validApprover = $this->db->query("SELECT id FROM users WHERE role IN ('head_teacher', 'super_admin', 'school_admin') ORDER BY created_at ASC LIMIT 1")->fetchColumn();
        }
        if (!$validApprover) {
            $validApprover = $this->db->query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1")->fetchColumn();
        }

        $stmtUp = $this->db->prepare("
            UPDATE expense_vouchers 
            SET status = 'APPROVED', approved_by_user_id = :approver, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
        ");
        $stmtUp->execute([':approver' => $validApprover, ':id' => $voucherId, ':school_id' => $schoolId]);

        return ['status' => 'APPROVED', 'voucher_id' => $voucherId];
    }

    /**
     * Bursar / Cashier Disbursement Step
     */
    public function disburseVoucher(string $schoolId, string $voucherId, string $disburserUserId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM expense_vouchers WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $voucherId, ':school_id' => $schoolId]);
        $v = $stmt->fetch();

        if (!$v || $v['status'] !== 'APPROVED') {
            throw new \Exception("Voucher must be APPROVED before disbursement.");
        }

        $isValidUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $disburserUserId) === 1;
        $validDisburser = null;
        if ($isValidUuid) {
            $uCheck = $this->db->prepare("SELECT id FROM users WHERE id = :uid");
            $uCheck->execute([':uid' => $disburserUserId]);
            $validDisburser = $uCheck->fetchColumn();
        }
        if (!$validDisburser) {
            $validDisburser = $this->db->query("SELECT id FROM users WHERE role IN ('bursar', 'super_admin', 'school_admin') ORDER BY created_at ASC LIMIT 1")->fetchColumn();
        }
        if (!$validDisburser) {
            $validDisburser = $this->db->query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1")->fetchColumn();
        }

        $stmtUp = $this->db->prepare("
            UPDATE expense_vouchers 
            SET status = 'DISBURSED', disbursed_by_user_id = :disburser, disbursed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
        ");
        $stmtUp->execute([':disburser' => $validDisburser, ':id' => $voucherId, ':school_id' => $schoolId]);

        return ['status' => 'DISBURSED', 'voucher_id' => $voucherId, 'amount' => $v['amount']];
    }

    /**
     * Cancel / Void Voucher
     */
    public function cancelVoucher(string $schoolId, string $voucherId, string $userId, string $reason): array
    {
        $stmt = $this->db->prepare("
            UPDATE expense_vouchers 
            SET status = 'CANCELLED', description = description || ' [CANCELLED: ' || :reason || ']', updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
        ");
        $stmt->execute([':reason' => $reason, ':id' => $voucherId, ':school_id' => $schoolId]);
        return ['status' => 'CANCELLED', 'voucher_id' => $voucherId];
    }

    // ==========================================
    // 2. LOCAL PURCHASE ORDERS (LPO)
    // ==========================================
    public function getLpos(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT lpo.*, s.name as supplier_name, s.phone as supplier_phone, u.name as issued_by_name
            FROM local_purchase_orders lpo
            LEFT JOIN suppliers s ON lpo.supplier_id = s.id
            LEFT JOIN users u ON lpo.issued_by_user_id = u.id
            WHERE lpo.school_id = :school_id
            ORDER BY lpo.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createLpo(string $schoolId, array $data, string $userId): array
    {
        $supplierName = trim($data['supplier_name'] ?? '');
        $supplierId   = !empty($data['supplier_id']) ? trim($data['supplier_id']) : null;
        $items        = trim($data['items_description'] ?? '');
        $qtyDetails   = trim($data['quantity_details'] ?? '');
        $estAmount    = (float)($data['estimated_amount'] ?? 0);
        $deliveryDate = !empty($data['delivery_date']) ? trim($data['delivery_date']) : date('Y-m-d', strtotime('+7 days'));
        $notes        = trim($data['notes'] ?? '');

        if (empty($supplierName) || empty($items) || $estAmount <= 0) {
            throw new \Exception("Supplier name, items description and estimated amount are required.");
        }

        // Generate next LPO number
        $year = date('Y');
        $cStmt = $this->db->prepare("SELECT COUNT(*) FROM local_purchase_orders WHERE school_id = :school_id AND lpo_number LIKE :prefix");
        $cStmt->execute([':school_id' => $schoolId, ':prefix' => "LPO-{$year}-%"]);
        $lpoNo = sprintf("LPO-%s-%04d", $year, (int)$cStmt->fetchColumn() + 1);

        $stmt = $this->db->prepare("
            INSERT INTO local_purchase_orders (
                school_id, lpo_number, supplier_id, supplier_name, items_description,
                quantity_details, estimated_amount, delivery_date, status, issued_by_user_id, notes
            ) VALUES (
                :school_id, :lpo_no, :supplier_id, :supplier_name, :items,
                :qty, :amount, :delivery_date, 'ISSUED', :user_id, :notes
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id'      => $schoolId,
            ':lpo_no'         => $lpoNo,
            ':supplier_id'    => $supplierId,
            ':supplier_name'  => $supplierName,
            ':items'          => $items,
            ':qty'            => $qtyDetails,
            ':amount'         => $estAmount,
            ':delivery_date'  => $deliveryDate,
            ':user_id'        => $userId,
            ':notes'          => $notes
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateLpoStatus(string $schoolId, string $lpoId, string $status): array
    {
        $stmt = $this->db->prepare("
            UPDATE local_purchase_orders
            SET status = :status, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([':status' => strtoupper($status), ':id' => $lpoId, ':school_id' => $schoolId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ==========================================
    // 3. SUPPLIER BILLS & ACCOUNTS PAYABLE
    // ==========================================
    public function getBills(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT b.*, s.name as supplier_name, s.phone as supplier_phone, ec.name as category_name, lpo.lpo_number
            FROM supplier_bills b
            LEFT JOIN suppliers s ON b.supplier_id = s.id
            LEFT JOIN expense_categories ec ON b.category_id = ec.id
            LEFT JOIN local_purchase_orders lpo ON b.lpo_id = lpo.id
            WHERE b.school_id = :school_id
            ORDER BY b.due_date ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createBill(string $schoolId, array $data): array
    {
        $supplierName = trim($data['supplier_name'] ?? '');
        $supplierId   = !empty($data['supplier_id']) ? trim($data['supplier_id']) : null;
        $categoryId   = !empty($data['category_id']) ? trim($data['category_id']) : null;
        $lpoId        = !empty($data['lpo_id']) ? trim($data['lpo_id']) : null;
        $billNo       = trim($data['bill_number'] ?? ('INV-' . rand(10000, 99999)));
        $billDate     = !empty($data['bill_date']) ? trim($data['bill_date']) : date('Y-m-d');
        $dueDate      = !empty($data['due_date']) ? trim($data['due_date']) : date('Y-m-d', strtotime('+30 days'));
        $amount       = (float)($data['amount'] ?? 0);
        $notes        = trim($data['notes'] ?? '');

        if (empty($supplierName) || $amount <= 0) {
            throw new \Exception("Supplier name and valid bill amount are required.");
        }

        $stmt = $this->db->prepare("
            INSERT INTO supplier_bills (
                school_id, bill_number, supplier_id, supplier_name, category_id, lpo_id,
                bill_date, due_date, amount, amount_paid, status, notes
            ) VALUES (
                :school_id, :bill_no, :supplier_id, :supplier_name, :category_id, :lpo_id,
                :bill_date, :due_date, :amount, 0.00, 'PENDING', :notes
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id'     => $schoolId,
            ':bill_no'       => $billNo,
            ':supplier_id'   => $supplierId,
            ':supplier_name' => $supplierName,
            ':category_id'   => $categoryId,
            ':lpo_id'        => $lpoId,
            ':bill_date'     => $billDate,
            ':due_date'      => $dueDate,
            ':amount'        => $amount,
            ':notes'         => $notes
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function payBill(string $schoolId, string $billId, float $payAmount, string $userId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM supplier_bills WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $billId, ':school_id' => $schoolId]);
        $bill = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$bill) throw new \Exception("Bill not found.");

        $newPaid = (float)$bill['amount_paid'] + $payAmount;
        $status = ($newPaid >= (float)$bill['amount']) ? 'PAID' : 'PARTIALLY_PAID';

        $upStmt = $this->db->prepare("
            UPDATE supplier_bills 
            SET amount_paid = :paid, status = :status, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $upStmt->execute([':paid' => $newPaid, ':status' => $status, ':id' => $billId, ':school_id' => $schoolId]);

        // Auto-create matching expense voucher
        $this->createVoucher(
            $schoolId,
            $bill['category_id'] ?: '',
            $bill['supplier_name'],
            $payAmount,
            'BANK_TRANSFER',
            "Payment for Bill #{$bill['bill_number']} - {$bill['notes']}",
            $userId,
            null
        );

        return $upStmt->fetch(PDO::FETCH_ASSOC);
    }

    // ==========================================
    // 4. SUPPLIERS & CREDITORS DIRECTORY
    // ==========================================
    public function getSuppliers(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT s.*,
                   COALESCE((SELECT SUM(amount - amount_paid) FROM supplier_bills WHERE supplier_id = s.id AND status != 'PAID'), 0) as current_balance,
                   COALESCE((SELECT COUNT(*) FROM supplier_bills WHERE supplier_id = s.id), 0) as bills_count
            FROM suppliers s
            WHERE s.school_id = :school_id
            ORDER BY s.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createSupplier(string $schoolId, array $data): array
    {
        $name     = trim($data['name'] ?? '');
        $category = trim($data['category'] ?? 'General Supplies');
        $contact  = trim($data['contact_person'] ?? '');
        $phone    = trim($data['phone'] ?? '');
        $email    = trim($data['email'] ?? '');
        $address  = trim($data['address'] ?? '');
        $bankName = trim($data['bank_name'] ?? '');
        $bankAcc  = trim($data['bank_account_no'] ?? '');
        $kraPin   = trim($data['kra_pin'] ?? '');
        $openBal  = (float)($data['opening_balance'] ?? 0);

        if (empty($name)) throw new \Exception("Supplier name is required.");

        $cStmt = $this->db->prepare("SELECT COUNT(*) FROM suppliers WHERE school_id = :school_id");
        $cStmt->execute([':school_id' => $schoolId]);
        $code = sprintf("SUP-%04d", (int)$cStmt->fetchColumn() + 1);

        $stmt = $this->db->prepare("
            INSERT INTO suppliers (
                school_id, supplier_code, name, category, contact_person, phone,
                email, address, bank_name, bank_account_no, kra_pin, opening_balance, current_balance, status
            ) VALUES (
                :school_id, :code, :name, :cat, :contact, :phone,
                :email, :address, :bank, :acc, :kra, :open_bal, :open_bal, 'ACTIVE'
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':code'      => $code,
            ':name'      => $name,
            ':cat'       => $category,
            ':contact'   => $contact,
            ':phone'     => $phone,
            ':email'     => $email,
            ':address'   => $address,
            ':bank'      => $bankName,
            ':acc'       => $bankAcc,
            ':kra'       => $kraPin,
            ':open_bal'  => $openBal
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateSupplier(string $schoolId, string $id, array $data): array
    {
        $stmt = $this->db->prepare("
            UPDATE suppliers
            SET name = :name, category = :cat, contact_person = :contact, phone = :phone,
                email = :email, address = :address, bank_name = :bank, bank_account_no = :acc,
                kra_pin = :kra, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([
            ':name'      => trim($data['name'] ?? ''),
            ':cat'       => trim($data['category'] ?? 'General Supplies'),
            ':contact'   => trim($data['contact_person'] ?? ''),
            ':phone'     => trim($data['phone'] ?? ''),
            ':email'     => trim($data['email'] ?? ''),
            ':address'   => trim($data['address'] ?? ''),
            ':bank'      => trim($data['bank_name'] ?? ''),
            ':acc'       => trim($data['bank_account_no'] ?? ''),
            ':kra'       => trim($data['kra_pin'] ?? ''),
            ':id'        => $id,
            ':school_id' => $schoolId
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteSupplier(string $schoolId, string $id): void
    {
        $stmt = $this->db->prepare("DELETE FROM suppliers WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
    }

    // ==========================================
    // 5. SUPPLIER TAKE ONS (OPENING BALANCES)
    // ==========================================
    public function getSupplierTakeOns(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT sto.*, s.name as supplier_name, s.supplier_code, s.phone
            FROM supplier_take_ons sto
            JOIN suppliers s ON sto.supplier_id = s.id
            WHERE sto.school_id = :school_id
            ORDER BY sto.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createSupplierTakeOn(string $schoolId, array $data): array
    {
        $supplierId = trim($data['supplier_id'] ?? '');
        $invRef     = trim($data['invoice_ref'] ?? ('INV-HIST-' . rand(1000, 9999)));
        $invDate    = !empty($data['invoice_date']) ? trim($data['invoice_date']) : date('Y-m-d');
        $amount     = (float)($data['amount'] ?? 0);
        $desc       = trim($data['description'] ?? 'Historical debt carried forward');

        if (empty($supplierId) || $amount <= 0) {
            throw new \Exception("Supplier and positive opening balance amount are required.");
        }

        $stmt = $this->db->prepare("
            INSERT INTO supplier_take_ons (
                school_id, supplier_id, invoice_ref, invoice_date, amount, amount_settled, description
            ) VALUES (
                :school_id, :supplier_id, :inv_ref, :inv_date, :amount, 0.00, :desc
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id'    => $schoolId,
            ':supplier_id'  => $supplierId,
            ':inv_ref'      => $invRef,
            ':inv_date'     => $invDate,
            ':amount'       => $amount,
            ':desc'         => $desc
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ==========================================
    // 6. STUDENT FEE REFUNDS REGISTER
    // ==========================================
    public function getFeeRefunds(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT fr.*, s.first_name, s.last_name, s.admission_number, c.name as class_name,
                   req.name as requested_by_name, app.name as approved_by_name, disb.name as disbursed_by_name
            FROM fee_refunds fr
            JOIN students s ON fr.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users req ON fr.requested_by_user_id = req.id
            LEFT JOIN users app ON fr.approved_by_user_id = app.id
            LEFT JOIN users disb ON fr.disbursed_by_user_id = disb.id
            WHERE fr.school_id = :school_id
            ORDER BY fr.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createFeeRefund(string $schoolId, array $data, string $userId): array
    {
        $studentId  = trim($data['student_id'] ?? '');
        $amount     = (float)($data['amount'] ?? 0);
        $payMethod  = trim($data['payment_method'] ?? 'CHEQUE');
        $chequeNo   = trim($data['cheque_number'] ?? ('CHQ-REF-' . rand(10000, 99999)));
        $bankAcc    = trim($data['bank_account'] ?? 'Main School Operating Account');
        $recipient  = trim($data['recipient_name'] ?? 'Parent / Guardian');
        $reason     = trim($data['reason'] ?? 'Fee overpayment refund / Student transfer');

        if (empty($studentId) || $amount <= 0) {
            throw new \Exception("Student and positive refund amount are required.");
        }

        $year = date('Y');
        $cStmt = $this->db->prepare("SELECT COUNT(*) FROM fee_refunds WHERE school_id = :school_id");
        $cStmt->execute([':school_id' => $schoolId]);
        $refNo = sprintf("REF-%s-%04d", $year, (int)$cStmt->fetchColumn() + 1);

        $stmt = $this->db->prepare("
            INSERT INTO fee_refunds (
                school_id, refund_number, student_id, amount, payment_method,
                cheque_number, bank_account, recipient_name, reason, status, requested_by_user_id
            ) VALUES (
                :school_id, :ref_no, :student_id, :amount, :pay_method,
                :cheque_no, :bank_acc, :recipient, :reason, 'PENDING', :user_id
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id'   => $schoolId,
            ':ref_no'      => $refNo,
            ':student_id'  => $studentId,
            ':amount'      => $amount,
            ':pay_method'  => $payMethod,
            ':cheque_no'   => $chequeNo,
            ':bank_acc'    => $bankAcc,
            ':recipient'   => $recipient,
            ':reason'      => $reason,
            ':user_id'     => $userId
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function approveFeeRefund(string $schoolId, string $refundId, string $userId): array
    {
        $stmt = $this->db->prepare("
            UPDATE fee_refunds 
            SET status = 'APPROVED', approved_by_user_id = :user_id, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([':user_id' => $userId, ':id' => $refundId, ':school_id' => $schoolId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function disburseFeeRefund(string $schoolId, string $refundId, string $userId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM fee_refunds WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $refundId, ':school_id' => $schoolId]);
        $refund = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$refund) throw new \Exception("Refund record not found.");

        $this->db->beginTransaction();
        try {
            // Post debit entry to student ledger
            $ledger = $this->ledgerService->recordEntry(
                $schoolId,
                $refund['student_id'],
                'INVOICE_CHARGE',
                (float)$refund['amount'],
                0.00,
                "Fee Refund Issued ({$refund['refund_number']}) - {$refund['reason']}",
                null,
                null,
                $refund['refund_number'],
                null,
                $userId
            );

            $upStmt = $this->db->prepare("
                UPDATE fee_refunds 
                SET status = 'DISBURSED', disbursed_by_user_id = :user_id, ledger_entry_id = :ledger_id, updated_at = CURRENT_TIMESTAMP
                WHERE id = :id AND school_id = :school_id
                RETURNING *
            ");
            $upStmt->execute([
                ':user_id'   => $userId,
                ':ledger_id' => $ledger['id'] ?? null,
                ':id'        => $refundId,
                ':school_id' => $schoolId
            ]);
            $res = $upStmt->fetch(PDO::FETCH_ASSOC);

            $this->db->commit();
            return $res;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ==========================================
    // 7. PETTY CASH FLOAT & VOUCHERS
    // ==========================================
    public function getPettyCash(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT pc.*, ec.name as category_name, u.name as recorded_by_name
            FROM petty_cash_entries pc
            LEFT JOIN expense_categories ec ON pc.category_id = ec.id
            LEFT JOIN users u ON pc.recorded_by_user_id = u.id
            WHERE pc.school_id = :school_id
            ORDER BY pc.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate current float balance
        $stmtBal = $this->db->prepare("
            SELECT COALESCE(SUM(CASE WHEN entry_type = 'FLOAT_TOPUP' THEN amount ELSE -amount END), 0)
            FROM petty_cash_entries
            WHERE school_id = :school_id
        ");
        $stmtBal->execute([':school_id' => $schoolId]);
        $currentBalance = (float)$stmtBal->fetchColumn();

        return [
            'current_float_balance' => $currentBalance,
            'entries'               => $entries
        ];
    }

    public function recordPettyCash(string $schoolId, array $data, string $userId): array
    {
        $type       = strtoupper(trim($data['entry_type'] ?? 'EXPENSE_CLAIM'));
        $amount     = (float)($data['amount'] ?? 0);
        $payee      = trim($data['payee_name'] ?? 'Petty Cash Custodian');
        $categoryId = !empty($data['category_id']) ? trim($data['category_id']) : null;
        $receiptRef = trim($data['receipt_reference'] ?? '');
        $desc       = trim($data['description'] ?? '');

        if ($amount <= 0 || empty($desc)) {
            throw new \Exception("Amount and description are required for petty cash transactions.");
        }

        // Current balance
        $stmtBal = $this->db->prepare("
            SELECT COALESCE(SUM(CASE WHEN entry_type = 'FLOAT_TOPUP' THEN amount ELSE -amount END), 0)
            FROM petty_cash_entries
            WHERE school_id = :school_id
        ");
        $stmtBal->execute([':school_id' => $schoolId]);
        $currentBal = (float)$stmtBal->fetchColumn();

        if ($type === 'EXPENSE_CLAIM' && $amount > $currentBal) {
            throw new \Exception("Insufficient petty cash float balance (Current float: KES " . number_format($currentBal, 2) . ")");
        }

        $newBal = ($type === 'FLOAT_TOPUP') ? ($currentBal + $amount) : ($currentBal - $amount);
        $voucherNo = sprintf("PC-%s-%04d", date('Y'), rand(1000, 9999));

        $stmt = $this->db->prepare("
            INSERT INTO petty_cash_entries (
                school_id, voucher_number, entry_type, amount, payee_name,
                category_id, receipt_reference, balance_after, description, recorded_by_user_id
            ) VALUES (
                :school_id, :voucher_no, :type, :amount, :payee,
                :category_id, :receipt_ref, :new_bal, :desc, :user_id
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id'    => $schoolId,
            ':voucher_no'   => $voucherNo,
            ':type'         => $type,
            ':amount'       => $amount,
            ':payee'        => $payee,
            ':category_id'  => $categoryId,
            ':receipt_ref'  => $receiptRef,
            ':new_bal'      => $newBal,
            ':desc'         => $desc,
            ':user_id'      => $userId
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function generateNextVoucherNumber(string $schoolId): string
    {
        $year = date('Y');
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM expense_vouchers WHERE school_id = :school_id AND voucher_number LIKE :prefix");
        $stmt->execute([':school_id' => $schoolId, ':prefix' => "PV-{$year}-%"]);
        $count = (int)$stmt->fetchColumn() + 1;
        return sprintf("PV-%s-%04d", $year, $count);
    }
}