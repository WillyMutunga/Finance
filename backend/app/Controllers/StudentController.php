<?php

namespace App\Controllers;

use App\Database;
use App\Services\LedgerService;
use PDO;

class StudentController
{
    private PDO $db;
    private LedgerService $ledgerService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->ledgerService = new LedgerService();
    }

    public function index(): void
    {
        $schoolId = Database::getTenantId();
        $classId = $_GET['class_id'] ?? null;
        if ($classId === 'undefined' || $classId === 'null' || $classId === 'All' || trim((string)$classId) === '') {
            $classId = null;
        }

        $search = $_GET['search'] ?? null;
        if ($search === 'undefined' || $search === 'null' || trim((string)$search) === '') {
            $search = null;
        }

        $sql = "
            SELECT 
                s.id, s.admission_number, s.first_name, s.last_name, s.gender,
                s.boarding_status, s.status, s.created_at,
                c.id as class_id, c.name as class_name,
                st.name as stream_name,
                g.id as guardian_id, g.name as guardian_name, g.phone as guardian_phone, g.relationship,
                COALESCE((SELECT SUM(debit_amount) FROM transaction_ledger WHERE student_id = s.id), 0.00) as total_billed,
                COALESCE((SELECT SUM(credit_amount) FROM transaction_ledger WHERE student_id = s.id), 0.00) as total_paid
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            LEFT JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = TRUE
            LEFT JOIN guardians g ON sg.guardian_id = g.id
            WHERE s.school_id = :school_id
        ";

        $params = [':school_id' => $schoolId];

        if (!empty($classId)) {
            $sql .= " AND s.class_id = :class_id";
            $params[':class_id'] = $classId;
        }

        if (!empty($search)) {
            $sql .= " AND (LOWER(s.first_name) LIKE :search OR LOWER(s.last_name) LIKE :search OR LOWER(s.admission_number) LIKE :search)";
            $params[':search'] = '%' . strtolower($search) . '%';
        }

        $sql .= " ORDER BY c.level_order ASC NULLS LAST, s.admission_number ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $students = $stmt->fetchAll();

        // Calculate balances
        foreach ($students as &$s) {
            $billed = (float)$s['total_billed'];
            $paid = (float)$s['total_paid'];
            $s['balance'] = $billed - $paid;
        }

        echo json_encode(['status' => 'success', 'data' => $students]);
    }

    public function show(string $id): void
    {
        $schoolId = Database::getTenantId();

        $stmt = $this->db->prepare("
            SELECT 
                s.*, c.name as class_name, st.name as stream_name,
                g.id as guardian_id, g.name as guardian_name, g.phone as guardian_phone, g.email as guardian_email, g.relationship
            FROM students s
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            LEFT JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = TRUE
            LEFT JOIN guardians g ON sg.guardian_id = g.id
            WHERE s.id = :id AND s.school_id = :school_id
        ");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        $student = $stmt->fetch();

        if (!$student) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Student not found']);
            return;
        }

        // Fetch Siblings (Other students sharing the same guardian)
        $siblings = [];
        if (!empty($student['guardian_id'])) {
            $stmtSib = $this->db->prepare("
                SELECT s.id, s.admission_number, s.first_name, s.last_name, c.name as class_name
                FROM students s
                JOIN student_guardians sg ON s.id = sg.student_id
                JOIN classes c ON s.class_id = c.id
                WHERE sg.guardian_id = :guardian_id AND s.id != :student_id AND s.school_id = :school_id
            ");
            $stmtSib->execute([
                ':guardian_id' => $student['guardian_id'],
                ':student_id'  => $id,
                ':school_id'   => $schoolId
            ]);
            $siblings = $stmtSib->fetchAll();
        }

        // Fetch Immutable Ledger History
        $stmtLedger = $this->db->prepare("
            SELECT tl.*, u.name as recorded_by_name
            FROM transaction_ledger tl
            LEFT JOIN users u ON tl.recorded_by_user_id = u.id
            WHERE tl.student_id = :student_id AND tl.school_id = :school_id
            ORDER BY tl.created_at ASC
        ");
        $stmtLedger->execute([':student_id' => $id, ':school_id' => $schoolId]);
        $ledgerEntries = $stmtLedger->fetchAll();

        $balanceInfo = $this->ledgerService->getStudentBalance($schoolId, $id);
        $totalBilled = (float)($balanceInfo['total_billed'] ?? 0);
        $totalPaid = (float)($balanceInfo['total_paid'] ?? 0);
        $currentBalance = (float)($balanceInfo['balance'] ?? ($totalBilled - $totalPaid));

        echo json_encode([
            'status' => 'success',
            'data'   => [
                'student'        => $student,
                'siblings'       => $siblings,
                'balance'        => $currentBalance,
                'total_billed'   => $totalBilled,
                'total_paid'     => $totalPaid,
                'current_balance'=> $currentBalance,
                'balance_summary'=> $balanceInfo,
                'ledger'         => $ledgerEntries,
                'ledger_history' => $ledgerEntries
            ]
        ]);
    }

    public function bulkUpdate(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $sourceClassId  = trim($input['source_class_id'] ?? '');
        $action         = trim($input['action'] ?? 'promote');
        $studentIds     = $input['student_ids'] ?? [];
        $targetClassId  = trim($input['target_class_id'] ?? '');
        $targetStreamId = trim($input['target_stream_id'] ?? '');
        $boardingStatus = strtoupper(trim($input['boarding_status'] ?? 'BOARDING'));
        $graduationYear = trim($input['graduation_year'] ?? date('Y'));

        // Determine target students
        if (!empty($studentIds) && is_array($studentIds)) {
            $inPlaceholders = implode(',', array_fill(0, count($studentIds), '?'));
            $stmtSt = $this->db->prepare("SELECT id, gender, class_id FROM students WHERE school_id = ? AND id IN ($inPlaceholders)");
            $stmtSt->execute(array_merge([$schoolId], $studentIds));
            $studentsToUpdate = $stmtSt->fetchAll(PDO::FETCH_ASSOC);
        } elseif (!empty($sourceClassId) && $sourceClassId !== 'All') {
            $stmtSt = $this->db->prepare("SELECT id, gender, class_id FROM students WHERE school_id = :school_id AND class_id = :class_id AND status = 'ACTIVE'");
            $stmtSt->execute([':school_id' => $schoolId, ':class_id' => $sourceClassId]);
            $studentsToUpdate = $stmtSt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmtSt = $this->db->prepare("SELECT id, gender, class_id FROM students WHERE school_id = :school_id AND status = 'ACTIVE'");
            $stmtSt->execute([':school_id' => $schoolId]);
            $studentsToUpdate = $stmtSt->fetchAll(PDO::FETCH_ASSOC);
        }

        if (empty($studentsToUpdate)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'No active students found eligible for this bulk update.']);
            return;
        }

        $this->db->beginTransaction();
        try {
            $updatedCount = 0;

            if ($action === 'promote') {
                if (empty($targetClassId)) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Please select a target class to promote students to.']);
                    $this->db->rollBack();
                    return;
                }

                $stmtTargetName = $this->db->prepare("SELECT name FROM classes WHERE id = :id AND school_id = :school_id");
                $stmtTargetName->execute([':id' => $targetClassId, ':school_id' => $schoolId]);
                $targetClassName = $stmtTargetName->fetchColumn() ?: 'Target Class';

                foreach ($studentsToUpdate as $stu) {
                    $newStreamId = null;
                    if (!empty($targetStreamId) && $targetStreamId !== 'AUTO') {
                        $newStreamId = $targetStreamId;
                    } else {
                        $newStreamId = $this->autoAssignStream($schoolId, $targetClassId, $stu['gender'] ?? 'Male');
                    }

                    $stmtUp = $this->db->prepare("
                        UPDATE students 
                        SET class_id = :class_id, stream_id = :stream_id, updated_at = CURRENT_TIMESTAMP
                        WHERE id = :id AND school_id = :school_id
                    ");
                    $stmtUp->execute([
                        ':class_id'  => $targetClassId,
                        ':stream_id' => $newStreamId,
                        ':id'        => $stu['id'],
                        ':school_id' => $schoolId
                    ]);
                    $updatedCount++;
                }

                $message = "Successfully promoted {$updatedCount} students to {$targetClassName} with balanced stream rotation.";

            } elseif ($action === 'change-stream') {
                foreach ($studentsToUpdate as $stu) {
                    $newStreamId = null;
                    if (!empty($targetStreamId) && $targetStreamId !== 'AUTO') {
                        $newStreamId = $targetStreamId;
                    } else {
                        $stuClassId = $stu['class_id'];
                        $newStreamId = $this->autoAssignStream($schoolId, $stuClassId, $stu['gender'] ?? 'Male');
                    }

                    $stmtUp = $this->db->prepare("
                        UPDATE students 
                        SET stream_id = :stream_id, updated_at = CURRENT_TIMESTAMP
                        WHERE id = :id AND school_id = :school_id
                    ");
                    $stmtUp->execute([
                        ':stream_id' => $newStreamId,
                        ':id'        => $stu['id'],
                        ':school_id' => $schoolId
                    ]);
                    $updatedCount++;
                }

                $message = "Successfully reallocated {$updatedCount} students across streams with gender balance.";

            } elseif ($action === 'change-boarding') {
                if (!in_array($boardingStatus, ['DAY', 'BOARDING'])) {
                    $boardingStatus = 'DAY';
                }

                $stmtUp = $this->db->prepare("
                    UPDATE students 
                    SET boarding_status = :boarding, updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id AND school_id = :school_id
                ");
                foreach ($studentsToUpdate as $stu) {
                    $stmtUp->execute([
                        ':boarding'  => $boardingStatus,
                        ':id'        => $stu['id'],
                        ':school_id' => $schoolId
                    ]);
                    $updatedCount++;
                }

                $message = "Successfully updated {$updatedCount} students to " . ($boardingStatus === 'BOARDING' ? 'Boarding' : 'Day Scholar') . " status.";

            } elseif ($action === 'graduate') {
                $stmtUp = $this->db->prepare("
                    UPDATE students 
                    SET status = 'ALUMNI', updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id AND school_id = :school_id
                ");
                foreach ($studentsToUpdate as $stu) {
                    $stmtUp->execute([
                        ':id'        => $stu['id'],
                        ':school_id' => $schoolId
                    ]);
                    $updatedCount++;
                }

                $message = "Successfully graduated {$updatedCount} students (Class of {$graduationYear}).";

            } elseif ($action === 'deactivate') {
                $stmtUp = $this->db->prepare("
                    UPDATE students 
                    SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id AND school_id = :school_id
                ");
                foreach ($studentsToUpdate as $stu) {
                    $stmtUp->execute([
                        ':id'        => $stu['id'],
                        ':school_id' => $schoolId
                    ]);
                    $updatedCount++;
                }

                $message = "Successfully set {$updatedCount} students to Inactive.";

            } else {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid bulk action specified.']);
                $this->db->rollBack();
                return;
            }

            $this->db->commit();
            echo json_encode([
                'status'  => 'success',
                'message' => $message,
                'count'   => $updatedCount
            ]);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function nextAdmissionNumber(): void
    {
        $schoolId = Database::getTenantId();
        $nextAdm = $this->getNextAdmissionNumber($schoolId);
        echo json_encode(['status' => 'success', 'data' => ['next_admission_number' => $nextAdm]]);
    }

    public function getNextAdmissionNumber(string $schoolId): string
    {
        $stmt = $this->db->prepare("
            SELECT admission_number FROM students 
            WHERE school_id = :school_id 
            ORDER BY created_at DESC 
            LIMIT 200
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $adms = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($adms)) {
            return 'ADM-001';
        }

        $maxNum = 0;
        $detectedPrefix = 'ADM-';
        $padLen = 3;

        foreach ($adms as $adm) {
            if (preg_match('/^(.*?)([0-9]+)$/', trim($adm), $m)) {
                $prefix = $m[1];
                $num = (int)$m[2];
                $currentPad = strlen($m[2]);
                if ($num > $maxNum) {
                    $maxNum = $num;
                    $detectedPrefix = $prefix;
                    $padLen = max($padLen, $currentPad);
                }
            }
        }

        if ($maxNum > 0) {
            $nextNum = $maxNum + 1;
            return $detectedPrefix . str_pad((string)$nextNum, $padLen, '0', STR_PAD_LEFT);
        }

        return 'ADM-001';
    }

    /**
     * Automatic balanced stream assignment with gender balance & round-robin rotation
     */
    public function autoAssignStream(string $schoolId, string $classId, string $gender = 'Male'): ?string
    {
        $stmtStreams = $this->db->prepare("
            SELECT id, name FROM streams 
            WHERE school_id = :school_id AND class_id = :class_id 
            ORDER BY name ASC, created_at ASC
        ");
        $stmtStreams->execute([':school_id' => $schoolId, ':class_id' => $classId]);
        $streams = $stmtStreams->fetchAll(PDO::FETCH_ASSOC);

        if (empty($streams)) {
            return null;
        }
        if (count($streams) === 1) {
            return $streams[0]['id'];
        }

        // 1. Fetch gender counts per stream in this class
        $stmtG = $this->db->prepare("
            SELECT stream_id, COUNT(*) as count 
            FROM students 
            WHERE school_id = :school_id AND class_id = :class_id AND gender = :gender AND status = 'ACTIVE' AND stream_id IS NOT NULL
            GROUP BY stream_id
        ");
        $stmtG->execute([':school_id' => $schoolId, ':class_id' => $classId, ':gender' => $gender]);
        $genderCounts = $stmtG->fetchAll(PDO::FETCH_KEY_PAIR); // [stream_id => count]

        // 2. Fetch total student counts per stream in this class
        $stmtTot = $this->db->prepare("
            SELECT stream_id, COUNT(*) as count 
            FROM students 
            WHERE school_id = :school_id AND class_id = :class_id AND status = 'ACTIVE' AND stream_id IS NOT NULL
            GROUP BY stream_id
        ");
        $stmtTot->execute([':school_id' => $schoolId, ':class_id' => $classId]);
        $totalCounts = $stmtTot->fetchAll(PDO::FETCH_KEY_PAIR); // [stream_id => count]

        // 3. Find the last assigned stream for round-robin rotation tie-breaker
        $stmtLast = $this->db->prepare("
            SELECT stream_id FROM students 
            WHERE school_id = :school_id AND class_id = :class_id AND stream_id IS NOT NULL 
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmtLast->execute([':school_id' => $schoolId, ':class_id' => $classId]);
        $lastStreamId = $stmtLast->fetchColumn();

        $lastIndex = -1;
        foreach ($streams as $idx => $st) {
            if ($st['id'] === $lastStreamId) {
                $lastIndex = $idx;
                break;
            }
        }

        // 4. Rank streams by:
        //    a) Gender count (lowest first for gender balance)
        //    b) Total count (lowest first for class size balance)
        //    c) Next in rotational order from last assigned stream
        $scoredStreams = [];
        $streamCount = count($streams);

        foreach ($streams as $idx => $st) {
            $gCount = (int)($genderCounts[$st['id']] ?? 0);
            $tCount = (int)($totalCounts[$st['id']] ?? 0);
            
            // Distance in rotation from last stream (0 = next stream, 1 = stream after, etc.)
            $rotationDistance = ($idx - ($lastIndex + 1) + $streamCount) % $streamCount;

            $scoredStreams[] = [
                'id'                => $st['id'],
                'name'              => $st['name'],
                'gender_count'      => $gCount,
                'total_count'       => $tCount,
                'rotation_distance' => $rotationDistance
            ];
        }

        // Sort by gender_count ASC, then total_count ASC, then rotation_distance ASC
        usort($scoredStreams, function ($a, $b) {
            if ($a['gender_count'] !== $b['gender_count']) {
                return $a['gender_count'] <=> $b['gender_count'];
            }
            if ($a['total_count'] !== $b['total_count']) {
                return $a['total_count'] <=> $b['total_count'];
            }
            return $a['rotation_distance'] <=> $b['rotation_distance'];
        });

        return $scoredStreams[0]['id'];
    }

    public function create(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $admNo    = trim($input['admission_number'] ?? '');
        $firstName= trim($input['first_name'] ?? '');
        $lastName = trim($input['last_name'] ?? '');
        $gender   = trim($input['gender'] ?? 'Male');
        $classId  = trim($input['class_id'] ?? '');
        $guardianName = trim($input['guardian_name'] ?? '');
        $guardianPhone = trim($input['guardian_phone'] ?? '');
        $boardingStatus = strtoupper(trim($input['boarding_status'] ?? 'DAY'));
        if (!in_array($boardingStatus, ['DAY', 'BOARDING'])) {
            $boardingStatus = 'DAY';
        }

        if (empty($classId) && !empty($input['class_name'])) {
            $stmtC = $this->db->prepare("SELECT id FROM classes WHERE school_id = :school_id AND name = :name");
            $stmtC->execute([':school_id' => $schoolId, ':name' => trim($input['class_name'])]);
            $classId = $stmtC->fetchColumn();
            if (!$classId) {
                $stmtNewC = $this->db->prepare("INSERT INTO classes (school_id, name, level_order) VALUES (:school_id, :name, 1) RETURNING id");
                $stmtNewC->execute([':school_id' => $schoolId, ':name' => trim($input['class_name'])]);
                $classId = $stmtNewC->fetchColumn();
            }
        } elseif (empty($classId)) {
            // Find default class or create Form 1
            $stmtDef = $this->db->prepare("SELECT id FROM classes WHERE school_id = :school_id LIMIT 1");
            $stmtDef->execute([':school_id' => $schoolId]);
            $classId = $stmtDef->fetchColumn();
            if (!$classId) {
                $stmtNewC = $this->db->prepare("INSERT INTO classes (school_id, name, level_order) VALUES (:school_id, 'Form 1', 1) RETURNING id");
                $stmtNewC->execute([':school_id' => $schoolId]);
                $classId = $stmtNewC->fetchColumn();
            }
        }

        // Auto-increment admission number if not provided
        if (empty($admNo)) {
            $admNo = $this->getNextAdmissionNumber($schoolId);
        }

        if (empty($firstName) || empty($lastName) || empty($classId)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'First Name, Last Name, and Class are required.']);
            return;
        }

        // Check for duplicate admission number
        $stmtCheck = $this->db->prepare("SELECT id FROM students WHERE school_id = :school_id AND admission_number = :adm");
        $stmtCheck->execute([':school_id' => $schoolId, ':adm' => $admNo]);
        if ($stmtCheck->fetchColumn()) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => "Admission Number '{$admNo}' already exists. Please choose a unique admission number."]);
            return;
        }

        // Stream assignment: If empty or 'AUTO', run balanced round-robin + gender allocation
        $streamId = !empty($input['stream_id']) && $input['stream_id'] !== 'AUTO' ? trim($input['stream_id']) : null;
        if (empty($streamId) && !empty($input['stream_name']) && $input['stream_name'] !== 'AUTO') {
            $stmtSt = $this->db->prepare("SELECT id FROM streams WHERE school_id = :school_id AND class_id = :class_id AND (name = :name OR :fullName LIKE '%' || name)");
            $stmtSt->execute([':school_id' => $schoolId, ':class_id' => $classId, ':name' => trim($input['stream_name']), ':fullName' => trim($input['stream_name'])]);
            $streamId = $stmtSt->fetchColumn() ?: null;
        }
        if (empty($streamId)) {
            $streamId = $this->autoAssignStream($schoolId, $classId, $gender);
        }

        // Get stream name for confirmation message
        $assignedStreamName = '';
        if ($streamId) {
            $stmtStName = $this->db->prepare("SELECT name FROM streams WHERE id = :id");
            $stmtStName->execute([':id' => $streamId]);
            $assignedStreamName = $stmtStName->fetchColumn() ?: '';
        }

        $this->db->beginTransaction();
        try {
            // 1. Insert Student
            $stmt = $this->db->prepare("
                INSERT INTO students (
                    school_id, admission_number, first_name, last_name, gender, class_id, stream_id, boarding_status
                ) VALUES (
                    :school_id, :adm, :first, :last, :gender, :class_id, :stream_id, :boarding
                ) RETURNING id
            ");
            $stmt->execute([
                ':school_id' => $schoolId,
                ':adm'       => $admNo,
                ':first'     => $firstName,
                ':last'      => $lastName,
                ':gender'    => $input['gender'] ?? 'Male',
                ':class_id'  => $classId,
                ':stream_id' => $streamId,
                ':boarding'  => $boardingStatus
            ]);
            $studentId = $stmt->fetchColumn();

            // 2. Link or Create Guardian
            if (!empty($guardianPhone)) {
                $stmtG = $this->db->prepare("SELECT id FROM guardians WHERE school_id = :school_id AND phone = :phone");
                $stmtG->execute([':school_id' => $schoolId, ':phone' => $guardianPhone]);
                $guardianId = $stmtG->fetchColumn();

                if (!$guardianId) {
                    $stmtGIns = $this->db->prepare("
                        INSERT INTO guardians (school_id, name, phone, relationship)
                        VALUES (:school_id, :name, :phone, :rel) RETURNING id
                    ");
                    $stmtGIns->execute([
                        ':school_id' => $schoolId,
                        ':name'      => $guardianName ?: 'Guardian of ' . $firstName,
                        ':phone'     => $guardianPhone,
                        ':rel'       => $input['relationship'] ?? 'Parent'
                    ]);
                    $guardianId = $stmtGIns->fetchColumn();
                }

                $stmtLink = $this->db->prepare("
                    INSERT INTO student_guardians (school_id, student_id, guardian_id, is_primary)
                    VALUES (:school_id, :student_id, :guardian_id, TRUE)
                ");
                $stmtLink->execute([
                    ':school_id'   => $schoolId,
                    ':student_id'  => $studentId,
                    ':guardian_id' => $guardianId
                ]);
            }

            // 3. Auto-assign and issue initial term fee invoice matching student's class & boarding status
            $stmtTerm = $this->db->prepare("SELECT id, academic_year_id FROM terms WHERE school_id = :school_id AND is_current = TRUE LIMIT 1");
            $stmtTerm->execute([':school_id' => $schoolId]);
            $currentTerm = $stmtTerm->fetch();

            if ($currentTerm) {
                // Find matching fee structure for this class (strictly prioritize boarding status & title keywords)
                $stmtFs = $this->db->prepare("
                    SELECT * FROM fee_structures 
                    WHERE school_id = :school_id 
                      AND class_id = :class_id 
                      AND term_id = :term_id
                      AND (
                          boarding_status = :boarding 
                          OR (boarding_status = 'ALL' AND :boarding = 'DAY' AND title NOT ILIKE '%Boarding%')
                          OR (boarding_status = 'ALL' AND :boarding = 'BOARDING' AND title NOT ILIKE '%Day%')
                          OR boarding_status = 'ALL'
                      )
                    ORDER BY 
                        CASE 
                            WHEN boarding_status = :boarding THEN 0
                            WHEN :boarding = 'DAY' AND (title ILIKE '%Day%' OR title ILIKE '%Day Scholar%') THEN 1
                            WHEN :boarding = 'BOARDING' AND (title ILIKE '%Boarding%') THEN 1
                            WHEN boarding_status = 'ALL' AND title NOT ILIKE '%Boarding%' AND title NOT ILIKE '%Day%' THEN 2
                            ELSE 3
                        END ASC, created_at DESC
                    LIMIT 1
                ");
                $stmtFs->execute([
                    ':school_id' => $schoolId,
                    ':class_id'  => $classId,
                    ':term_id'   => $currentTerm['id'],
                    ':boarding'  => $boardingStatus
                ]);
                $matchedFs = $stmtFs->fetch();

                if ($matchedFs) {
                    $invNo = 'INV-' . date('Y') . '-' . sprintf('%04d', rand(1000, 9999));
                    $totalAmount = (float)$matchedFs['total_amount'];
                    $dueDate = date('Y-m-d', strtotime('+30 days'));

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
                        ':student_id'=> $studentId,
                        ':ay_id'     => $matchedFs['academic_year_id'],
                        ':term_id'   => $matchedFs['term_id'],
                        ':fs_id'     => $matchedFs['id'],
                        ':amount'    => $totalAmount,
                        ':due_date'  => $dueDate
                    ]);

                    // Append to Immutable Financial Ledger (Debit Entry)
                    $this->ledgerService->recordEntry(
                        $schoolId,
                        $studentId,
                        'INVOICE_CHARGE',
                        $totalAmount,
                        0.00,
                        "Initial Term Billing - {$matchedFs['title']} ({$invNo})",
                        $matchedFs['term_id']
                    );
                }
            }

            $this->db->commit();
            echo json_encode([
                'status'  => 'success',
                'message' => "Student {$firstName} {$lastName} (Adm: {$admNo}) admitted successfully, auto-assigned to " . ($assignedStreamName ? "Stream {$assignedStreamName}" : "Class") . " (" . ($boardingStatus === 'BOARDING' ? 'Boarding' : 'Day Scholar') . ") and billed.",
                'data'    => ['id' => $studentId, 'admission_number' => $admNo]
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

        $admNo     = trim($input['admission_number'] ?? '');
        $firstName = trim($input['first_name'] ?? '');
        $lastName  = trim($input['last_name'] ?? '');
        $classId   = trim($input['class_id'] ?? '');
        $streamId  = !empty($input['stream_id']) ? trim($input['stream_id']) : null;
        $gender    = trim($input['gender'] ?? 'Male');
        $boardingStatus = strtoupper(trim($input['boarding_status'] ?? 'DAY'));
        if (!in_array($boardingStatus, ['DAY', 'BOARDING'])) {
            $boardingStatus = 'DAY';
        }
        $status = strtoupper(trim($input['status'] ?? 'ACTIVE'));
        $guardianName  = trim($input['guardian_name'] ?? '');
        $guardianPhone = trim($input['guardian_phone'] ?? '');
        $relationship  = trim($input['relationship'] ?? 'Parent');

        if (empty($admNo) || empty($firstName) || empty($lastName) || empty($classId)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Admission Number, First Name, Last Name, and Class are required.']);
            return;
        }

        // Check admission number uniqueness among other students
        $stmtCheck = $this->db->prepare("SELECT id FROM students WHERE school_id = :school_id AND admission_number = :adm AND id != :id");
        $stmtCheck->execute([':school_id' => $schoolId, ':adm' => $admNo, ':id' => $id]);
        if ($stmtCheck->fetchColumn()) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => "Admission Number '{$admNo}' is already in use by another student."]);
            return;
        }

        $this->db->beginTransaction();
        try {
            // 1. Update Student record
            $stmt = $this->db->prepare("
                UPDATE students 
                SET 
                    admission_number = :adm,
                    first_name = :first,
                    last_name = :last,
                    gender = :gender,
                    class_id = :class_id,
                    stream_id = :stream_id,
                    boarding_status = :boarding,
                    status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id AND school_id = :school_id
            ");
            $stmt->execute([
                ':adm'       => $admNo,
                ':first'     => $firstName,
                ':last'      => $lastName,
                ':gender'    => $gender,
                ':class_id'  => $classId,
                ':stream_id' => $streamId,
                ':boarding'  => $boardingStatus,
                ':status'    => $status,
                ':id'        => $id,
                ':school_id' => $schoolId
            ]);

            // 2. Update Guardian
            if (!empty($guardianPhone)) {
                $stmtG = $this->db->prepare("
                    SELECT g.id FROM guardians g
                    JOIN student_guardians sg ON g.id = sg.guardian_id
                    WHERE sg.student_id = :student_id AND sg.is_primary = TRUE
                ");
                $stmtG->execute([':student_id' => $id]);
                $existingGId = $stmtG->fetchColumn();

                if ($existingGId) {
                    $stmtGUpd = $this->db->prepare("
                        UPDATE guardians 
                        SET name = :name, phone = :phone, relationship = :rel, updated_at = CURRENT_TIMESTAMP
                        WHERE id = :id
                    ");
                    $stmtGUpd->execute([
                        ':name'  => $guardianName ?: 'Guardian of ' . $firstName,
                        ':phone' => $guardianPhone,
                        ':rel'   => $relationship,
                        ':id'    => $existingGId
                    ]);
                } else {
                    $stmtGIns = $this->db->prepare("
                        INSERT INTO guardians (school_id, name, phone, relationship)
                        VALUES (:school_id, :name, :phone, :rel) RETURNING id
                    ");
                    $stmtGIns->execute([
                        ':school_id' => $schoolId,
                        ':name'      => $guardianName ?: 'Guardian of ' . $firstName,
                        ':phone'     => $guardianPhone,
                        ':rel'       => $relationship
                    ]);
                    $newGId = $stmtGIns->fetchColumn();

                    $stmtLink = $this->db->prepare("
                        INSERT INTO student_guardians (school_id, student_id, guardian_id, is_primary)
                        VALUES (:school_id, :student_id, :guardian_id, TRUE)
                    ");
                    $stmtLink->execute([
                        ':school_id'   => $schoolId,
                        ':student_id'  => $id,
                        ':guardian_id' => $newGId
                    ]);
                }
            }

            $this->db->commit();
            echo json_encode(['status' => 'success', 'message' => "Student {$firstName} {$lastName} updated successfully."]);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function delete(string $id): void
    {
        $schoolId = Database::getTenantId();

        $this->db->beginTransaction();
        try {
            $this->db->prepare("DELETE FROM transaction_ledger WHERE student_id = :id AND school_id = :school_id")->execute([':id' => $id, ':school_id' => $schoolId]);
            $this->db->prepare("DELETE FROM fee_invoices WHERE student_id = :id AND school_id = :school_id")->execute([':id' => $id, ':school_id' => $schoolId]);
            $this->db->prepare("DELETE FROM student_guardians WHERE student_id = :id AND school_id = :school_id")->execute([':id' => $id, ':school_id' => $schoolId]);
            $this->db->prepare("DELETE FROM student_group_members WHERE student_id = :id")->execute([':id' => $id]);
            $stmt = $this->db->prepare("DELETE FROM students WHERE id = :id AND school_id = :school_id");
            $stmt->execute([':id' => $id, ':school_id' => $schoolId]);

            $this->db->commit();
            echo json_encode(['status' => 'success', 'message' => 'Student record deleted successfully.']);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}