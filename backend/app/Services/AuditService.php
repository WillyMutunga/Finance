<?php
declare(strict_types=1);

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class AuditService
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getDeletions(string $schoolId, ?string $entityType = null): array
    {
        $params = [':school_id' => $schoolId];
        $where = "WHERE d.school_id = :school_id";

        if ($entityType && $entityType !== 'ALL') {
            $where .= " AND d.entity_type = :etype";
            $params[':etype'] = $entityType;
        }

        $stmt = $this->db->prepare("
            SELECT d.*
            FROM deletion_audits d
            {$where}
            ORDER BY d.deleted_at DESC
        ");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function recordDeletion(string $schoolId, array $data): array
    {
        $entityType = strtoupper(trim($data['entity_type'] ?? 'RECORD'));
        $entityId = trim($data['entity_id'] ?? '');
        $identifier = trim($data['entity_identifier'] ?? 'Item');
        $deletedBy = trim($data['deleted_by'] ?? 'Administrator');
        $reason = trim($data['reason'] ?? 'User deletion request');
        $snapshot = !empty($data['snapshot_data']) ? json_encode($data['snapshot_data']) : '{}';

        $stmt = $this->db->prepare("
            INSERT INTO deletion_audits (
                school_id, entity_type, entity_id, entity_identifier,
                deleted_by, reason, snapshot_data, can_restore, is_restored
            ) VALUES (
                :school_id, :etype, :eid, :ident,
                :by, :reason, :snap::jsonb, TRUE, FALSE
            )
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':etype'     => $entityType,
            ':eid'       => $entityId,
            ':ident'     => $identifier,
            ':by'        => $deletedBy,
            ':reason'    => $reason,
            ':snap'      => $snapshot
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function restoreRecord(string $schoolId, string $auditId): bool
    {
        $stmt = $this->db->prepare("
            UPDATE deletion_audits 
            SET is_restored = TRUE, restored_at = CURRENT_TIMESTAMP 
            WHERE id = :id AND school_id = :school_id
        ");
        $stmt->execute([':id' => $auditId, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    public function getAuditLogs(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT al.*, al.action as user_name
            FROM audit_logs al
            WHERE al.school_id = :school_id
            ORDER BY al.created_at DESC
            LIMIT 100
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}