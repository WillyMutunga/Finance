<?php

namespace App\Controllers;

use App\Database;
use PDO;

class ConfigController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * 1. Academic Years
     */
    public function getAcademicYears(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("SELECT * FROM academic_years WHERE school_id = :school_id ORDER BY start_date DESC");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
    }

    public function createAcademicYear(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim($input['name'] ?? (isset($input['start_date']) ? date('Y', strtotime($input['start_date'])) : ''));
        $startDate = $input['start_date'] ?? '';
        $endDate = $input['end_date'] ?? '';

        if (empty($name) || empty($startDate) || empty($endDate)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Start date and End date are required']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO academic_years (school_id, name, start_date, end_date, is_current)
            VALUES (:school_id, :name, :start_date, :end_date, TRUE)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'   => $schoolId,
            ':name'        => $name,
            ':start_date'  => $startDate,
            ':end_date'    => $endDate
        ]);
        $created = $stmt->fetch();

        echo json_encode(['status' => 'success', 'data' => $created, 'message' => 'Academic Year created successfully']);
    }

    /**
     * 2. Terms & Semesters
     */
    public function getTerms(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT t.*, ay.name as academic_year_name
            FROM terms t
            JOIN academic_years ay ON t.academic_year_id = ay.id
            WHERE t.school_id = :school_id
            ORDER BY t.start_date ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
    }

    public function createTerm(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim($input['name'] ?? '');
        $startDate = $input['start_date'] ?? '';
        $endDate = $input['end_date'] ?? '';
        $academicYearId = $input['academic_year_id'] ?? null;
        $isCurrent = !empty($input['is_current']);

        if (empty($name) || empty($startDate) || empty($endDate)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Term Name, Start Date, and End Date are required']);
            return;
        }

        // If no academic_year_id provided, find or create one based on start_date year
        if (empty($academicYearId)) {
            $yearName = date('Y', strtotime($startDate));
            $stmtAy = $this->db->prepare("SELECT id FROM academic_years WHERE school_id = :school_id AND name = :name");
            $stmtAy->execute([':school_id' => $schoolId, ':name' => $yearName]);
            $academicYearId = $stmtAy->fetchColumn();

            if (!$academicYearId) {
                $stmtNewAy = $this->db->prepare("
                    INSERT INTO academic_years (school_id, name, start_date, end_date, is_current)
                    VALUES (:school_id, :name, :start_date, :end_date, TRUE)
                    RETURNING id
                ");
                $stmtNewAy->execute([
                    ':school_id'   => $schoolId,
                    ':name'        => $yearName,
                    ':start_date'  => date('Y-01-01', strtotime($startDate)),
                    ':end_date'    => date('Y-12-31', strtotime($startDate))
                ]);
                $academicYearId = $stmtNewAy->fetchColumn();
            }
        }

        if ($isCurrent) {
            $this->db->prepare("UPDATE terms SET is_current = FALSE WHERE school_id = :school_id")->execute([':school_id' => $schoolId]);
        }

        $stmt = $this->db->prepare("
            INSERT INTO terms (school_id, academic_year_id, name, start_date, end_date, is_current)
            VALUES (:school_id, :academic_year_id, :name, :start_date, :end_date, :is_current)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'         => $schoolId,
            ':academic_year_id'  => $academicYearId,
            ':name'              => $name,
            ':start_date'        => $startDate,
            ':end_date'          => $endDate,
            ':is_current'        => $isCurrent ? 'true' : 'false'
        ]);
        $created = $stmt->fetch();

        echo json_encode(['status' => 'success', 'data' => $created, 'message' => "{$name} created successfully"]);
    }

    public function setActiveTerm(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $termId = $input['term_id'] ?? '';

        if (empty($termId)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Term ID is required']);
            return;
        }

        $this->db->prepare("UPDATE terms SET is_current = FALSE WHERE school_id = :school_id")->execute([':school_id' => $schoolId]);
        $stmt = $this->db->prepare("UPDATE terms SET is_current = TRUE WHERE id = :id AND school_id = :school_id RETURNING *");
        $stmt->execute([':id' => $termId, ':school_id' => $schoolId]);
        $updated = $stmt->fetch();

        echo json_encode(['status' => 'success', 'data' => $updated, 'message' => 'Active term updated successfully']);
    }

    /**
     * 3. Classes & Streams
     */
    public function getClasses(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT c.*, 
                   COUNT(DISTINCT s.id) as student_count,
                   json_agg(DISTINCT jsonb_build_object('id', st.id, 'name', st.name)) FILTER (WHERE st.id IS NOT NULL) as streams
            FROM classes c
            LEFT JOIN streams st ON c.id = st.class_id
            LEFT JOIN students s ON c.id = s.class_id AND s.status = 'ACTIVE'
            WHERE c.school_id = :school_id
            GROUP BY c.id
            ORDER BY c.level_order ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $classes = $stmt->fetchAll();

        foreach ($classes as &$c) {
            if (is_string($c['streams'])) {
                $c['streams'] = json_decode($c['streams'], true) ?: [];
            } elseif (!$c['streams']) {
                $c['streams'] = [];
            }
        }

        echo json_encode(['status' => 'success', 'data' => $classes]);
    }

    public function createClass(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim($input['name'] ?? '');
        $levelOrder = (int)($input['level_order'] ?? 1);

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Class Name is required']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO classes (school_id, name, level_order)
            VALUES (:school_id, :name, :level_order)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'   => $schoolId,
            ':name'        => $name,
            ':level_order' => $levelOrder
        ]);
        $created = $stmt->fetch();
        $created['streams'] = [];
        $created['student_count'] = 0;

        // Auto-create default stream "East" if requested
        if (!empty($input['default_stream'])) {
            $streamStmt = $this->db->prepare("
                INSERT INTO streams (school_id, class_id, name)
                VALUES (:school_id, :class_id, :name)
                RETURNING id, name
            ");
            $streamStmt->execute([
                ':school_id' => $schoolId,
                ':class_id'  => $created['id'],
                ':name'      => trim($input['default_stream'])
            ]);
            $created['streams'][] = $streamStmt->fetch();
        }

        echo json_encode(['status' => 'success', 'data' => $created, 'message' => "Class {$name} created successfully"]);
    }

    public function createStream(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $classId = $input['class_id'] ?? '';
        $name = trim($input['name'] ?? '');

        if (empty($classId) || empty($name)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Class ID and Stream Name are required']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO streams (school_id, class_id, name)
            VALUES (:school_id, :class_id, :name)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':class_id'  => $classId,
            ':name'      => $name
        ]);
        $created = $stmt->fetch();

        echo json_encode(['status' => 'success', 'data' => $created, 'message' => "Stream {$name} added successfully"]);
    }

    /**
     * 4. School Profile & Letterhead
     */
    public function getSchoolProfile(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("SELECT * FROM schools WHERE id = :id");
        $stmt->execute([':id' => $schoolId]);
        $school = $stmt->fetch();

        if (!$school) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'School profile not found']);
            return;
        }

        echo json_encode(['status' => 'success', 'data' => $school]);
    }

    public function updateSchoolProfile(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim($input['name'] ?? '');
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'School Name is required']);
            return;
        }

        $code = trim($input['code'] ?? 'NDU001');
        $registrationNumber = trim($input['registration_number'] ?? '');
        $motto = trim($input['motto'] ?? '');
        $address = trim($input['address'] ?? '');
        $postalAddress = trim($input['postal_address'] ?? '');
        $county = trim($input['county'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $email = trim($input['email'] ?? '');
        $currency = trim($input['currency'] ?? 'KES');
        $mpesaPaybill = trim($input['mpesa_paybill'] ?? '');
        $bankName = trim($input['bank_name'] ?? '');
        $bankAccountName = trim($input['bank_account_name'] ?? '');
        $bankAccountNumber = trim($input['bank_account_number'] ?? '');
        $bankBranch = trim($input['bank_branch'] ?? '');
        $smsSenderId = trim($input['sms_sender_id'] ?? 'SCHOOLFIN');
        $logoUrl = trim($input['logo_url'] ?? '');

        $stmt = $this->db->prepare("
            UPDATE schools
            SET 
                name = :name,
                code = :code,
                registration_number = :registration_number,
                motto = :motto,
                address = :address,
                postal_address = :postal_address,
                county = :county,
                phone = :phone,
                email = :email,
                currency = :currency,
                mpesa_paybill = :mpesa_paybill,
                bank_name = :bank_name,
                bank_account_name = :bank_account_name,
                bank_account_number = :bank_account_number,
                bank_branch = :bank_branch,
                sms_sender_id = :sms_sender_id,
                logo_url = :logo_url,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
            RETURNING *
        ");

        $stmt->execute([
            ':id'                  => $schoolId,
            ':name'                => $name,
            ':code'                => $code,
            ':registration_number' => $registrationNumber,
            ':motto'               => $motto,
            ':address'             => $address,
            ':postal_address'      => $postalAddress,
            ':county'              => $county,
            ':phone'               => $phone,
            ':email'               => $email,
            ':currency'            => $currency,
            ':mpesa_paybill'       => $mpesaPaybill,
            ':bank_name'           => $bankName,
            ':bank_account_name'   => $bankAccountName,
            ':bank_account_number' => $bankAccountNumber,
            ':bank_branch'         => $bankBranch,
            ':sms_sender_id'       => $smsSenderId,
            ':logo_url'            => $logoUrl
        ]);

        $updated = $stmt->fetch();

        echo json_encode([
            'status'  => 'success',
            'data'    => $updated,
            'message' => 'School profile and letterhead updated successfully'
        ]);
    }
}
