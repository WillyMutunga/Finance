<?php

namespace App\Controllers;

use App\Database;
use PDO;

class KitchenRationController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getRationLogs(): void
    {
        $schoolId = Database::getTenantId();
        $date = $_GET['date'] ?? null;

        $sql = "
            SELECT drl.*, ii.name as item_name, ii.unit_of_measure, u.name as logged_by_name
            FROM daily_ration_logs drl
            LEFT JOIN inventory_items ii ON drl.inventory_item_id = ii.id
            LEFT JOIN users u ON drl.logged_by = u.id
            WHERE drl.school_id = :school_id
        ";
        if ($date) $sql .= " AND drl.log_date = :log_date";
        $sql .= " ORDER BY drl.log_date DESC, drl.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $params = [':school_id' => $schoolId];
        if ($date) $params[':log_date'] = $date;
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $logs]);
    }

    public function logDailyRation(): void
    {
        $schoolId = Database::getTenantId();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $logDate = $input['log_date'] ?? date('Y-m-d');
        $mealType = $input['meal_type'] ?? 'LUNCH';
        $boarderCount = (int)($input['boarder_count'] ?? 0);
        $itemId = $input['inventory_item_id'] ?? null;
        $qty = (float)($input['quantity_used'] ?? 0);
        $unitCost = (float)($input['unit_cost'] ?? 0);
        $totalCost = $qty * $unitCost;

        $this->db->beginTransaction();
        try {
            // 1. Insert ration log
            $stmt = $this->db->prepare("
                INSERT INTO daily_ration_logs (
                    school_id, log_date, meal_type, boarder_count, inventory_item_id, quantity_used, unit_cost, total_cost, notes
                ) VALUES (
                    :school_id, :log_date, :meal_type, :boarder_count, :item_id, :qty, :unit_cost, :total_cost, :notes
                ) RETURNING id
            ");
            $stmt->execute([
                ':school_id'      => $schoolId,
                ':log_date'       => $logDate,
                ':meal_type'      => $mealType,
                ':boarder_count'  => $boarderCount,
                ':item_id'        => $itemId,
                ':qty'            => $qty,
                ':unit_cost'      => $unitCost,
                ':total_cost'     => $totalCost,
                ':notes'          => $input['notes'] ?? 'Kitchen meal consumption'
            ]);
            $logId = $stmt->fetchColumn();

            // 2. Automatically deduct from inventory item current stock
            if ($itemId && $qty > 0) {
                $stmtInv = $this->db->prepare("
                    UPDATE inventory_items 
                    SET quantity_in_stock = GREATEST(0, quantity_in_stock - :qty), updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id AND school_id = :school_id
                ");
                $stmtInv->execute([':qty' => $qty, ':id' => $itemId, ':school_id' => $schoolId]);
            }

            $this->db->commit();

            echo json_encode([
                'status'  => 'success',
                'message' => 'Kitchen ration logged and inventory stock updated.',
                'data'    => ['id' => $logId, 'total_cost' => $totalCost]
            ]);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function getCostAnalysis(): void
    {
        $schoolId = Database::getTenantId();
        $stmt = $this->db->prepare("
            SELECT log_date,
                   SUM(total_cost) as daily_total_cost,
                   MAX(boarder_count) as total_boarders,
                   CASE WHEN MAX(boarder_count) > 0 THEN ROUND(SUM(total_cost) / MAX(boarder_count), 2) ELSE 0 END as cost_per_boarder
            FROM daily_ration_logs
            WHERE school_id = :school_id
            GROUP BY log_date
            ORDER BY log_date DESC
            LIMIT 30
        ");
        $stmt->execute([':school_id' => $schoolId]);
        $analysis = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $analysis]);
    }
}