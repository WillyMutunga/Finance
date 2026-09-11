<?php

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class InventoryService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // ==========================================
    // 1. STORES & WAREHOUSES
    // ==========================================
    public function getStores(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT s.*, 
                   COUNT(i.id) as items_count, 
                   COALESCE(SUM(i.quantity_in_stock * i.unit_buying_price), 0) as total_valuation
            FROM inventory_stores s
            LEFT JOIN inventory_items i ON s.id = i.store_id
            WHERE s.school_id = :school_id
            GROUP BY s.id
            ORDER BY s.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createStore(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $code = trim($data['code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 6)));
        $location = trim($data['location'] ?? 'Main Campus');
        $manager = trim($data['manager'] ?? 'Storekeeper');

        if (empty($name)) {
            throw new Exception('Store name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO inventory_stores (school_id, name, code, location, manager, status)
            VALUES (:school_id, :name, :code, :loc, :mgr, 'Active')
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':name'      => $name,
            ':code'      => $code,
            ':loc'       => $location,
            ':mgr'       => $manager
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteStore(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM inventory_stores WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 2. CATEGORIES & UNITS
    // ==========================================
    public function getCategories(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT c.*, COUNT(i.id) as items_count
            FROM inventory_categories c
            LEFT JOIN inventory_items i ON c.id = i.category_id
            WHERE c.school_id = :school_id
            GROUP BY c.id
            ORDER BY c.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createCategory(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $code = trim($data['code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 6)));
        $desc = trim($data['description'] ?? '');

        if (empty($name)) {
            throw new Exception('Category name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO inventory_categories (school_id, name, code, description)
            VALUES (:school_id, :name, :code, :desc)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':name'      => $name,
            ':code'      => $code,
            ':desc'      => $desc
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteCategory(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM inventory_categories WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    public function getUnits(string $schoolId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM inventory_units WHERE school_id = :school_id ORDER BY name ASC");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createUnit(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $code = trim($data['short_code'] ?? $name);

        if (empty($name)) {
            throw new Exception('Unit name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO inventory_units (school_id, name, short_code)
            VALUES (:school_id, :name, :code)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':name'      => $name,
            ':code'      => $code
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteUnit(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM inventory_units WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 3. INVENTORY ITEMS (STOCK DIRECTORY)
    // ==========================================
    public function getItems(string $schoolId, ?string $categoryId = null, ?string $storeId = null, ?string $search = null): array
    {
        $params = [':school_id' => $schoolId];
        $where = "WHERE i.school_id = :school_id";

        if ($categoryId && $categoryId !== 'ALL') {
            $where .= " AND i.category_id = :cat_id";
            $params[':cat_id'] = $categoryId;
        }

        if ($storeId && $storeId !== 'ALL') {
            $where .= " AND i.store_id = :store_id";
            $params[':store_id'] = $storeId;
        }

        if ($search) {
            $where .= " AND (i.name ILIKE :q OR i.item_code ILIKE :q)";
            $params[':q'] = "%$search%";
        }

        $stmt = $this->db->prepare("
            SELECT i.*, 
                   c.name as category_name, 
                   s.name as store_name,
                   (i.quantity_in_stock * i.unit_buying_price) as valuation
            FROM inventory_items i
            LEFT JOIN inventory_categories c ON i.category_id = c.id
            LEFT JOIN inventory_stores s ON i.store_id = s.id
            {$where}
            ORDER BY i.name ASC
        ");
        $stmt->execute($params);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totValuation = 0.00;
        $lowStockCount = 0;
        $totalUnits = 0;

        foreach ($items as &$item) {
            $stock = (float)$item['quantity_in_stock'];
            $reorder = (int)$item['reorder_level'];
            $val = (float)$item['valuation'];

            $totValuation += $val;
            $totalUnits += $stock;

            if ($stock <= 0) {
                $item['status'] = 'Out of Stock';
                $lowStockCount++;
            } elseif ($stock <= $reorder) {
                $item['status'] = 'Low Stock';
                $lowStockCount++;
            } else {
                $item['status'] = 'In Stock';
            }
        }

        return [
            'summary' => [
                'total_items'     => count($items),
                'total_units'     => $totalUnits,
                'total_valuation' => $totValuation,
                'low_stock_count' => $lowStockCount
            ],
            'items' => $items
        ];
    }

    public function createItem(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $categoryId = !empty($data['category_id']) ? $data['category_id'] : null;
        $storeId = !empty($data['store_id']) ? $data['store_id'] : null;
        $unit = trim($data['unit_of_measure'] ?? $data['unit'] ?? 'Pieces');
        $reorder = intval($data['reorder_level'] ?? 10);
        $stock = floatval($data['quantity_in_stock'] ?? $data['inStock'] ?? 0);
        $buyingPrice = floatval($data['unit_buying_price'] ?? $data['unitCost'] ?? 0);
        $sellingPrice = floatval($data['selling_price'] ?? $data['price'] ?? round($buyingPrice * 1.25, 2));

        if (empty($name)) {
            throw new Exception('Item name is required.');
        }

        // Auto-generate Item Code
        $count = $this->db->query("SELECT COUNT(*) FROM inventory_items WHERE school_id = '{$schoolId}'")->fetchColumn();
        $itemCode = 'ITM-' . str_pad((string)($count + 1), 4, '0', STR_PAD_LEFT);

        $stmt = $this->db->prepare("
            INSERT INTO inventory_items (
                school_id, item_code, name, category_id, store_id, unit_of_measure,
                reorder_level, quantity_in_stock, unit_buying_price, selling_price, status
            ) VALUES (
                :school_id, :code, :name, :cat_id, :store_id, :unit,
                :reorder, :stock, :buying, :selling, 'In Stock'
            )
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':code'      => $itemCode,
            ':name'      => $name,
            ':cat_id'    => $categoryId,
            ':store_id'  => $storeId,
            ':unit'      => $unit,
            ':reorder'   => $reorder,
            ':stock'     => $stock,
            ':buying'    => $buyingPrice,
            ':selling'   => $sellingPrice
        ]);
        $created = $stmt->fetch(PDO::FETCH_ASSOC);

        // If starting stock is > 0, record opening stock transaction
        if ($stock > 0) {
            $this->db->prepare("
                INSERT INTO inventory_transactions (
                    school_id, item_id, store_id, transaction_type, reference_no,
                    quantity, unit_price, total_amount, issued_to, notes
                ) VALUES (
                    :sid, :item_id, :store_id, 'PURCHASE_RECEIPT', 'OPENING-STOCK',
                    :qty, :price, :tot, 'Store Opening Take-on', 'Initial inventory opening balance'
                )
            ")->execute([
                ':sid'      => $schoolId,
                ':item_id'  => $created['id'],
                ':store_id' => $storeId,
                ':qty'      => $stock,
                ':price'    => $buyingPrice,
                ':tot'      => $stock * $buyingPrice
            ]);
        }

        return $created;
    }

    public function updateItem(string $schoolId, string $id, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $categoryId = !empty($data['category_id']) ? $data['category_id'] : null;
        $storeId = !empty($data['store_id']) ? $data['store_id'] : null;
        $unit = trim($data['unit_of_measure'] ?? $data['unit'] ?? 'Pieces');
        $reorder = intval($data['reorder_level'] ?? 10);
        $buyingPrice = floatval($data['unit_buying_price'] ?? $data['unitCost'] ?? 0);
        $sellingPrice = floatval($data['selling_price'] ?? $data['price'] ?? 0);

        $stmt = $this->db->prepare("
            UPDATE inventory_items
            SET name = :name, category_id = :cat_id, store_id = :store_id, unit_of_measure = :unit,
                reorder_level = :reorder, unit_buying_price = :buying, selling_price = :selling, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([
            ':id'        => $id,
            ':school_id' => $schoolId,
            ':name'      => $name,
            ':cat_id'    => $categoryId,
            ':store_id'  => $storeId,
            ':unit'      => $unit,
            ':reorder'   => $reorder,
            ':buying'    => $buyingPrice,
            ':selling'   => $sellingPrice
        ]);
        $updated = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$updated) {
            throw new Exception('Inventory item not found.');
        }
        return $updated;
    }

    public function deleteItem(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM inventory_items WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 4. MOVEMENTS, ISSUANCES & SALES
    // ==========================================
    public function recordTransaction(string $schoolId, array $data): array
    {
        $itemId = $data['item_id'] ?? null;
        $type = strtoupper(trim($data['transaction_type'] ?? 'SALE')); // SALE, INTERNAL_ISSUE, WASTAGE_DAMAGED, STOCK_ADJUSTMENT, PURCHASE_RECEIPT
        $qty = floatval($data['quantity'] ?? 1);
        $unitPrice = floatval($data['unit_price'] ?? $data['amount'] ?? 0);
        $totalAmount = floatval($data['total_amount'] ?? ($qty * $unitPrice));
        $recipientDept = trim($data['recipient_department'] ?? $data['department'] ?? 'General');
        $issuedTo = trim($data['issued_to'] ?? $data['customer'] ?? 'Direct Walk-in');
        $paymentMethod = trim($data['payment_method'] ?? 'Cash');
        $notes = trim($data['notes'] ?? '');

        if (!$itemId) {
            throw new Exception('Item ID is required.');
        }

        $this->db->beginTransaction();
        try {
            // Check item existence and stock
            $stmtItem = $this->db->prepare("SELECT * FROM inventory_items WHERE id = :id AND school_id = :school_id FOR UPDATE");
            $stmtItem->execute([':id' => $itemId, ':school_id' => $schoolId]);
            $item = $stmtItem->fetch(PDO::FETCH_ASSOC);

            if (!$item) {
                throw new Exception('Inventory item not found.');
            }

            $currentStock = (float)$item['quantity_in_stock'];
            $newStock = $currentStock;

            // Generate Reference Code
            $count = $this->db->query("SELECT COUNT(*) FROM inventory_transactions WHERE school_id = '{$schoolId}'")->fetchColumn();
            $refPrefix = match($type) {
                'SALE'             => 'SLS-',
                'INTERNAL_ISSUE'   => 'ISS-',
                'WASTAGE_DAMAGED'  => 'WST-',
                'PURCHASE_RECEIPT' => 'RCV-',
                default            => 'ADJ-'
            };
            $refNo = $refPrefix . str_pad((string)($count + 1), 5, '0', STR_PAD_LEFT);

            if ($type === 'PURCHASE_RECEIPT') {
                $newStock = $currentStock + $qty;
            } elseif ($type === 'STOCK_ADJUSTMENT') {
                $newStock = $qty; // In direct adjustment, qty is the new verified physical count
                $qtyDiff = $newStock - $currentStock;
            } else {
                // Outflows (Sales, Issuances, Wastage)
                if ($currentStock < $qty) {
                    throw new Exception("Insufficient stock. Available: {$currentStock}, requested: {$qty}");
                }
                $newStock = $currentStock - $qty;
            }

            // 1. Insert Transaction
            $stmtTx = $this->db->prepare("
                INSERT INTO inventory_transactions (
                    school_id, item_id, store_id, transaction_type, reference_no,
                    quantity, unit_price, total_amount, recipient_department,
                    issued_to, payment_method, notes
                ) VALUES (
                    :sid, :item_id, :store_id, :type, :ref,
                    :qty, :uprice, :tot, :dept, :to, :pmethod, :notes
                )
                RETURNING *
            ");
            $stmtTx->execute([
                ':sid'     => $schoolId,
                ':item_id' => $itemId,
                ':store_id'=> $item['store_id'],
                ':type'    => $type,
                ':ref'     => $refNo,
                ':qty'     => $qty,
                ':uprice'  => $unitPrice,
                ':tot'     => $totalAmount,
                ':dept'    => $recipientDept,
                ':to'      => $issuedTo,
                ':pmethod' => $paymentMethod,
                ':notes'   => $notes
            ]);
            $tx = $stmtTx->fetch(PDO::FETCH_ASSOC);

            // 2. Update Item Stock Level
            $status = $newStock <= 0 ? 'Out of Stock' : ($newStock <= $item['reorder_level'] ? 'Low Stock' : 'In Stock');
            $stmtUpd = $this->db->prepare("
                UPDATE inventory_items
                SET quantity_in_stock = :stock, status = :status, updated_at = CURRENT_TIMESTAMP
                WHERE id = :id AND school_id = :school_id
            ");
            $stmtUpd->execute([
                ':stock'     => $newStock,
                ':status'    => $status,
                ':id'        => $itemId,
                ':school_id' => $schoolId
            ]);

            $this->db->commit();
            $tx['item_name'] = $item['name'];
            $tx['item_code'] = $item['item_code'];
            $tx['new_stock'] = $newStock;

            return $tx;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getTransactions(string $schoolId, ?string $type = null, ?string $itemId = null): array
    {
        $params = [':school_id' => $schoolId];
        $where = "WHERE t.school_id = :school_id";

        if ($type && $type !== 'ALL') {
            $where .= " AND t.transaction_type = :type";
            $params[':type'] = $type;
        }

        if ($itemId) {
            $where .= " AND t.item_id = :item_id";
            $params[':item_id'] = $itemId;
        }

        $stmt = $this->db->prepare("
            SELECT t.*, 
                   i.name as item_name, 
                   i.item_code, 
                   i.unit_of_measure,
                   s.name as store_name
            FROM inventory_transactions t
            JOIN inventory_items i ON t.item_id = i.id
            LEFT JOIN inventory_stores s ON t.store_id = s.id
            {$where}
            ORDER BY t.transaction_date DESC
        ");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ==========================================
    // 5. INVENTORY REPORTS & ANALYTICS
    // ==========================================
    public function getUsageReport(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT i.name as item_name,
                   i.item_code,
                   i.unit_of_measure,
                   i.quantity_in_stock,
                   COALESCE(SUM(CASE WHEN t.transaction_type = 'INTERNAL_ISSUE' THEN t.quantity ELSE 0 END), 0) as internal_consumed,
                   COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.quantity ELSE 0 END), 0) as total_sold,
                   COALESCE(SUM(CASE WHEN t.transaction_type = 'WASTAGE_DAMAGED' THEN t.quantity ELSE 0 END), 0) as total_wasted,
                   COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.total_amount ELSE 0 END), 0) as sales_revenue
            FROM inventory_items i
            LEFT JOIN inventory_transactions t ON i.id = t.item_id
            WHERE i.school_id = :school_id
            GROUP BY i.id, i.name, i.item_code, i.unit_of_measure, i.quantity_in_stock
            ORDER BY total_sold DESC, internal_consumed DESC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getInventoryLedger(string $schoolId, ?string $itemId = null): array
    {
        return $this->getTransactions($schoolId, null, $itemId);
    }
}