<?php

namespace App\Controllers;

use App\Database;
use PDO;

class StudentGroupController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function index(): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT 
                g.id, 
                g.name, 
                g.category, 
                g.patron, 
                g.created_at,
                COUNT(m.student_id)::int as members_count
            FROM student_groups g
            LEFT JOIN student_group_members m ON g.id = m.group_id
            WHERE g.school_id = :school_id
            GROUP BY g.id, g.name, g.category, g.patron, g.created_at
            ORDER BY g.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'data' => $groups
        ]);
    }

    public function create(): void
    {
        $schoolId = Database::getTenantId();
        $data = json_decode(file_get_contents('php://input'), true);

        $name = trim($data['name'] ?? '');
        $category = trim($data['category'] ?? 'House / Dormitory');
        $patron = trim($data['patron'] ?? 'Staff Advisor');

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Group name is required']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO student_groups (school_id, name, category, patron)
            VALUES (:school_id, :name, :category, :patron)
            RETURNING id, name, category, patron, created_at
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':name' => $name,
            ':category' => $category,
            ':patron' => $patron
        ]);
        $group = $stmt->fetch(PDO::FETCH_ASSOC);
        $group['members_count'] = 0;

        echo json_encode([
            'status' => 'success',
            'data' => $group,
            'message' => 'Group created successfully'
        ]);
    }

    public function getMembers(string $groupId): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT 
                s.id, 
                s.admission_number, 
                s.first_name, 
                s.last_name, 
                s.gender, 
                s.boarding_status,
                c.name as class_name,
                st.name as stream_name,
                m.assigned_at
            FROM student_group_members m
            JOIN students s ON m.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            WHERE m.group_id = :group_id AND m.school_id = :school_id
            ORDER BY s.admission_number ASC
        ");
        $stmt->execute([
            ':group_id' => $groupId,
            ':school_id' => $schoolId
        ]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'data' => $members
        ]);
    }

    public function assignMembers(string $groupId): void
    {
        $schoolId = Database::getTenantId();
        $data = json_decode(file_get_contents('php://input'), true);

        $studentIds = $data['student_ids'] ?? [];
        if (!is_array($studentIds)) {
            $studentIds = [];
        }

        // Check if group exists and belongs to school
        $checkStmt = $this->db->prepare("SELECT id, name FROM student_groups WHERE id = :id AND school_id = :school_id");
        $checkStmt->execute([':id' => $groupId, ':school_id' => $schoolId]);
        $group = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if (!$group) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Group not found']);
            return;
        }

        $this->db->beginTransaction();
        try {
            $insertStmt = $this->db->prepare("
                INSERT INTO student_group_members (school_id, group_id, student_id)
                VALUES (:school_id, :group_id, :student_id)
                ON CONFLICT (group_id, student_id) DO NOTHING
            ");

            foreach ($studentIds as $sId) {
                $insertStmt->execute([
                    ':school_id' => $schoolId,
                    ':group_id' => $groupId,
                    ':student_id' => $sId
                ]);
            }

            $this->db->commit();

            $countStmt = $this->db->prepare("SELECT COUNT(*) FROM student_group_members WHERE group_id = :group_id");
            $countStmt->execute([':group_id' => $groupId]);
            $newCount = (int)$countStmt->fetchColumn();

            echo json_encode([
                'status' => 'success',
                'message' => 'Students assigned successfully',
                'members_count' => $newCount
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function removeMember(string $groupId, string $studentId): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            DELETE FROM student_group_members 
            WHERE group_id = :group_id AND student_id = :student_id AND school_id = :school_id
        ");
        $stmt->execute([
            ':group_id' => $groupId,
            ':student_id' => $studentId,
            ':school_id' => $schoolId
        ]);

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM student_group_members WHERE group_id = :group_id");
        $countStmt->execute([':group_id' => $groupId]);
        $newCount = (int)$countStmt->fetchColumn();

        echo json_encode([
            'status' => 'success',
            'message' => 'Student removed from group',
            'members_count' => $newCount
        ]);
    }
}