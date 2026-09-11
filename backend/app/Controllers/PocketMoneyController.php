<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Services\PocketMoneyService;
use Exception;

class PocketMoneyController
{
    private PocketMoneyService $service;

    public function __construct()
    {
        $this->service = new PocketMoneyService();
    }

    public function getWallets(): void
    {
        $schoolId = Database::getTenantId();
        $search = $_GET['search'] ?? null;
        $classId = $_GET['class_id'] ?? null;
        $data = $this->service->getWallets($schoolId, $search, $classId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function recordTransaction(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->recordTransaction($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Transaction recorded successfully.']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function getTransactions(): void
    {
        $schoolId = Database::getTenantId();
        $studentId = $_GET['student_id'] ?? null;
        $type = $_GET['type'] ?? null;
        $data = $this->service->getTransactions($schoolId, $studentId, $type);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }
}