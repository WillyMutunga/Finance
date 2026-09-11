<?php
declare(strict_types=1);

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class TransportService
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getVehicles(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT v.*,
                   COUNT(DISTINCT r.id) as routes_count,
                   COUNT(DISTINCT s.id) as assigned_students
            FROM transport_vehicles v
            LEFT JOIN transport_routes r ON v.id = r.vehicle_id
            LEFT JOIN student_transport_subscriptions s ON v.id = s.vehicle_id AND s.status = 'Active'
            WHERE v.school_id = :school_id
            GROUP BY v.id
            ORDER BY v.reg_no ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createVehicle(string $schoolId, array $data): array
    {
        $regNo = strtoupper(trim($data['reg_no'] ?? $data['regNo'] ?? ''));
        $model = trim($data['model'] ?? 'Isuzu Bus');
        $capacity = intval($data['capacity'] ?? 51);
        $driverName = trim($data['driver_name'] ?? $data['driverName'] ?? '');
        $driverPhone = trim($data['driver_phone'] ?? $data['driverPhone'] ?? '');
        $status = trim($data['status'] ?? 'Active');
        $mileage = floatval($data['mileage'] ?? 0);
        $insuranceExpiry = !empty($data['insurance_expiry']) ? $data['insurance_expiry'] : null;

        if (empty($regNo)) {
            throw new Exception('Vehicle registration number is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO transport_vehicles (
                school_id, reg_no, model, capacity, driver_name, driver_phone,
                status, mileage, insurance_expiry
            ) VALUES (
                :school_id, :reg_no, :model, :capacity, :driver_name, :driver_phone,
                :status, :mileage, :insurance_expiry
            )
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'        => $schoolId,
            ':reg_no'           => $regNo,
            ':model'            => $model,
            ':capacity'         => $capacity,
            ':driver_name'      => $driverName,
            ':driver_phone'     => $driverPhone,
            ':status'           => $status,
            ':mileage'          => $mileage,
            ':insurance_expiry' => $insuranceExpiry
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteVehicle(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM transport_vehicles WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    public function getRoutes(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT r.*,
                   v.reg_no as vehicle_reg,
                   v.model as vehicle_model,
                   v.driver_name,
                   v.driver_phone,
                   COUNT(s.id) as student_count
            FROM transport_routes r
            LEFT JOIN transport_vehicles v ON r.vehicle_id = v.id
            LEFT JOIN student_transport_subscriptions s ON r.id = s.route_id AND s.status = 'Active'
            WHERE r.school_id = :school_id
            GROUP BY r.id, v.reg_no, v.model, v.driver_name, v.driver_phone
            ORDER BY r.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createRoute(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $pickupPoints = trim($data['pickup_points'] ?? $data['pickupPoints'] ?? '');
        $termFee = floatval($data['term_fee'] ?? $data['termFee'] ?? $data['fee'] ?? 0);
        $vehicleId = !empty($data['vehicle_id']) ? $data['vehicle_id'] : null;
        $returnTripType = trim($data['return_trip_type'] ?? 'TWO_WAY');

        if (empty($name)) {
            throw new Exception('Route name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO transport_routes (
                school_id, name, pickup_points, term_fee, vehicle_id, return_trip_type
            ) VALUES (
                :school_id, :name, :pickup_points, :term_fee, :vehicle_id, :return_trip_type
            )
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'        => $schoolId,
            ':name'             => $name,
            ':pickup_points'    => $pickupPoints,
            ':term_fee'         => $termFee,
            ':vehicle_id'       => $vehicleId,
            ':return_trip_type' => $returnTripType
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteRoute(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM transport_routes WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    public function getStudentSubscriptions(string $schoolId, ?string $routeId = null): array
    {
        $params = [':school_id' => $schoolId];
        $where = "WHERE s.school_id = :school_id";

        if ($routeId && $routeId !== 'ALL') {
            $where .= " AND s.route_id = :route_id";
            $params[':route_id'] = $routeId;
        }

        $stmt = $this->db->prepare("
            SELECT s.*,
                   st.admission_number as adm_no,
                   st.first_name,
                   st.last_name,
                   (st.first_name || ' ' || st.last_name) as student_name,
                   c.name as class_name,
                   r.name as route_name,
                   v.reg_no as vehicle_reg
            FROM student_transport_subscriptions s
            JOIN students st ON s.student_id = st.id
            LEFT JOIN classes c ON st.class_id = c.id
            JOIN transport_routes r ON s.route_id = r.id
            LEFT JOIN transport_vehicles v ON s.vehicle_id = v.id OR r.vehicle_id = v.id
            {$where}
            ORDER BY st.first_name ASC
        ");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function assignStudent(string $schoolId, array $data): array
    {
        $studentId = $data['student_id'] ?? null;
        $routeId = $data['route_id'] ?? null;
        $pickupPoint = trim($data['pickup_point'] ?? $data['pickupPoint'] ?? '');
        $termFee = floatval($data['term_fee'] ?? $data['termFee'] ?? 0);

        if (!$studentId || !$routeId) {
            throw new Exception('Student and Route are required.');
        }

        if ($termFee <= 0) {
            $rStmt = $this->db->prepare("SELECT term_fee, vehicle_id FROM transport_routes WHERE id = :id");
            $rStmt->execute([':id' => $routeId]);
            $routeInfo = $rStmt->fetch(PDO::FETCH_ASSOC);
            if ($routeInfo) {
                $termFee = (float)$routeInfo['term_fee'];
                $vehicleId = $routeInfo['vehicle_id'];
            }
        }

        $stmt = $this->db->prepare("
            INSERT INTO student_transport_subscriptions (
                school_id, student_id, route_id, vehicle_id, pickup_point, term_fee, status
            ) VALUES (
                :school_id, :student_id, :route_id, :vehicle_id, :pickup_point, :term_fee, 'Active'
            )
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'    => $schoolId,
            ':student_id'   => $studentId,
            ':route_id'     => $routeId,
            ':vehicle_id'   => $vehicleId ?? null,
            ':pickup_point' => $pickupPoint,
            ':term_fee'     => $termFee
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteStudentSubscription(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM student_transport_subscriptions WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    public function getLogs(string $schoolId, ?string $vehicleId = null): array
    {
        $params = [':school_id' => $schoolId];
        $where = "WHERE l.school_id = :school_id";

        if ($vehicleId) {
            $where .= " AND l.vehicle_id = :vid";
            $params[':vid'] = $vehicleId;
        }

        $stmt = $this->db->prepare("
            SELECT l.*,
                   v.reg_no as vehicle_reg,
                   v.model as vehicle_model
            FROM transport_logs l
            JOIN transport_vehicles v ON l.vehicle_id = v.id
            {$where}
            ORDER BY l.log_date DESC, l.created_at DESC
        ");
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createLog(string $schoolId, array $data): array
    {
        $vehicleId = $data['vehicle_id'] ?? null;
        $type = strtoupper(trim($data['log_type'] ?? 'FUEL'));
        $amount = floatval($data['amount'] ?? 0);
        $odometer = floatval($data['odometer_reading'] ?? 0);
        $vendor = trim($data['vendor'] ?? '');
        $notes = trim($data['notes'] ?? '');
        $date = $data['log_date'] ?? date('Y-m-d');

        if (!$vehicleId) {
            throw new Exception('Vehicle is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO transport_logs (
                school_id, vehicle_id, log_type, amount, odometer_reading, vendor, notes, log_date
            ) VALUES (
                :school_id, :vehicle_id, :log_type, :amount, :odometer, :vendor, :notes, :log_date
            )
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'   => $schoolId,
            ':vehicle_id'  => $vehicleId,
            ':log_type'    => $type,
            ':amount'      => $amount,
            ':odometer'    => $odometer,
            ':vendor'      => $vendor,
            ':notes'       => $notes,
            ':log_date'    => $date
        ]);

        if ($odometer > 0) {
            $this->db->prepare("UPDATE transport_vehicles SET mileage = :m WHERE id = :id AND school_id = :sid")
                ->execute([':m' => $odometer, ':id' => $vehicleId, ':sid' => $schoolId]);
        }

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}