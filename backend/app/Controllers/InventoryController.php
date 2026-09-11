<?php

namespace App\Controllers;

use App\Database;
use App\Services\InventoryService;

class InventoryController
{
    private InventoryService $service;

    public function __construct()
    {
        $this->service = new InventoryService();
    }

    public function getStores(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getStores($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createStore(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->createStore($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Store created successfully.']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteStore(string $id): void
    {
        $schoolId = Database::getTenantId();
        $ok = $this->service->deleteStore($schoolId, $id);
        echo json_encode(['status' => 'success', 'message' => 'Store deleted successfully.']);
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
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteCategory(string $id): void
    {
        $schoolId = Database::getTenantId();
        $ok = $this->service->deleteCategory($schoolId, $id);
        echo json_encode(['status' => 'success', 'message' => 'Category deleted successfully.']);
    }

    public function getUnits(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getUnits($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createUnit(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->createUnit($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Unit created successfully.']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteUnit(string $id): void
    {
        $schoolId = Database::getTenantId();
        $ok = $this->service->deleteUnit($schoolId, $id);
        echo json_encode(['status' => 'success', 'message' => 'Unit deleted successfully.']);
    }

    public function getItems(): void
    {
        $schoolId   = Database::getTenantId();
        $categoryId = $_GET['category_id'] ?? null;
        $storeId    = $_GET['store_id'] ?? null;
        $search     = $_GET['search'] ?? $_GET['q'] ?? null;

        $data = $this->service->getItems($schoolId, $categoryId, $storeId, $search);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function createItem(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->createItem($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Inventory item created successfully.']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateItem(string $id): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->updateItem($schoolId, $id, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Inventory item updated successfully.']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function deleteItem(string $id): void
    {
        $schoolId = Database::getTenantId();
        $ok = $this->service->deleteItem($schoolId, $id);
        echo json_encode(['status' => 'success', 'message' => 'Item deleted successfully.']);
    }

    public function recordTransaction(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        try {
            $data = $this->service->recordTransaction($schoolId, $input);
            echo json_encode(['status' => 'success', 'data' => $data, 'message' => 'Transaction recorded successfully.']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function getTransactions(): void
    {
        $schoolId = Database::getTenantId();
        $type     = $_GET['type'] ?? null;
        $itemId   = $_GET['item_id'] ?? null;

        $data = $this->service->getTransactions($schoolId, $type, $itemId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function getUsageReport(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->service->getUsageReport($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }
}