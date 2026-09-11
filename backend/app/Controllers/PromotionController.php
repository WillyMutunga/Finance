<?php

namespace App\Controllers;

use App\Database;
use App\Services\LedgerService;
use PDO;

class PromotionController
{
    private PDO $db;
    private LedgerService $ledgerService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->ledgerService = new LedgerService();
    }

    public function getPromotions(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT ap.*, s.first_name, s.last_name, s.admission_number,
                   fc.name as from_class_name, tc.name as to_class_name,
                   fay.name as from_year_name, tay.name as to_year_name
            FROM academic_promotions ap
            JOIN students s ON ap.student_id = s.id
            JOIN classes fc ON ap.from_class_id = fc.id
            LEFT JOIN classes tc ON ap.to_class_id = tc.id
            JOIN academic_years fay ON ap.from_academic_year_id = fay.id
            JOIN academic_years tay ON ap.to_academic_year_id = tay.id
            WHERE ap.school_id = :school_id
            ORDER BY ap.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $promotions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $promotions]);
    }

    public function previewPromotion(): void
    {
        $schoolId = Database::getTenantId();
        $fromClassId = $_GET['from_class_id'] ?? null;

        $sql = "
            SELECT s.id as student_id, s.first_name, s.last_name, s.admission_number, s.boarding_status,
                   c.id as current_class_id, c.name as current_class_name, c.level_order,
                   COALESCE((SELECT SUM(debit_amount - credit_amount) FROM transaction_ledger WHERE student_id = s.id), 0) as current_balance
            FROM students s
            JOIN classes c ON s.class_id = c.id
            WHERE s.school_id = :school_id AND s.status = 'ACTIVE'
        ";
        if ($fromClassId) {
            $sql .= " AND s.class_id = :from_class_id";
        }
        $sql .= " ORDER BY c.level_order ASC, s.last_name ASC";

        $stmt = $this->db->prepare($sql);
        $params = [':school_id' => $schoolId];
        if ($fromClassId) $params[':from_class_id'] = $fromClassId;
        $stmt->execute($params);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch all classes for progression mapping
        $stmtClasses = $this->db->prepare("SELECT id, name, level_order FROM classes WHERE school_id = :school_id ORDER BY level_order ASC");
        $stmtClasses->execute([':school_id' => $schoolId]);
        $classes = $stmtClasses->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'data'   => [
                'students' => $students,
                'classes'  => $classes
            ]
        ]);
    }

    public function executePromotion(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $fromYearId = $input['from_academic_year_id'] ?? null;
        $toYearId = $input['to_academic_year_id'] ?? null;
        $fromTermId = $input['from_term_id'] ?? null;
        $toTermId = $input['to_term_id'] ?? null;
        $promotions = $input['promotions'] ?? []; // Array of { student_id, from_class_id, to_class_id, action_type }

        if (!$fromYearId || !$toYearId || empty($promotions)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing required promotion parameters']);
            return;
        }

        $this->db->beginTransaction();
        try {
            $stmtInsert = $this->db->prepare("
                INSERT INTO academic_promotions (
                    school_id, from_academic_year_id, to_academic_year_id, from_term_id, to_term_id,
                    student_id, from_class_id, to_class_id, action_type, carried_forward_balance
                ) VALUES (
                    :school_id, :from_year_id, :to_year_id, :from_term_id, :to_term_id,
                    :student_id, :from_class_id, :to_class_id, :action_type, :carried_balance
                )
            ");

            $stmtUpdateStudent = $this->db->prepare("UPDATE students SET class_id = :class_id, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND school_id = :school_id");
            $stmtGraduateStudent = $this->db->prepare("UPDATE students SET status = 'ALUMNI', updated_at = CURRENT_TIMESTAMP WHERE id = :id AND school_id = :school_id");

            $promotedCount = 0;
            $graduatedCount = 0;

            foreach ($promotions as $p) {
                $studentId = $p['student_id'];
                $fromClassId = $p['from_class_id'];
                $toClassId = $p['to_class_id'] ?? null;
                $action = $p['action_type'] ?? 'PROMOTED';

                // Calculate carried forward balance
                $stmtBal = $this->db->prepare("SELECT COALESCE(SUM(debit_amount - credit_amount), 0) FROM transaction_ledger WHERE student_id = :student_id");
                $stmtBal->execute([':student_id' => $studentId]);
                $carriedBal = (float)$stmtBal->fetchColumn();

                $stmtInsert->execute([
                    ':school_id'       => $schoolId,
                    ':from_year_id'    => $fromYearId,
                    ':to_year_id'      => $toYearId,
                    ':from_term_id'    => $fromTermId,
                    ':to_term_id'      => $toTermId,
                    ':student_id'      => $studentId,
                    ':from_class_id'   => $fromClassId,
                    ':to_class_id'     => $toClassId,
                    ':action_type'     => $action,
                    ':carried_balance' => $carriedBal
                ]);

                if ($action === 'PROMOTED' && $toClassId) {
                    $stmtUpdateStudent->execute([':class_id' => $toClassId, ':id' => $studentId, ':school_id' => $schoolId]);
                    $promotedCount++;
                } elseif ($action === 'GRADUATED') {
                    $stmtGraduateStudent->execute([':id' => $studentId, ':school_id' => $schoolId]);
                    $graduatedCount++;
                }
            }

            $this->db->commit();

            echo json_encode([
                'status'  => 'success',
                'message' => "Promotion completed: {$promotedCount} students promoted, {$graduatedCount} graduated.",
                'data'    => ['promoted' => $promotedCount, 'graduated' => $graduatedCount]
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}