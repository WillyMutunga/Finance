<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Services\AssetService;
use Exception;

class AssetController
{
    private AssetService $service;

    public function __construct()
    {
        $this->service = new AssetService();
    }

    public function getCategories(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getCategories($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createCategory(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->createCategory($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Category created successfully.']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteCategory(string $id): void
    {
        $schoolId = Database::getTenantId();
        $this->service->deleteCategory($schoolId, $id);
        echo json_encode(['status' => 'success', 'message' => 'Category deleted successfully.']);
    }

    public function getAssets(): void
    {
        $schoolId = Database::getTenantId();
        $catId = $_GET['category_id'] ?? null;
        $search = $_GET['search'] ?? null;
        $data = $this->service->getAssets($schoolId, $catId, $search);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createAsset(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->createAsset($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Asset registered successfully.']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteAsset(string $id): void
    {
        $schoolId = Database::getTenantId();
        $this->service->deleteAsset($schoolId, $id);
        echo json_encode(['status' => 'success', 'message' => 'Asset deleted successfully.']);
    }
}