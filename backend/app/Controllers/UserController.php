<?php

namespace App\Controllers;

use App\Database;
use PDO;

class UserController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    private function getTenantId(): string
    {
        return Database::getTenantId();
    }

    /**
     * GET /users
     * List all users for current school
     */
    public function index()
    {
        try {
            $schoolId = $this->getTenantId();
            $status = $_GET['status'] ?? null;

            // Fetch school details
            $schoolStmt = $this->db->prepare("SELECT * FROM schools WHERE id = :school_id");
            $schoolStmt->execute([':school_id' => $schoolId]);
            $school = $schoolStmt->fetch(PDO::FETCH_ASSOC);
            $schoolSlug = $school['slug'] ?? $school['subdomain'] ?? (isset($school['name']) ? strtolower(explode(' ', $school['name'])[0]) : 'nduundune');

            $sql = "SELECT * FROM users WHERE (school_id = :school_id OR school_id IS NULL)";
            
            if ($status === 'active') {
                $sql .= " AND is_active = true";
            } elseif ($status === 'deactivated') {
                $sql .= " AND is_active = false";
            }

            $sql .= " ORDER BY created_at ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([':school_id' => $schoolId]);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format for frontend
            $formatted = array_map(function ($u) use ($schoolSlug, $school) {
                $rawUser = $u['username'] ?? '';
                $userPart = !empty($rawUser) ? $rawUser : explode('@', $u['email'] ?? 'user')[0];
                $displayUsername = (strpos($u['email'] ?? '', '@') !== false && !strpos($u['email'], '.ac.ke') && !strpos($u['email'], '.com'))
                    ? $u['email']
                    : (($u['role'] ?? '') === 'super_admin' ? $userPart : "{$userPart}@{$schoolSlug}");

                return [
                    'id' => $u['id'],
                    'school_id' => $u['school_id'],
                    'school_name' => $school['name'] ?? 'Primary Institution',
                    'school_slug' => $schoolSlug,
                    'name' => $u['name'],
                    'email' => $u['email'],
                    'username' => $displayUsername,
                    'raw_username' => $userPart,
                    'phone' => $u['phone'] ?? '-',
                    'role' => $u['role'],
                    'is_school_admin' => (bool)($u['is_school_admin'] ?? false),
                    'is_active' => (bool)$u['is_active'],
                    'status' => $u['is_active'] ? 'Active' : 'Deactivated',
                    'last_login_at' => $u['last_login_at'],
                    'addedOn' => substr($u['created_at'] ?? date('Y-m-d'), 0, 10),
                    'created_at' => $u['created_at']
                ];
            }, $users);

            echo json_encode([
                'status' => 'success',
                'data' => $formatted,
                'school' => $school,
                'total' => count($formatted)
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /users
     * Create a new user with role and credentials under current school
     */
    public function create()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            $name = trim($data['name'] ?? '');
            $usernameInput = trim($data['username'] ?? $data['email'] ?? '');
            $password = trim($data['password'] ?? '');
            $phone = trim($data['phone'] ?? '');
            $role = trim($data['role'] ?? 'bursar');

            if (empty($name) || empty($usernameInput) || empty($password)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Full Name, Username, and Password are required.']);
                return;
            }

            $validRoles = ['super_admin', 'school_admin', 'bursar', 'head_teacher', 'auditor', 'parent'];
            if (!in_array($role, $validRoles)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid role specified. Must be one of: ' . implode(', ', $validRoles)]);
                return;
            }

            $schoolId = $this->getTenantId();

            // Fetch school slug
            $schoolStmt = $this->db->prepare("SELECT * FROM schools WHERE id = :id");
            $schoolStmt->execute([':id' => $schoolId]);
            $school = $schoolStmt->fetch(PDO::FETCH_ASSOC);
            $slug = $school['slug'] ?? $school['subdomain'] ?? (isset($school['name']) ? strtolower(explode(' ', $school['name'])[0]) : 'nduundune');

            // Clean username prefix and construct username@slug
            $cleanUser = strtolower(preg_replace('/[^a-zA-Z0-9_\.]/', '', explode('@', $usernameInput)[0]));
            if (empty($cleanUser)) $cleanUser = 'user' . rand(100, 999);
            
            $fullUsername = "{$cleanUser}@{$slug}";
            $email = !empty($data['email']) ? trim($data['email']) : $fullUsername;

            // Check if username/email already exists within this school
            $checkStmt = $this->db->prepare("
                SELECT id FROM users 
                WHERE (LOWER(username) = LOWER(:u) OR LOWER(email) = LOWER(:full) OR LOWER(email) = LOWER(:e)) 
                  AND (school_id = :school_id OR school_id IS NULL)
            ");
            $checkStmt->execute([
                ':u'         => $cleanUser,
                ':full'      => $fullUsername,
                ':e'         => $email,
                ':school_id' => $schoolId
            ]);
            if ($checkStmt->fetch()) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => "A user with username '{$fullUsername}' already exists in this school."]);
                return;
            }

            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $isSchoolAdmin = ($role === 'school_admin' || $role === 'head_teacher');

            $stmt = $this->db->prepare("
                INSERT INTO users (school_id, name, username, email, phone, password_hash, role, is_school_admin, is_active, created_at, updated_at)
                VALUES (:school_id, :name, :username, :email, :phone, :password_hash, :role, :is_admin, true, NOW(), NOW())
                RETURNING id, name, username, email, phone, role, is_active, is_school_admin, created_at
            ");

            $stmt->execute([
                ':school_id'     => $schoolId,
                ':name'          => $name,
                ':username'      => $cleanUser,
                ':email'         => $fullUsername,
                ':phone'         => $phone,
                ':password_hash' => $passwordHash,
                ':role'          => $role,
                ':is_admin'      => $isSchoolAdmin ? 1 : 0
            ]);

            $created = $stmt->fetch(PDO::FETCH_ASSOC);

            // Audit log
            try {
                $audit = $this->db->prepare("
                    INSERT INTO audit_logs (school_id, user_id, action, entity_type, entity_id, new_values, created_at)
                    VALUES (:school_id, :user_id, 'USER_CREATED', 'users', :entity_id, :new_values, NOW())
                ");
                $audit->execute([
                    ':school_id' => $schoolId,
                    ':user_id' => $created['id'],
                    ':entity_id' => $created['id'],
                    ':new_values' => json_encode(['name' => $name, 'email' => $email, 'role' => $role])
                ]);
            } catch (\Exception $ae) {
                // Non-fatal
            }

            echo json_encode([
                'status' => 'success',
                'message' => "User '{$name}' with role '{$role}' created successfully!",
                'data' => $created
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /users/:id/status
     * Toggle active/inactive status
     */
    public function updateStatus($id)
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $isActive = isset($data['is_active']) ? (bool)$data['is_active'] : true;

            $stmt = $this->db->prepare("UPDATE users SET is_active = :is_active, updated_at = NOW() WHERE id = :id RETURNING id, name, email, role, is_active");
            $stmt->execute([':is_active' => $isActive ? 1 : 0, ':id' => $id]);
            $updated = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$updated) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'User not found.']);
                return;
            }

            echo json_encode([
                'status' => 'success',
                'message' => "User '{$updated['name']}' status updated to " . ($isActive ? 'Active' : 'Deactivated'),
                'data' => $updated
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /users/:id/reset-password
     */
    public function resetPassword($id)
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $newPassword = trim($data['password'] ?? '');

            if (empty($newPassword)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'New password is required.']);
                return;
            }

            $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $this->db->prepare("UPDATE users SET password_hash = :hash, updated_at = NOW() WHERE id = :id RETURNING id, name, email");
            $stmt->execute([':hash' => $passwordHash, ':id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'User not found.']);
                return;
            }

            echo json_encode([
                'status' => 'success',
                'message' => "Password for user '{$user['name']}' reset successfully."
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /users/:id
     */
    public function delete($id)
    {
        try {
            // Check if user exists
            $checkStmt = $this->db->prepare("SELECT id, name, role FROM users WHERE id = :id");
            $checkStmt->execute([':id' => $id]);
            $user = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'User not found.']);
                return;
            }

            // Check if user is referenced in transaction ledger or vouchers
            $ledgerCheck = $this->db->prepare("SELECT COUNT(*) FROM transaction_ledger WHERE recorded_by_user_id = :id");
            $ledgerCheck->execute([':id' => $id]);
            $ledgerCount = (int)$ledgerCheck->fetchColumn();

            if ($ledgerCount > 0) {
                // Soft delete by deactivating so ledger remains intact
                $deact = $this->db->prepare("UPDATE users SET is_active = false, updated_at = NOW() WHERE id = :id");
                $deact->execute([':id' => $id]);
                echo json_encode([
                    'status' => 'success',
                    'message' => "User '{$user['name']}' has {$ledgerCount} recorded financial transactions and was deactivated instead of permanently deleted to preserve audit integrity."
                ]);
                return;
            }

            $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode([
                'status' => 'success',
                'message' => "User '{$user['name']}' deleted successfully."
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}