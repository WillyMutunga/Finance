<?php

namespace App\Controllers;

use App\Database;
use App\Services\LedgerService;
use PDO;

class FeeController
{
    private PDO $db;
    private LedgerService $ledgerService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->ledgerService = new LedgerService();
    }

    public function structures(): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT fs.*, c.name as class_name, t.name as term_name, ay.name as academic_year_name
            FROM fee_structures fs
            JOIN classes c ON fs.class_id = c.id
            JOIN terms t ON fs.term_id = t.id
            JOIN academic_years ay ON fs.academic_year_id = ay.id
            WHERE fs.school_id = :school_id
            ORDER BY c.level_order ASC, fs.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $structures = $stmt->fetchAll();

        foreach ($structures as &$s) {
            $stmtItems = $this->db->prepare("
                SELECT fsi.*, vh.name as vote_head_name, vh.account_code
                FROM fee_structure_items fsi
                JOIN vote_heads vh ON fsi.vote_head_id = vh.id
                WHERE fsi.fee_structure_id = :fs_id
            ");
            $stmtItems->execute([':fs_id' => $s['id']]);
            $s['items'] = $stmtItems->fetchAll();
        }

        echo json_encode(['status' => 'success', 'data' => $structures]);
    }

    public function invoices(): void
    {
        $schoolId = Database::getTenantId();
        $termId = $_GET['term_id'] ?? null;
        $classId = $_GET['class_id'] ?? null;

        $sql = "
            SELECT fi.*, s.first_name, s.last_name, s.admission_number, s.gender, s.boarding_status as student_boarding_status, 
                   c.name as class_name,
                   t.name as term_name, ay.name as academic_year_name, 
                   fs.title as structure_title, fs.boarding_status as structure_boarding_status,
                   g.name as guardian_name, g.phone as guardian_phone
            FROM fee_invoices fi
            JOIN students s ON fi.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            JOIN terms t ON fi.term_id = t.id
            JOIN academic_years ay ON fi.academic_year_id = ay.id
            LEFT JOIN fee_structures fs ON fi.fee_structure_id = fs.id
            LEFT JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = TRUE
            LEFT JOIN guardians g ON sg.guardian_id = g.id
            WHERE fi.school_id = :school_id
        ";
        $params = [':school_id' => $schoolId];

        if (!empty($termId)) {
            $sql .= " AND fi.term_id = :term_id";
            $params[':term_id'] = $termId;
        }
        if (!empty($classId)) {
            $sql .= " AND s.class_id = :class_id";
            $params[':class_id'] = $classId;
        }

        $sql .= " ORDER BY fi.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $invoices = $stmt->fetchAll();

        foreach ($invoices as &$inv) {
            // Fetch fee breakdown items for this invoice
            $inv['items'] = [];
            if (!empty($inv['fee_structure_id'])) {
                $stmtItems = $this->db->prepare("
                    SELECT fsi.amount, fsi.is_optional, vh.name as vote_head_name, vh.account_code
                    FROM fee_structure_items fsi
                    JOIN vote_heads vh ON fsi.vote_head_id = vh.id
                    WHERE fsi.fee_structure_id = :fs_id
                    ORDER BY vh.name ASC
                ");
                $stmtItems->execute([':fs_id' => $inv['fee_structure_id']]);
                $inv['items'] = $stmtItems->fetchAll();
            }

            // Student balance info
            $bal = $this->ledgerService->getStudentBalance($schoolId, $inv['student_id']);
            $inv['student_total_billed'] = $bal['total_billed'] ?? $inv['total_billed'];
            $inv['student_total_paid'] = $bal['total_paid'] ?? 0;
            $inv['student_balance'] = $bal['balance'] ?? $inv['total_billed'];
        }

        echo json_encode(['status' => 'success', 'data' => $invoices]);
    }

    public function create(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $title = trim($input['title'] ?? '');
        $classId = trim($input['class_id'] ?? '');
        $termId = trim($input['term_id'] ?? '');
        $yearId = trim($input['academic_year_id'] ?? '');
        $boardingStatus = strtoupper(trim($input['boarding_status'] ?? 'ALL'));
        if (!in_array($boardingStatus, ['ALL', 'DAY', 'BOARDING'])) {
            $boardingStatus = 'ALL';
        }
        $items = $input['items'] ?? [];
        $autoInvoice = !empty($input['auto_invoice']);

        if (empty($classId)) {
            $classId = $this->db->query("SELECT id FROM classes ORDER BY level_order ASC LIMIT 1")->fetchColumn();
        }
        if (empty($termId)) {
            $termId = $this->db->query("SELECT id FROM terms WHERE is_current = TRUE LIMIT 1")->fetchColumn()
                   ?: $this->db->query("SELECT id FROM terms LIMIT 1")->fetchColumn();
        }
        if (empty($yearId)) {
            $yearId = $this->db->query("SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1")->fetchColumn()
                   ?: $this->db->query("SELECT id FROM academic_years LIMIT 1")->fetchColumn();
        }

        if (empty($title)) {
            $className = $this->db->prepare("SELECT name FROM classes WHERE id = :id");
            $className->execute([':id' => $classId]);
            $cName = $className->fetchColumn() ?: 'Form 1';
            $categoryLabel = $boardingStatus === 'DAY' ? ' - Day Scholar' : ($boardingStatus === 'BOARDING' ? ' - Boarding' : '');
            $title = "{$cName} Term Fee Structure{$categoryLabel}";
        }

        $total = 0.0;
        foreach ($items as $item) {
            $total += (float)($item['amount'] ?? 0);
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO fee_structures (school_id, academic_year_id, term_id, class_id, title, boarding_status, total_amount)
                VALUES (:school_id, :ay_id, :term_id, :class_id, :title, :boarding_status, :total)
                RETURNING id
            ");
            $stmt->execute([
                ':school_id'       => $schoolId,
                ':ay_id'           => $yearId,
                ':term_id'         => $termId,
                ':class_id'        => $classId,
                ':title'           => $title,
                ':boarding_status' => $boardingStatus,
                ':total'           => $total
            ]);
            $structureId = $stmt->fetchColumn();

            $stmtItem = $this->db->prepare("
                INSERT INTO fee_structure_items (fee_structure_id, vote_head_id, amount, is_optional)
                VALUES (:fs_id, :vh_id, :amount, :is_optional)
            ");
            foreach ($items as $item) {
                if ((float)($item['amount'] ?? 0) <= 0) continue;
                $stmtItem->execute([
                    ':fs_id'       => $structureId,
                    ':vh_id'       => $item['vote_head_id'],
                    ':amount'      => (float)$item['amount'],
                    ':is_optional' => !empty($item['is_optional']) ? 'true' : 'false'
                ]);
            }

            // Auto-invoice matching active students in this class if requested
            $invoicedCount = 0;
            if ($autoInvoice) {
                $sqlStudents = "
                    SELECT id, admission_number FROM students 
                    WHERE school_id = :school_id AND class_id = :class_id AND status = 'ACTIVE'
                ";
                if ($boardingStatus === 'DAY') {
                    $sqlStudents .= " AND (boarding_status = 'DAY' OR boarding_status IS NULL)";
                } elseif ($boardingStatus === 'BOARDING') {
                    $sqlStudents .= " AND boarding_status = 'BOARDING'";
                }

                $stmtStudents = $this->db->prepare($sqlStudents);
                $stmtStudents->execute([':school_id' => $schoolId, ':class_id' => $classId]);
                $students = $stmtStudents->fetchAll();
                $dueDate = date('Y-m-d', strtotime('+30 days'));

                foreach ($students as $student) {
                    $stmtCheck = $this->db->prepare("
                        SELECT id FROM fee_invoices 
                        WHERE student_id = :student_id AND term_id = :term_id AND school_id = :school_id
                    ");
                    $stmtCheck->execute([
                        ':student_id' => $student['id'],
                        ':term_id'    => $termId,
                        ':school_id'  => $schoolId
                    ]);
                    if ($stmtCheck->fetch()) continue;

                    $invNo = 'INV-' . date('Y') . '-' . sprintf('%04d', rand(1000, 9999));
                    $stmtInv = $this->db->prepare("
                        INSERT INTO fee_invoices (
                            school_id, invoice_number, student_id, academic_year_id, term_id,
                            fee_structure_id, total_billed, due_date, status
                        ) VALUES (
                            :school_id, :inv_no, :student_id, :ay_id, :term_id,
                            :fs_id, :amount, :due_date, 'ISSUED'
                        )
                    ");
                    $stmtInv->execute([
                        ':school_id' => $schoolId,
                        ':inv_no'    => $invNo,
                        ':student_id'=> $student['id'],
                        ':ay_id'     => $yearId,
                        ':term_id'   => $termId,
                        ':fs_id'     => $structureId,
                        ':amount'    => $total,
                        ':due_date'  => $dueDate
                    ]);

                    $this->ledgerService->recordEntry(
                        $schoolId,
                        $student['id'],
                        'INVOICE_CHARGE',
                        $total,
                        0.00,
                        "Fee Invoice {$invNo} ({$title})",
                        $termId
                    );
                    $invoicedCount++;
                }
            }

            $this->db->commit();

            echo json_encode([
                'status'  => 'success',
                'message' => 'Fee structure created successfully' . ($invoicedCount > 0 ? " and issued {$invoicedCount} invoices" : ''),
                'data'    => ['id' => $structureId, 'title' => $title, 'boarding_status' => $boardingStatus, 'total_amount' => $total]
            ]);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function update(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $title = trim($input['title'] ?? '');
        $classId = trim($input['class_id'] ?? '');
        $termId = trim($input['term_id'] ?? '');
        $yearId = trim($input['academic_year_id'] ?? '');
        $boardingStatus = strtoupper(trim($input['boarding_status'] ?? 'ALL'));
        if (!in_array($boardingStatus, ['ALL', 'DAY', 'BOARDING'])) {
            $boardingStatus = 'ALL';
        }
        $items = $input['items'] ?? [];

        $total = 0.0;
        foreach ($items as $item) {
            $total += (float)($item['amount'] ?? 0);
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                UPDATE fee_structures 
                SET title = :title, class_id = :class_id, term_id = :term_id, 
                    boarding_status = :boarding_status,
                    academic_year_id = COALESCE(:ay_id, academic_year_id), total_amount = :total
                WHERE id = :id AND school_id = :school_id
            ");
            $stmt->execute([
                ':title'           => $title,
                ':class_id'        => $classId,
                ':term_id'         => $termId,
                ':boarding_status' => $boardingStatus,
                ':ay_id'           => !empty($yearId) ? $yearId : null,
                ':total'           => $total,
                ':id'              => $id,
                ':school_id'       => $schoolId
            ]);

            $delItems = $this->db->prepare("DELETE FROM fee_structure_items WHERE fee_structure_id = :fs_id");
            $delItems->execute([':fs_id' => $id]);

            $stmtItem = $this->db->prepare("
                INSERT INTO fee_structure_items (fee_structure_id, vote_head_id, amount, is_optional)
                VALUES (:fs_id, :vh_id, :amount, :is_optional)
            ");
            foreach ($items as $item) {
                if ((float)($item['amount'] ?? 0) <= 0) continue;
                $stmtItem->execute([
                    ':fs_id'       => $id,
                    ':vh_id'       => $item['vote_head_id'],
                    ':amount'      => (float)$item['amount'],
                    ':is_optional' => !empty($item['is_optional']) ? 'true' : 'false'
                ]);
            }

            // Sync all existing issued invoices and student ledger entries for this fee structure
            $stmtFetchInvoices = $this->db->prepare("SELECT id, student_id, invoice_number FROM fee_invoices WHERE fee_structure_id = :fs_id AND school_id = :school_id");
            $stmtFetchInvoices->execute([':fs_id' => $id, ':school_id' => $schoolId]);
            $existingInvoices = $stmtFetchInvoices->fetchAll();

            if (!empty($existingInvoices)) {
                $stmtUpdateInv = $this->db->prepare("UPDATE fee_invoices SET total_billed = :total WHERE fee_structure_id = :fs_id AND school_id = :school_id");
                $stmtUpdateInv->execute([':total' => $total, ':fs_id' => $id, ':school_id' => $schoolId]);

                foreach ($existingInvoices as $inv) {
                    $stmtUpdateLedger = $this->db->prepare("
                        UPDATE transaction_ledger 
                        SET debit_amount = :total, description = :desc 
                        WHERE student_id = :student_id AND term_id = :term_id AND entry_type = 'INVOICE_CHARGE'
                    ");
                    $stmtUpdateLedger->execute([
                        ':total'      => $total,
                        ':desc'       => "Fee Invoice {$inv['invoice_number']} ({$title})",
                        ':student_id' => $inv['student_id'],
                        ':term_id'    => $termId
                    ]);
                }
            }

            $this->db->commit();
            echo json_encode([
                'status'  => 'success',
                'message' => 'Fee structure updated successfully and student ledgers synchronized',
                'data'    => ['id' => $id, 'title' => $title, 'boarding_status' => $boardingStatus, 'total_amount' => $total]
            ]);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function delete(string $id): void
    {
        $schoolId = Database::getTenantId();

        try {
            $stmt = $this->db->prepare("DELETE FROM fee_structures WHERE id = :id AND school_id = :school_id");
            $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
            echo json_encode(['status' => 'success', 'message' => 'Fee structure deleted successfully']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function voteHeads(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("SELECT * FROM vote_heads WHERE school_id = :school_id ORDER BY name ASC");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
    }

    /**
     * Bulk Invoicing: Issue Term Fee Invoices to all active students matching structure's boarding category
     */
    public function bulkInvoice(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $feeStructureId = trim($input['fee_structure_id'] ?? '');
        $dueDate        = trim($input['due_date'] ?? date('Y-m-d', strtotime('+30 days')));

        if (empty($feeStructureId)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Fee structure ID is required']);
            return;
        }

        // Fetch structure details
        $stmtFs = $this->db->prepare("SELECT * FROM fee_structures WHERE id = :id AND school_id = :school_id");
        $stmtFs->execute([':id' => $feeStructureId, ':school_id' => $schoolId]);
        $structure = $stmtFs->fetch();

        if (!$structure) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Fee structure not found']);
            return;
        }

        // Fetch students in this class matching boarding status
        $sqlStudents = "
            SELECT id, admission_number, boarding_status FROM students 
            WHERE school_id = :school_id AND class_id = :class_id AND status = 'ACTIVE'
        ";
        $boardingStatus = $structure['boarding_status'] ?? 'ALL';
        if ($boardingStatus === 'DAY') {
            $sqlStudents .= " AND (boarding_status = 'DAY' OR boarding_status IS NULL)";
        } elseif ($boardingStatus === 'BOARDING') {
            $sqlStudents .= " AND boarding_status = 'BOARDING'";
        }

        $stmtStudents = $this->db->prepare($sqlStudents);
        $stmtStudents->execute([':school_id' => $schoolId, ':class_id' => $structure['class_id']]);
        $students = $stmtStudents->fetchAll();

        $invoicedCount = 0;
        $totalAmount = (float)$structure['total_amount'];

        $this->db->beginTransaction();
        try {
            foreach ($students as $student) {
                // Check if already invoiced for this term
                $stmtCheck = $this->db->prepare("
                    SELECT id FROM fee_invoices 
                    WHERE student_id = :student_id AND term_id = :term_id AND school_id = :school_id
                ");
                $stmtCheck->execute([
                    ':student_id' => $student['id'],
                    ':term_id'    => $structure['term_id'],
                    ':school_id'  => $schoolId
                ]);
                if ($stmtCheck->fetch()) {
                    continue; // Skip already billed
                }

                $invNo = 'INV-' . date('Y') . '-' . sprintf('%04d', rand(1000, 9999));

                $stmtInv = $this->db->prepare("
                    INSERT INTO fee_invoices (
                        school_id, invoice_number, student_id, academic_year_id, term_id,
                        fee_structure_id, total_billed, due_date, status
                    ) VALUES (
                        :school_id, :inv_no, :student_id, :ay_id, :term_id,
                        :fs_id, :amount, :due_date, 'ISSUED'
                    ) RETURNING id
                ");
                $stmtInv->execute([
                    ':school_id'   => $schoolId,
                    ':inv_no'      => $invNo,
                    ':student_id'  => $student['id'],
                    ':ay_id'       => $structure['academic_year_id'],
                    ':term_id'     => $structure['term_id'],
                    ':fs_id'       => $feeStructureId,
                    ':amount'      => $totalAmount,
                    ':due_date'    => $dueDate
                ]);

                // Append to Immutable Financial Ledger (Debit Entry)
                $this->ledgerService->recordEntry(
                    $schoolId,
                    $student['id'],
                    'INVOICE_CHARGE',
                    $totalAmount,
                    0.00,
                    "Fee Invoice {$invNo} ({$structure['title']})",
                    $structure['term_id']
                );

                $invoicedCount++;
            }

            $this->db->commit();
            echo json_encode([
                'status'  => 'success',
                'message' => "Successfully issued {$invoicedCount} invoices to " . ($boardingStatus === 'ALL' ? 'all' : strtolower($boardingStatus)) . " learners in this class.",
                'count'   => $invoicedCount
            ]);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}