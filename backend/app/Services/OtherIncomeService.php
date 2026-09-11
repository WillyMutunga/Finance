<?php

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class OtherIncomeService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // ==========================================
    // 1. CATEGORIES / REVENUE VOTE HEADS
    // ==========================================
    public function getCategories(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM other_income_categories 
            WHERE school_id = :school_id 
            ORDER BY created_at ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createCategory(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $code = trim($data['account_code'] ?? '');
        $desc = trim($data['description'] ?? '');

        if (empty($name)) {
            throw new Exception("Income category name is required.");
        }

        $stmt = $this->db->prepare("
            INSERT INTO other_income_categories (school_id, name, account_code, description)
            VALUES (:school_id, :name, :code, :desc)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':name' => $name,
            ':code' => $code ?: null,
            ':desc' => $desc ?: null
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ==========================================
    // 2. CUSTOMERS / EXTERNAL DEBTORS
    // ==========================================
    public function getCustomers(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT c.*,
                   COALESCE((SELECT SUM(balance) FROM other_income_invoices WHERE customer_id = c.id AND status != 'CANCELLED'), 0) + c.opening_balance as calculated_balance
            FROM other_income_customers c
            WHERE c.school_id = :school_id
            ORDER BY c.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as &$r) {
            $r['current_balance'] = (float)$r['calculated_balance'];
        }
        return $rows;
    }

    public function createCustomer(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        if (empty($name)) {
            throw new Exception("Customer name is required.");
        }

        $code = trim($data['customer_code'] ?? '') ?: $this->generateCustomerCode($schoolId);
        $category = trim($data['category'] ?? 'General Customer');
        $phone = trim($data['phone'] ?? '');
        $email = trim($data['email'] ?? '');
        $kraPin = trim($data['kra_pin'] ?? '');
        $address = trim($data['address'] ?? '');
        $openingBalance = (float)($data['opening_balance'] ?? 0);

        $stmt = $this->db->prepare("
            INSERT INTO other_income_customers (
                school_id, customer_code, name, category, phone, email, kra_pin, address, opening_balance, current_balance
            ) VALUES (
                :school_id, :customer_code, :name, :category, :phone, :email, :kra_pin, :address, :opening_balance, :current_balance
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':customer_code' => $code,
            ':name' => $name,
            ':category' => $category,
            ':phone' => $phone ?: null,
            ':email' => $email ?: null,
            ':kra_pin' => $kraPin ?: null,
            ':address' => $address ?: null,
            ':opening_balance' => $openingBalance,
            ':current_balance' => $openingBalance
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateCustomer(string $schoolId, string $id, array $data): array
    {
        $name = trim($data['name'] ?? '');
        if (empty($name)) {
            throw new Exception("Customer name is required.");
        }

        $stmt = $this->db->prepare("
            UPDATE other_income_customers
            SET name = :name,
                category = :category,
                phone = :phone,
                email = :email,
                kra_pin = :kra_pin,
                address = :address,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([
            ':name' => $name,
            ':category' => trim($data['category'] ?? 'General Customer'),
            ':phone' => trim($data['phone'] ?? '') ?: null,
            ':email' => trim($data['email'] ?? '') ?: null,
            ':kra_pin' => trim($data['kra_pin'] ?? '') ?: null,
            ':address' => trim($data['address'] ?? '') ?: null,
            ':id' => $id,
            ':school_id' => $schoolId
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new Exception("Customer not found.");
        return $row;
    }

    public function deleteCustomer(string $schoolId, string $id): bool
    {
        $chk = $this->db->prepare("SELECT COUNT(*) FROM other_income_invoices WHERE customer_id = :id");
        $chk->execute([':id' => $id]);
        if ($chk->fetchColumn() > 0) {
            throw new Exception("Cannot delete customer with active invoices or billing history.");
        }

        $stmt = $this->db->prepare("DELETE FROM other_income_customers WHERE id = :id AND school_id = :school_id");
        return $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
    }

    // ==========================================
    // 3. CUSTOMER INVOICES
    // ==========================================
    public function getInvoices(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT inv.*, 
                   c.name as customer_name, c.customer_code, c.phone as customer_phone,
                   cat.name as category_name
            FROM other_income_invoices inv
            JOIN other_income_customers c ON inv.customer_id = c.id
            JOIN other_income_categories cat ON inv.category_id = cat.id
            WHERE inv.school_id = :school_id
            ORDER BY inv.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createInvoice(string $schoolId, array $data): array
    {
        $customerId = $data['customer_id'] ?? '';
        $categoryId = $data['category_id'] ?? '';
        $amount = (float)($data['amount'] ?? 0);
        $description = trim($data['description'] ?? '');
        $dueDate = $data['due_date'] ?? date('Y-m-d', strtotime('+30 days'));

        if (empty($customerId) || empty($categoryId) || $amount <= 0) {
            throw new Exception("Customer, Category, and a valid Amount (> 0) are required.");
        }

        $invoiceNo = trim($data['invoice_number'] ?? '') ?: $this->generateInvoiceNumber($schoolId);

        $stmt = $this->db->prepare("
            INSERT INTO other_income_invoices (
                school_id, invoice_number, customer_id, category_id, description, amount, paid_amount, balance, due_date, status
            ) VALUES (
                :school_id, :invoice_number, :customer_id, :category_id, :description, :amount, 0.00, :amount, :due_date, 'PENDING'
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':invoice_number' => $invoiceNo,
            ':customer_id' => $customerId,
            ':category_id' => $categoryId,
            ':description' => $description ?: 'Customer Invoice for Other Income',
            ':amount' => $amount,
            ':due_date' => $dueDate
        ]);
        $inv = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->syncCustomerBalance($schoolId, $customerId);

        return $inv;
    }

    // ==========================================
    // 4. OTHER INCOME RECEIPTS
    // ==========================================
    public function getReceipts(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT r.*,
                   cat.name as category_name, cat.account_code as category_code,
                   c.name as customer_name, c.customer_code,
                   inv.invoice_number,
                   u.name as received_by_name
            FROM other_income_receipts r
            JOIN other_income_categories cat ON r.category_id = cat.id
            LEFT JOIN other_income_customers c ON r.customer_id = c.id
            LEFT JOIN other_income_invoices inv ON r.invoice_id = inv.id
            LEFT JOIN users u ON r.received_by_user_id = u.id
            WHERE r.school_id = :school_id
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createReceipt(string $schoolId, array $data, string $userId): array
    {
        $categoryId = $data['category_id'] ?? '';
        $payerName = trim($data['payer_name'] ?? '');
        $amount = (float)($data['amount'] ?? 0);
        $paymentMethod = $data['payment_method'] ?? 'BANK_TRANSFER';
        $bankAccount = trim($data['bank_account'] ?? 'Main Operations Account (KCB)');
        $description = trim($data['description'] ?? '');
        $customerId = !empty($data['customer_id']) ? $data['customer_id'] : null;
        $invoiceId = !empty($data['invoice_id']) ? $data['invoice_id'] : null;
        $txRef = trim($data['transaction_reference'] ?? '') ?: null;
        $chequeNo = trim($data['cheque_number'] ?? '') ?: null;
        $receiptDate = $data['receipt_date'] ?? date('Y-m-d');

        if (empty($categoryId) || empty($payerName) || $amount <= 0) {
            throw new Exception("Category, Payer Name, and Amount (> 0) are required.");
        }

        $receiptNo = trim($data['receipt_number'] ?? '') ?: $this->generateReceiptNumber($schoolId);

        $manageTx = false;
        if (!$this->db->inTransaction()) {
            $this->db->beginTransaction();
            $manageTx = true;
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO other_income_receipts (
                    school_id, receipt_number, customer_id, category_id, invoice_id,
                    payer_name, amount, payment_method, bank_account, transaction_reference,
                    cheque_number, description, received_by_user_id, receipt_date
                ) VALUES (
                    :school_id, :receipt_number, :customer_id, :category_id, :invoice_id,
                    :payer_name, :amount, :payment_method, :bank_account, :tx_ref,
                    :cheque_no, :description, :user_id, :receipt_date
                ) RETURNING *
            ");
            $stmt->execute([
                ':school_id' => $schoolId,
                ':receipt_number' => $receiptNo,
                ':customer_id' => $customerId,
                ':category_id' => $categoryId,
                ':invoice_id' => $invoiceId,
                ':payer_name' => $payerName,
                ':amount' => $amount,
                ':payment_method' => $paymentMethod,
                ':bank_account' => $bankAccount,
                ':tx_ref' => $txRef,
                ':cheque_no' => $chequeNo,
                ':description' => $description ?: 'Other Income Receipt',
                ':user_id' => $userId,
                ':receipt_date' => $receiptDate
            ]);
            $receipt = $stmt->fetch(PDO::FETCH_ASSOC);

            // If linked to an invoice, settle/reduce invoice balance
            if ($invoiceId) {
                $invStmt = $this->db->prepare("SELECT * FROM other_income_invoices WHERE id = :id FOR UPDATE");
                $invStmt->execute([':id' => $invoiceId]);
                $inv = $invStmt->fetch(PDO::FETCH_ASSOC);
                if ($inv) {
                    $newPaid = (float)$inv['paid_amount'] + $amount;
                    $newBal = max(0, (float)$inv['amount'] - $newPaid);
                    $newStatus = ($newBal <= 0) ? 'PAID' : 'PARTIAL';

                    $upInv = $this->db->prepare("
                        UPDATE other_income_invoices 
                        SET paid_amount = :paid, balance = :bal, status = :status, updated_at = CURRENT_TIMESTAMP
                        WHERE id = :id
                    ");
                    $upInv->execute([
                        ':paid' => $newPaid,
                        ':bal' => $newBal,
                        ':status' => $newStatus,
                        ':id' => $invoiceId
                    ]);
                }
            }

            if ($customerId) {
                $this->syncCustomerBalance($schoolId, $customerId);
            }

            if ($manageTx) {
                $this->db->commit();
            }
            return $receipt;
        } catch (Exception $e) {
            if ($manageTx && $this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    public function payInvoice(string $schoolId, string $invoiceId, array $data, string $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT inv.*, c.name as customer_name 
            FROM other_income_invoices inv
            JOIN other_income_customers c ON inv.customer_id = c.id
            WHERE inv.id = :id AND inv.school_id = :school_id
        ");
        $stmt->execute([':id' => $invoiceId, ':school_id' => $schoolId]);
        $inv = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$inv) throw new Exception("Invoice not found.");

        $payAmount = (float)($data['amount'] ?? $inv['balance']);
        if ($payAmount <= 0) throw new Exception("Payment amount must be greater than zero.");

        $receiptPayload = [
            'category_id' => $inv['category_id'],
            'customer_id' => $inv['customer_id'],
            'invoice_id' => $inv['id'],
            'payer_name' => $inv['customer_name'],
            'amount' => $payAmount,
            'payment_method' => $data['payment_method'] ?? 'BANK_TRANSFER',
            'bank_account' => $data['bank_account'] ?? 'Main Operations Account (KCB)',
            'transaction_reference' => $data['transaction_reference'] ?? null,
            'cheque_number' => $data['cheque_number'] ?? null,
            'description' => "Settlement of Invoice #{$inv['invoice_number']} - " . ($data['description'] ?? $inv['description'])
        ];

        return $this->createReceipt($schoolId, $receiptPayload, $userId);
    }

    // ==========================================
    // 5. CUSTOMER TAKE-ONS
    // ==========================================
    public function getTakeOns(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT t.*, c.name as customer_name, c.customer_code
            FROM other_income_take_ons t
            JOIN other_income_customers c ON t.customer_id = c.id
            WHERE t.school_id = :school_id
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createTakeOn(string $schoolId, array $data): array
    {
        $customerId = $data['customer_id'] ?? '';
        $amount = (float)($data['amount'] ?? 0);
        $description = trim($data['description'] ?? '');

        if (empty($customerId) || $amount <= 0) {
            throw new Exception("Customer and a valid opening balance amount are required.");
        }

        $stmt = $this->db->prepare("
            INSERT INTO other_income_take_ons (school_id, customer_id, amount, description)
            VALUES (:school_id, :customer_id, :amount, :desc)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':customer_id' => $customerId,
            ':amount' => $amount,
            ':desc' => $description ?: 'Opening historical balance brought forward'
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $up = $this->db->prepare("
            UPDATE other_income_customers 
            SET opening_balance = opening_balance + :amt, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
        ");
        $up->execute([':amt' => $amount, ':id' => $customerId, ':school_id' => $schoolId]);
        $this->syncCustomerBalance($schoolId, $customerId);

        return $row;
    }

    // ==========================================
    // 6. DONORS & DONATIONS
    // ==========================================
    public function getDonors(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT d.*, 
                   COALESCE((SELECT SUM(amount) FROM donations WHERE donor_id = d.id), 0) as total_contributed
            FROM donors d
            WHERE d.school_id = :school_id
            ORDER BY d.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createDonor(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        if (empty($name)) throw new Exception("Donor name is required.");

        $code = trim($data['donor_code'] ?? '') ?: $this->generateDonorCode($schoolId);
        $type = $data['donor_type'] ?? 'INDIVIDUAL';
        $contact = trim($data['contact_person'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $email = trim($data['email'] ?? '');
        $address = trim($data['address'] ?? '');

        $stmt = $this->db->prepare("
            INSERT INTO donors (school_id, donor_code, name, donor_type, contact_person, phone, email, address)
            VALUES (:school_id, :code, :name, :type, :contact, :phone, :email, :address)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':code' => $code,
            ':name' => $name,
            ':type' => $type,
            ':contact' => $contact ?: null,
            ':phone' => $phone ?: null,
            ':email' => $email ?: null,
            ':address' => $address ?: null
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getDonations(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT don.*, 
                   d.name as donor_name, d.donor_code, d.donor_type,
                   cat.name as category_name,
                   u.name as received_by_name
            FROM donations don
            JOIN donors d ON don.donor_id = d.id
            LEFT JOIN other_income_categories cat ON don.category_id = cat.id
            LEFT JOIN users u ON don.received_by_user_id = u.id
            WHERE don.school_id = :school_id
            ORDER BY don.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createDonation(string $schoolId, array $data, string $userId): array
    {
        $donorId = $data['donor_id'] ?? '';
        $amount = (float)($data['amount'] ?? 0);
        $purpose = trim($data['purpose'] ?? '');

        if (empty($donorId) || $amount <= 0 || empty($purpose)) {
            throw new Exception("Donor, Purpose, and Amount (> 0) are required.");
        }

        $receiptNo = trim($data['receipt_number'] ?? '') ?: $this->generateReceiptNumber($schoolId, 'DON');
        $categoryId = !empty($data['category_id']) ? $data['category_id'] : null;
        $paymentMethod = $data['payment_method'] ?? 'BANK_TRANSFER';
        $bankAccount = trim($data['bank_account'] ?? 'Development / Projects Account (Equity)');
        $txRef = trim($data['transaction_reference'] ?? '') ?: null;
        $donationDate = $data['donation_date'] ?? date('Y-m-d');
        $status = $data['status'] ?? 'RECEIVED';

        $stmt = $this->db->prepare("
            INSERT INTO donations (
                school_id, donor_id, category_id, receipt_number, amount, purpose,
                payment_method, bank_account, transaction_reference, donation_date, status, received_by_user_id
            ) VALUES (
                :school_id, :donor_id, :category_id, :receipt_no, :amount, :purpose,
                :payment_method, :bank_account, :tx_ref, :donation_date, :status, :user_id
            ) RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':donor_id' => $donorId,
            ':category_id' => $categoryId,
            ':receipt_no' => $receiptNo,
            ':amount' => $amount,
            ':purpose' => $purpose,
            ':payment_method' => $paymentMethod,
            ':bank_account' => $bankAccount,
            ':tx_ref' => $txRef,
            ':donation_date' => $donationDate,
            ':status' => $status,
            ':user_id' => $userId
        ]);
        $donation = $stmt->fetch(PDO::FETCH_ASSOC);

        $up = $this->db->prepare("
            UPDATE donors 
            SET total_donated = total_donated + :amt 
            WHERE id = :id AND school_id = :school_id
        ");
        $up->execute([':amt' => $amount, ':id' => $donorId, ':school_id' => $schoolId]);

        return $donation;
    }

    // ==========================================
    // HELPERS & NUMBER GENERATORS
    // ==========================================
    private function generateReceiptNumber(string $schoolId, string $prefix = 'OI'): string
    {
        $year = date('Y');
        $table = ($prefix === 'DON') ? 'donations' : 'other_income_receipts';
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM {$table} 
            WHERE school_id = :school_id AND receipt_number LIKE :prefix
        ");
        $stmt->execute([':school_id' => $schoolId, ':prefix' => "{$prefix}-{$year}-%"]);
        $count = (int)$stmt->fetchColumn() + 1;
        return sprintf("%s-%s-%04d", $prefix, $year, $count);
    }

    private function generateInvoiceNumber(string $schoolId): string
    {
        $year = date('Y');
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM other_income_invoices 
            WHERE school_id = :school_id AND invoice_number LIKE :prefix
        ");
        $stmt->execute([':school_id' => $schoolId, ':prefix' => "OI-INV-{$year}-%"]);
        $count = (int)$stmt->fetchColumn() + 1;
        return sprintf("OI-INV-%s-%04d", $year, $count);
    }

    private function generateCustomerCode(string $schoolId): string
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM other_income_customers WHERE school_id = :school_id");
        $stmt->execute([':school_id' => $schoolId]);
        $count = (int)$stmt->fetchColumn() + 1;
        return sprintf("CUST-%03d", $count);
    }

    private function generateDonorCode(string $schoolId): string
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM donors WHERE school_id = :school_id");
        $stmt->execute([':school_id' => $schoolId]);
        $count = (int)$stmt->fetchColumn() + 1;
        return sprintf("DON-%03d", $count);
    }

    private function syncCustomerBalance(string $schoolId, string $customerId): void
    {
        $stmt = $this->db->prepare("
            UPDATE other_income_customers
            SET current_balance = opening_balance + COALESCE((
                SELECT SUM(balance) FROM other_income_invoices 
                WHERE customer_id = :cid AND status != 'CANCELLED'
            ), 0),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = :cid AND school_id = :school_id
        ");
        $stmt->execute([':cid' => $customerId, ':school_id' => $schoolId]);
    }

    private function postToLedger(string $schoolId, array $receipt, string $userId): void
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO transaction_ledger (
                    school_id, account_type, account_name, transaction_type,
                    reference_id, reference_type, amount, balance_after, description, created_by_user_id
                ) VALUES (
                    :school_id, 'REVENUE_OTHER', :acc_name, 'CREDIT',
                    :ref_id, 'other_income_receipts', :amount, 0.00, :desc, :user_id
                )
            ");
            $stmt->execute([
                ':school_id' => $schoolId,
                ':acc_name' => $receipt['bank_account'] ?? 'Cashbook Bank Account',
                ':ref_id' => $receipt['id'],
                ':amount' => $receipt['amount'],
                ':desc' => "Other Income Receipt #{$receipt['receipt_number']} from {$receipt['payer_name']}",
                ':user_id' => $userId
            ]);
        } catch (Exception $e) {
            error_log("Ledger posting notice: " . $e->getMessage());
        }
    }
}