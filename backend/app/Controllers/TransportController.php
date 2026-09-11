<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Services\TransportService;
use Exception;

class TransportController
{
    private TransportService $service;

    public function __construct()
    {
        $this->service = new TransportService();
    }

    public function getVehicles(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getVehicles($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createVehicle(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->createVehicle($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Vehicle added successfully.']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteVehicle(string $id): void
    {
        $schoolId = Database::getTenantId();
        $this->service->deleteVehicle($schoolId, $id);
        echo json_encode(['status' => 'success', 'message' => 'Vehicle deleted successfully.']);
    }

    public function getRoutes(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getRoutes($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createRoute(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->createRoute($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Route added successfully.']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteRoute(string $id): void
    {
        $schoolId = Database::getTenantId();
        $this->service->deleteRoute($schoolId, $id);
        echo json_encode(['status' => 'success', 'message' => 'Route deleted successfully.']);
    }

    public function getStudents(): void
    {
        $schoolId = Database::getTenantId();
        $routeId = $_GET['route_id'] ?? null;
        $data = $this->service->getStudentSubscriptions($schoolId, $routeId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function assignStudent(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->assignStudent($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Student assigned to route successfully.']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteStudent(string $id): void
    {
        $schoolId = Database::getTenantId();
        $this->service->deleteStudentSubscription($schoolId, $id);
        echo json_encode(['status' => 'success', 'message' => 'Student removed from route.']);
    }

    public function getLogs(): void
    {
        $schoolId = Database::getTenantId();
        $vehicleId = $_GET['vehicle_id'] ?? null;
        $data = $this->service->getLogs($schoolId, $vehicleId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createLog(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->createLog($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Log recorded successfully.']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}