<?php
declare(strict_types=1);

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class AssetService
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getCategories(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT c.*, COUNT(a.id) as assets_count, COALESCE(SUM(a.purchase_cost), 0.00) as total_value
            FROM asset_categories c
            LEFT JOIN fixed_assets a ON c.id = a.category_id
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
        $code = trim($data['code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 4)));
        $depType = trim($data['depreciation_type'] ?? 'ANNUALLY');
        $depMethod = trim($data['depreciation_method'] ?? 'STRAIGHT_LINE');
        $depRate = floatval($data['depreciation_rate'] ?? 0);
        $desc = trim($data['description'] ?? '');

        if (empty($name)) {
            throw new Exception('Asset category name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO asset_categories (
                school_id, name, code, depreciation_type, depreciation_method, depreciation_rate, description
            ) VALUES (
                :school_id, :name, :code, :type, :method, :rate, :desc
            )
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':name'      => $name,
            ':code'      => $code,
            ':type'      => $depType,
            ':method'    => $depMethod,
            ':rate'      => $depRate,
            ':desc'      => $desc
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteCategory(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM asset_categories WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    public function getAssets(string $schoolId, ?string $categoryId = null, ?string $search = null): array
    {
        $params = [':school_id' => $schoolId];
        $where = "WHERE a.school_id = :school_id";

        if ($categoryId && $categoryId !== 'ALL') {
            $where .= " AND a.category_id = :cid";
            $params[':cid'] = $categoryId;
        }

        if ($search) {
            $where .= " AND (a.name ILIKE :q OR a.asset_tag ILIKE :q OR a.location ILIKE :q)";
            $params[':q'] = "%$search%";
        }

        $stmt = $this->db->prepare("
            SELECT a.*,
                   c.name as category_name,
                   c.depreciation_rate,
                   c.depreciation_method,
                   (sm.first_name || ' ' || sm.last_name) as custodian_name
            FROM fixed_assets a
            LEFT JOIN asset_categories c ON a.category_id = c.id
            LEFT JOIN staff_members sm ON a.custodian_id = sm.id
            {$where}
            ORDER BY a.name ASC
        ");
        $stmt->execute($params);
        $assets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalCost = 0.00;
        foreach ($assets as &$a) {
            $cost = (float)$a['purchase_cost'];
            $totalCost += $cost;
            // Simple dynamic net book value estimate based on years active
            $purchaseYear = (int)date('Y', strtotime($a['purchase_date'] ?: 'now'));
            $currentYear = (int)date('Y');
            $yearsActive = max(0, $currentYear - $purchaseYear);
            $rate = (float)($a['depreciation_rate'] ?? 10) / 100;
            $dep = min($cost, $cost * $rate * $yearsActive);
            $a['accumulated_depreciation'] = round($dep, 2);
            $a['net_book_value'] = round(max(0, $cost - $dep), 2);
        }

        return [
            'summary' => [
                'total_assets'     => count($assets),
                'total_cost_value' => $totalCost
            ],
            'assets' => $assets
        ];
    }

    public function createAsset(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $categoryId = !empty($data['category_id']) ? $data['category_id'] : null;
        $serialNo = trim($data['serial_no'] ?? '');
        $purchaseDate = $data['purchase_date'] ?? date('Y-m-d');
        $purchaseCost = floatval($data['purchase_cost'] ?? 0);
        $salvageValue = floatval($data['salvage_value'] ?? 0);
        $usefulLife = intval($data['useful_life_years'] ?? 5);
        $location = trim($data['location'] ?? 'Main Campus');
        $custodianId = !empty($data['custodian_id']) ? $data['custodian_id'] : null;
        $condition = trim($data['condition'] ?? 'Good');
        $status = trim($data['status'] ?? 'In Use');
        $notes = trim($data['notes'] ?? '');

        if (empty($name)) {
            throw new Exception('Asset name is required.');
        }

        // Auto tag
        $count = $this->db->query("SELECT COUNT(*) FROM fixed_assets WHERE school_id = '{$schoolId}'")->fetchColumn();
        $assetTag = 'AST-' . str_pad((string)($count + 1), 4, '0', STR_PAD_LEFT);

        $stmt = $this->db->prepare("
            INSERT INTO fixed_assets (
                school_id, asset_tag, name, category_id, serial_no, purchase_date,
                purchase_cost, salvage_value, useful_life_years, location, custodian_id,
                condition, status, notes
            ) VALUES (
                :school_id, :tag, :name, :cid, :serial, :pdate,
                :pcost, :salvage, :life, :loc, :custodian,
                :cond, :stat, :notes
            )
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':tag'       => $assetTag,
            ':name'      => $name,
            ':cid'       => $categoryId,
            ':serial'    => $serialNo,
            ':pdate'     => $purchaseDate,
            ':pcost'     => $purchaseCost,
            ':salvage'   => $salvageValue,
            ':life'      => $usefulLife,
            ':loc'       => $location,
            ':custodian' => $custodianId,
            ':cond'      => $condition,
            ':stat'      => $status,
            ':notes'     => $notes
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteAsset(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM fixed_assets WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }
}