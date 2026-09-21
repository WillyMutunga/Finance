<?php

namespace App\Controllers;

use App\Database;
use PDO;

class SchoolController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * GET /admin/schools
     * List all onboarded schools with metrics
     */
    public function listSchools(): void
    {
        try {
            $stmt = $this->db->query("
                SELECT s.*,
                       (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id) AS student_count,
                       (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id) AS user_count
                FROM schools s
                ORDER BY s.created_at ASC
            ");
            $schools = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 'success',
                'data' => $schools,
                'total' => count($schools)
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /admin/schools/:id
     */
    public function getSchool(string $id): void
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.*,
                       (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id) AS student_count,
                       (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id) AS user_count
                FROM schools s
                WHERE s.id = :id
            ");
            $stmt->execute([':id' => $id]);
            $school = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$school) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'School not found.']);
                return;
            }

            echo json_encode(['status' => 'success', 'data' => $school]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /admin/schools
     * Onboard a new school with auto-seeded Voteheads, Academic Year, and initial School Admin
     */
    public function createSchool(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];

            $name        = trim($input['name'] ?? '');
            $rawSlug     = trim($input['slug'] ?? $input['subdomain'] ?? '');
            $county      = trim($input['county'] ?? '');
            $code        = trim($input['code'] ?? $input['registration_number'] ?? '');
            $motto       = trim($input['motto'] ?? 'Excellence and Integrity');
            $currency    = trim($input['currency'] ?? 'KES');
            $paybill     = trim($input['mpesa_paybill'] ?? '');
            $email       = trim($input['email'] ?? '');
            $phone       = trim($input['phone'] ?? '');
            $address     = trim($input['address'] ?? '');

            // Initial School Admin Info
            $adminName     = trim($input['admin_name'] ?? 'School Principal');
            $adminUserPart = trim($input['admin_username'] ?? 'admin');
            $adminEmail    = trim($input['admin_email'] ?? '');
            $adminPassword = trim($input['admin_password'] ?? 'Admin@2026!');
            $adminPhone    = trim($input['admin_phone'] ?? $phone);

            if (empty($name)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'School Name is required.']);
                return;
            }

            // Generate slug if empty: e.g. "Machakos Boys High School" -> "machakos"
            if (empty($rawSlug)) {
                $words = preg_split('/\s+/', strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $name)));
                $rawSlug = $words[0] ?: 'school' . rand(100, 999);
            }
            $slug = strtolower(preg_replace('/[^a-z0-9\-]/', '', $rawSlug));

            // Check if slug or name exists
            $checkStmt = $this->db->prepare("SELECT id FROM schools WHERE LOWER(slug) = LOWER(:s) OR LOWER(subdomain) = LOWER(:s) OR LOWER(name) = LOWER(:n)");
            $checkStmt->execute([':s' => $slug, ':n' => $name]);
            if ($checkStmt->fetch()) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => "A school with identifier/slug '{$slug}' or name '{$name}' already exists."]);
                return;
            }

            $this->db->beginTransaction();

            $schoolId = $this->generateUUID();

            // 1. Insert School Record
            $stmt = $this->db->prepare("
                INSERT INTO schools (
                    id, name, slug, subdomain, code, motto, county, currency, mpesa_paybill,
                    email, phone, address, sms_sender_id, is_active, created_at, updated_at
                ) VALUES (
                    :id, :name, :slug, :subdomain, :code, :motto, :county, :currency, :paybill,
                    :email, :phone, :address, :sender_id, true, NOW(), NOW()
                )
            ");
            $senderId = strtoupper(substr($slug, 0, 11));
            $stmt->execute([
                ':id'         => $schoolId,
                ':name'       => $name,
                ':slug'       => $slug,
                ':subdomain'  => $slug,
                ':code'       => $code ?: (string)rand(10000000, 99999999),
                ':motto'      => $motto,
                ':county'     => $county,
                ':currency'   => $currency,
                ':paybill'    => $paybill,
                ':email'      => $email,
                ':phone'      => $phone,
                ':address'    => $address,
                ':sender_id'  => $senderId
            ]);

            // 2. Provision Default Standard MoE Voteheads
            $defaultVoteheads = [
                ['name' => 'Tuition', 'code' => 'TUI', 'is_opt' => false, 'desc' => 'Teaching materials and core academic instruction'],
                ['name' => 'Operations (FDSE)', 'code' => 'OPS', 'is_opt' => false, 'desc' => 'School administration, utilities, and daily operations'],
                ['name' => 'Boarding & Accommodation', 'code' => 'BRD', 'is_opt' => true, 'desc' => 'Hostel accommodation, meals, and welfare'],
                ['name' => 'R.M.I (Repairs & Maintenance)', 'code' => 'RMI', 'is_opt' => true, 'desc' => 'Infrastructure maintenance and campus upkeep'],
                ['name' => 'Activity & Co-Curricular', 'code' => 'ACT', 'is_opt' => true, 'desc' => 'Sports, drama, music, and scouting activities'],
                ['name' => 'Local Transport & Travel (LT&T)', 'code' => 'LTT', 'is_opt' => true, 'desc' => 'School vehicle transport and educational field trips'],
                ['name' => 'Electricity, Water & Conservacy', 'code' => 'EWC', 'is_opt' => true, 'desc' => 'Power, piped water, and environmental sanitation'],
                ['name' => 'Personal Emoluments (PE)', 'code' => 'PE', 'is_opt' => true, 'desc' => 'BOM teachers and support staff payroll'],
                ['name' => 'Development & PTA Fund', 'code' => 'DEV', 'is_opt' => true, 'desc' => 'School capital projects and PTA contributions']
            ];

            $vhStmt = $this->db->prepare("
                INSERT INTO vote_heads (id, school_id, name, account_code, description, is_optional, created_at)
                VALUES (:id, :school_id, :name, :code, :desc, :is_opt, NOW())
            ");

            foreach ($defaultVoteheads as $vh) {
                $vhStmt->execute([
                    ':id'        => $this->generateUUID(),
                    ':school_id' => $schoolId,
                    ':name'      => $vh['name'],
                    ':code'      => $vh['code'],
                    ':desc'      => $vh['desc'],
                    ':is_opt'    => $vh['is_opt'] ? 'true' : 'false'
                ]);
            }

            // 3. Provision Default Academic Year & Terms
            $ayId = $this->generateUUID();
            $ayStmt = $this->db->prepare("
                INSERT INTO academic_years (id, school_id, name, start_date, end_date, is_current, created_at)
                VALUES (:id, :school_id, '2026', '2026-01-05', '2026-11-20', true, NOW())
            ");
            $ayStmt->execute([':id' => $ayId, ':school_id' => $schoolId]);

            $terms = [
                ['name' => 'Term 1', 'start_date' => '2026-01-05', 'end_date' => '2026-04-10', 'is_current' => true],
                ['name' => 'Term 2', 'start_date' => '2026-05-04', 'end_date' => '2026-08-07', 'is_current' => false],
                ['name' => 'Term 3', 'start_date' => '2026-08-31', 'end_date' => '2026-11-20', 'is_current' => false],
            ];

            $termStmt = $this->db->prepare("
                INSERT INTO terms (id, academic_year_id, school_id, name, start_date, end_date, is_current, created_at)
                VALUES (:id, :ay_id, :school_id, :name, :start_date, :end_date, :is_current, NOW())
            ");

            foreach ($terms as $t) {
                $termStmt->execute([
                    ':id'         => $this->generateUUID(),
                    ':ay_id'      => $ayId,
                    ':school_id'  => $schoolId,
                    ':name'       => $t['name'],
                    ':start_date' => $t['start_date'],
                    ':end_date'   => $t['end_date'],
                    ':is_current' => $t['is_current'] ? 'true' : 'false'
                ]);
            }

            // 4. Provision Initial School Admin User (username: admin@slug or custom)
            $cleanUserPart = explode('@', $adminUserPart)[0];
            $fullUsername = "{$cleanUserPart}@{$slug}";
            $adminEmail = $adminEmail ?: "{$cleanUserPart}@{$slug}.ac.ke";
            $passwordHash = password_hash($adminPassword, PASSWORD_BCRYPT);

            $adminId = $this->generateUUID();
            $userStmt = $this->db->prepare("
                INSERT INTO users (
                    id, school_id, name, username, email, phone, password_hash, role, is_school_admin, is_active, created_at, updated_at
                ) VALUES (
                    :id, :school_id, :name, :username, :email, :phone, :password_hash, 'head_teacher', true, true, NOW(), NOW()
                )
            ");
            $userStmt->execute([
                ':id'            => $adminId,
                ':school_id'     => $schoolId,
                ':name'          => $adminName,
                ':username'      => $cleanUserPart,
                ':email'         => $fullUsername,
                ':phone'         => $adminPhone,
                ':password_hash' => $passwordHash
            ]);

            $this->db->commit();

            echo json_encode([
                'status'  => 'success',
                'message' => "School '{$name}' onboarded successfully with slug '{$slug}' and admin user '{$fullUsername}'!",
                'data' => [
                    'school_id'      => $schoolId,
                    'name'           => $name,
                    'slug'           => $slug,
                    'admin_username' => $fullUsername,
                    'admin_name'     => $adminName,
                    'admin_email'    => $adminEmail,
                    'initial_password' => $adminPassword
                ]
            ]);

        } catch (\Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Onboarding failed: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /admin/schools/:id
     */
    public function updateSchool(string $id): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];

            $name     = trim($input['name'] ?? '');
            $motto    = trim($input['motto'] ?? '');
            $county   = trim($input['county'] ?? '');
            $currency = trim($input['currency'] ?? 'KES');
            $paybill  = trim($input['mpesa_paybill'] ?? '');
            $email    = trim($input['email'] ?? '');
            $phone    = trim($input['phone'] ?? '');
            $address  = trim($input['address'] ?? '');
            $isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;

            $stmt = $this->db->prepare("
                UPDATE schools SET
                    name = COALESCE(NULLIF(:name, ''), name),
                    motto = COALESCE(NULLIF(:motto, ''), motto),
                    county = COALESCE(NULLIF(:county, ''), county),
                    currency = COALESCE(NULLIF(:currency, ''), currency),
                    mpesa_paybill = COALESCE(NULLIF(:paybill, ''), mpesa_paybill),
                    email = COALESCE(NULLIF(:email, ''), email),
                    phone = COALESCE(NULLIF(:phone, ''), phone),
                    address = COALESCE(NULLIF(:address, ''), address),
                    is_active = :is_active,
                    updated_at = NOW()
                WHERE id = :id
                RETURNING *
            ");
            $stmt->execute([
                ':name'      => $name,
                ':motto'     => $motto,
                ':county'    => $county,
                ':currency'  => $currency,
                ':paybill'   => $paybill,
                ':email'     => $email,
                ':phone'     => $phone,
                ':address'   => $address,
                ':is_active' => $isActive ? 'true' : 'false',
                ':id'        => $id
            ]);
            $updated = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$updated) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'School not found.']);
                return;
            }

            echo json_encode([
                'status'  => 'success',
                'message' => "School '{$updated['name']}' updated successfully.",
                'data'    => $updated
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /admin/schools/:id
     * Safely delete a school tenant and its associated isolated entities
     */
    public function deleteSchool(string $id): void
    {
        try {
            if ($id === 'a0000000-0000-0000-0000-000000000001') {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Primary default school cannot be deleted.']);
                return;
            }

            $check = $this->db->prepare("SELECT * FROM schools WHERE id = :id");
            $check->execute([':id' => $id]);
            $school = $check->fetch(PDO::FETCH_ASSOC);

            if (!$school) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'School not found.']);
                return;
            }

            // Find all tables that have a school_id column
            $stmtCols = $this->db->query("
                SELECT table_name 
                FROM information_schema.columns 
                WHERE column_name = 'school_id' AND table_schema = 'public'
            ");
            $tablesWithSchoolId = $stmtCols->fetchAll(PDO::FETCH_COLUMN);

            // Delete in reverse topological order (children first)
            $order = [
                'auth_otps', 'sms_configs', 'daily_ration_logs', 'meal_menus', 'clearance_requests',
                'sponsor_allocations', 'sponsors', 'sibling_discount_rules', 'academic_promotions',
                'bank_reconciliation_reports', 'bank_statement_lines', 'bank_statements', 'stk_attempts',
                'bank_integrations', 'donations', 'donors', 'other_income_take_ons', 'other_income_invoices',
                'other_income_receipts', 'other_income_customers', 'other_income_categories',
                'petty_cash_entries', 'fee_refunds', 'supplier_take_ons', 'supplier_bills',
                'local_purchase_orders', 'suppliers', 'payment_reversals', 'grants', 'payments_in_kind',
                'fee_adjustments', 'bursaries', 'student_group_members', 'student_groups', 'sms_logs',
                'audit_logs', 'expense_vouchers', 'expense_categories', 'pledges', 'reconciliation_matches',
                'receipts', 'bank_transactions', 'chart_of_accounts', 'account_types', 'inventory_transactions',
                'inventory_items', 'inventory_categories', 'stores', 'general_ledger', 'journal_entry_lines',
                'journal_entries', 'budget_items', 'budgets', 'bank_accounts', 'payments', 'expenses',
                'invoices', 'students', 'classes', 'streams', 'users', 'terms', 'academic_years', 'vote_heads'
            ];

            foreach ($order as $tbl) {
                if (in_array($tbl, $tablesWithSchoolId)) {
                    $this->db->exec("DELETE FROM {$tbl} WHERE school_id = '{$id}'");
                }
            }

            foreach ($tablesWithSchoolId as $tbl) {
                if (!in_array($tbl, $order)) {
                    $this->db->exec("DELETE FROM {$tbl} WHERE school_id = '{$id}'");
                }
            }

            $stmtDel = $this->db->prepare("DELETE FROM schools WHERE id = :id");
            $stmtDel->execute([':id' => $id]);

            echo json_encode([
                'status'  => 'success',
                'message' => "School '{$school['name']}' and its associated records were successfully deleted."
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete school: ' . $e->getMessage()]);
        }
    }

    private function generateUUID(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}