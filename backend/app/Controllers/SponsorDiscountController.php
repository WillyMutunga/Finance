<?php

namespace App\Controllers;

use App\Database;
use PDO;

class SponsorDiscountController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // --- SIBLING DISCOUNT RULES ---
    public function getSiblingRules(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT sdr.*, vh.name as vote_head_name
            FROM sibling_discount_rules sdr
            LEFT JOIN vote_heads vh ON sdr.vote_head_id = vh.id
            WHERE sdr.school_id = :school_id
            ORDER BY sdr.child_order ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function createSiblingRule(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $stmt = $this->db->prepare("
            INSERT INTO sibling_discount_rules (school_id, name, child_order, discount_type, discount_value, vote_head_id, is_active)
            VALUES (:school_id, :name, :child_order, :discount_type, :discount_value, :vote_head_id, :is_active)
            RETURNING id
        ");
        $stmt->execute([
            ':school_id'       => $schoolId,
            ':name'            => $input['name'] ?? 'Sibling Discount',
            ':child_order'     => (int)($input['child_order'] ?? 2),
            ':discount_type'   => $input['discount_type'] ?? 'PERCENTAGE',
            ':discount_value'  => (float)($input['discount_value'] ?? 10.0),
            ':vote_head_id'    => $input['vote_head_id'] ?? null,
            ':is_active'       => isset($input['is_active']) ? (bool)$input['is_active'] : true
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Sibling discount rule created', 'data' => ['id' => $stmt->fetchColumn()]]);
    }

    public function detectSiblings(): void
    {
        $schoolId = Database::getTenantId();
        // Group students by common guardian phone or guardian name
        $stmt = $this->db->prepare("
            SELECT g.phone as guardian_phone, g.name as guardian_name, COUNT(s.id) as sibling_count,
                   json_agg(json_build_object(
                       'student_id', s.id,
                       'admission_number', s.admission_number,
                       'name', s.first_name || ' ' || s.last_name,
                       'class_name', c.name,
                       'dob', s.date_of_birth
                   ) ORDER BY s.date_of_birth ASC NULLS LAST, s.created_at ASC) as children
            FROM guardians g
            JOIN student_guardians sg ON g.id = sg.guardian_id
            JOIN students s ON sg.student_id = s.id AND s.status = 'ACTIVE'
            JOIN classes c ON s.class_id = c.id
            WHERE s.school_id = :school_id
            GROUP BY g.phone, g.name
            HAVING COUNT(s.id) > 1
            ORDER BY sibling_count DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $families = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $families]);
    }

    // --- SPONSOR MANAGEMENT ---
    public function getSponsors(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT s.*, 
                   (SELECT COUNT(DISTINCT student_id) FROM sponsor_allocations WHERE sponsor_id = s.id) as sponsored_students_count,
                   (SELECT COALESCE(SUM(allocated_amount), 0) FROM sponsor_allocations WHERE sponsor_id = s.id) as total_allocated,
                   (SELECT COALESCE(SUM(disbursed_amount), 0) FROM sponsor_allocations WHERE sponsor_id = s.id) as total_disbursed
            FROM sponsors s
            WHERE s.school_id = :school_id
            ORDER BY s.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function createSponsor(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $stmt = $this->db->prepare("
            INSERT INTO sponsors (school_id, name, code, contact_person, phone, email, address)
            VALUES (:school_id, :name, :code, :contact_person, :phone, :email, :address)
            RETURNING id
        ");
        $stmt->execute([
            ':school_id'       => $schoolId,
            ':name'            => $input['name'] ?? 'Sponsor Foundation',
            ':code'            => $input['code'] ?? strtoupper(substr($input['name'] ?? 'SPON', 0, 4)),
            ':contact_person'  => $input['contact_person'] ?? null,
            ':phone'           => $input['phone'] ?? null,
            ':email'           => $input['email'] ?? null,
            ':address'         => $input['address'] ?? null
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Sponsor added successfully', 'data' => ['id' => $stmt->fetchColumn()]]);
    }

    public function getAllocations(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT sa.*, sp.name as sponsor_name, sp.code as sponsor_code,
                   st.first_name, st.last_name, st.admission_number, c.name as class_name,
                   t.name as term_name, ay.name as year_name
            FROM sponsor_allocations sa
            JOIN sponsors sp ON sa.sponsor_id = sp.id
            JOIN students st ON sa.student_id = st.id
            JOIN classes c ON st.class_id = c.id
            LEFT JOIN terms t ON sa.term_id = t.id
            LEFT JOIN academic_years ay ON sa.academic_year_id = ay.id
            WHERE sa.school_id = :school_id
            ORDER BY sa.created_at DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function createAllocation(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $stmt = $this->db->prepare("
            INSERT INTO sponsor_allocations (
                school_id, sponsor_id, student_id, academic_year_id, term_id, allocated_amount, claim_reference, notes
            ) VALUES (
                :school_id, :sponsor_id, :student_id, :year_id, :term_id, :amount, :claim_ref, :notes
            ) RETURNING id
        ");
        $stmt->execute([
            ':school_id'   => $schoolId,
            ':sponsor_id'  => $input['sponsor_id'],
            ':student_id'  => $input['student_id'],
            ':year_id'     => $input['academic_year_id'] ?? null,
            ':term_id'     => $input['term_id'] ?? null,
            ':amount'      => (float)($input['allocated_amount'] ?? 0),
            ':claim_ref'   => $input['claim_reference'] ?? 'CLM-' . strtoupper(bin2hex(random_bytes(3))),
            ':notes'       => $input['notes'] ?? null
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Sponsor allocation created', 'data' => ['id' => $stmt->fetchColumn()]]);
    }
}