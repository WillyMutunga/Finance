<?php

namespace App\Services;

use App\Database;
use PDO;
use Exception;

class StaffPayrollService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // ==========================================
    // 1. STATUTORY CONFIGS & RATES
    // ==========================================
    public function getStatutoryRates(string $schoolId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM payroll_statutory_rates WHERE school_id = :school_id");
        $stmt->execute([':school_id' => $schoolId]);
        $rates = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$rates) {
            $rates = [
                'nssf_max'              => 2160.00,
                'shif_rate'             => 2.75,
                'housing_levy_employee' => 1.50,
                'housing_levy_employer' => 1.50,
                'personal_relief'       => 2400.00,
                'insurance_relief_rate' => 15.00
            ];
        } else {
            $rates['nssf_max'] = floatval($rates['nssf_max']);
            $rates['shif_rate'] = floatval($rates['shif_rate']);
            $rates['housing_levy_employee'] = floatval($rates['housing_levy_employee']);
            $rates['housing_levy_employer'] = floatval($rates['housing_levy_employer']);
            $rates['personal_relief'] = floatval($rates['personal_relief']);
            $rates['insurance_relief_rate'] = floatval($rates['insurance_relief_rate']);
        }

        return $rates;
    }

    public function updateStatutoryRates(string $schoolId, array $data): array
    {
        $nssfMax = floatval($data['nssf_max'] ?? $data['nssfMax'] ?? 2160);
        $shifRate = floatval($data['shif_rate'] ?? $data['shifRate'] ?? 2.75);
        $housingEmp = floatval($data['housing_levy_employee'] ?? $data['housingLevyEmployee'] ?? 1.5);
        $housingEmpr = floatval($data['housing_levy_employer'] ?? $data['housingLevyEmployer'] ?? 1.5);
        $personalRelief = floatval($data['personal_relief'] ?? $data['personalRelief'] ?? 2400);
        $insuranceRelief = floatval($data['insurance_relief_rate'] ?? $data['insuranceReliefRate'] ?? 15);

        $stmt = $this->db->prepare("
            INSERT INTO payroll_statutory_rates (school_id, nssf_max, shif_rate, housing_levy_employee, housing_levy_employer, personal_relief, insurance_relief_rate, updated_at)
            VALUES (:school_id, :nssf, :shif, :hemp, :hempr, :prel, :irel, CURRENT_TIMESTAMP)
            ON CONFLICT (school_id)
            DO UPDATE SET
                nssf_max = EXCLUDED.nssf_max,
                shif_rate = EXCLUDED.shif_rate,
                housing_levy_employee = EXCLUDED.housing_levy_employee,
                housing_levy_employer = EXCLUDED.housing_levy_employer,
                personal_relief = EXCLUDED.personal_relief,
                insurance_relief_rate = EXCLUDED.insurance_relief_rate,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':nssf'      => $nssfMax,
            ':shif'      => $shifRate,
            ':hemp'      => $housingEmp,
            ':hempr'     => $housingEmpr,
            ':prel'      => $personalRelief,
            ':irel'      => $insuranceRelief
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ==========================================
    // 2. DEPARTMENTS & COST CENTERS
    // ==========================================
    public function getDepartments(string $schoolId): array
    {
        $stmt = $this->db->prepare("
            SELECT d.*, COUNT(s.id) as staff_count
            FROM staff_departments d
            LEFT JOIN staff_members s ON d.name = s.department_name AND s.school_id = :school_id
            WHERE d.school_id = :school_id
            GROUP BY d.id
            ORDER BY d.name ASC
        ");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createDepartment(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $code = trim($data['code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 4)));
        $headTitle = trim($data['head_title'] ?? $data['head'] ?? 'Head of Department');
        $voteHead = trim($data['vote_head_name'] ?? $data['voteHead'] ?? 'Tuition & Teaching Materials');

        if (empty($name)) {
            throw new Exception('Department name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO staff_departments (school_id, name, code, head_title, vote_head_name)
            VALUES (:school_id, :name, :code, :head, :vote)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':name'      => $name,
            ':code'      => $code,
            ':head'      => $headTitle,
            ':vote'      => $voteHead
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteDepartment(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM staff_departments WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 3. ALLOWANCES & DEDUCTIONS BUILDER
    // ==========================================
    public function getAllowances(string $schoolId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM staff_allowance_types WHERE school_id = :school_id ORDER BY name ASC");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createAllowance(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $type = trim($data['type'] ?? 'Fixed');
        $amount = floatval($data['amount'] ?? 0);
        $taxable = !empty($data['taxable']);
        $appliesTo = trim($data['applies_to'] ?? $data['appliesTo'] ?? 'All Staff');

        if (empty($name)) {
            throw new Exception('Allowance name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO staff_allowance_types (school_id, name, type, amount, taxable, applies_to)
            VALUES (:school_id, :name, :type, :amount, :taxable, :applies)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':name'      => $name,
            ':type'      => $type,
            ':amount'    => $amount,
            ':taxable'   => $taxable ? 'true' : 'false',
            ':applies'   => $appliesTo
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteAllowance(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM staff_allowance_types WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    public function getDeductionTypes(string $schoolId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM staff_deduction_types WHERE school_id = :school_id ORDER BY name ASC");
        $stmt->execute([':school_id' => $schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createDeductionType(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $amount = floatval($data['amount'] ?? 0);
        $type = trim($data['type'] ?? 'Fixed Monthly');
        $recipient = trim($data['recipient'] ?? 'Welfare Holding Account');

        if (empty($name)) {
            throw new Exception('Deduction name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO staff_deduction_types (school_id, name, amount, type, recipient)
            VALUES (:school_id, :name, :amount, :type, :recipient)
            RETURNING *
        ");
        $stmt->execute([
            ':school_id'  => $schoolId,
            ':name'       => $name,
            ':amount'     => $amount,
            ':type'       => $type,
            ':recipient'  => $recipient
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteDeductionType(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM staff_deduction_types WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 4. STAFF MANAGEMENT (EMPLOYEE DIRECTORY)
    // ==========================================
    public function getStaffMembers(string $schoolId, ?string $department = null, ?string $search = null): array
    {
        $params = [':school_id' => $schoolId];
        $where = "WHERE school_id = :school_id";

        if ($department && $department !== 'ALL') {
            $where .= " AND department_name = :dept";
            $params[':dept'] = $department;
        }

        if ($search) {
            $where .= " AND (first_name ILIKE :q OR last_name ILIKE :q OR staff_number ILIKE :q OR role ILIKE :q)";
            $params[':q'] = "%$search%";
        }

        $stmt = $this->db->prepare("SELECT * FROM staff_members {$where} ORDER BY first_name ASC, last_name ASC");
        $stmt->execute($params);
        $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $rates = $this->getStatutoryRates($schoolId);

        // Attach live calculated metrics for each staff
        foreach ($staff as &$s) {
            $basic = floatval($s['basic_salary']);
            $allowances = floatval($s['house_allowance']) + floatval($s['commuter_allowance']) + floatval($s['other_allowances']);
            $gross = $basic + $allowances;
            $customDeds = floatval($s['custom_deductions']);

            $calc = $this->calculatePayrollForSalary($gross, $customDeds, $rates);
            $s['name'] = trim($s['first_name'] . ' ' . $s['last_name']);
            $s['dept'] = $s['department_name'] ?? 'Academic / Teaching';
            $s['gross_pay'] = $calc['gross_pay'];
            $s['nssf'] = $calc['total_nssf'];
            $s['nhif'] = $calc['shif_nhif'];
            $s['paye'] = $calc['net_paye'];
            $s['net_pay'] = $calc['net_pay'];
        }

        return $staff;
    }

    public function createStaffMember(string $schoolId, array $data): array
    {
        $name = trim($data['name'] ?? '');
        $names = explode(' ', $name, 2);
        $firstName = trim($data['first_name'] ?? $names[0] ?? '');
        $lastName = trim($data['last_name'] ?? $names[1] ?? 'Staff');
        $role = trim($data['role'] ?? 'Teacher');
        $departmentName = trim($data['department_name'] ?? $data['dept'] ?? 'Academic / Teaching');
        $phone = trim($data['phone'] ?? '+254700000000');
        $email = trim($data['email'] ?? '');
        $nationalId = trim($data['national_id'] ?? '');
        $kraPin = trim($data['kra_pin'] ?? 'A00' . rand(1000000, 9999999) . 'X');
        $nssfNo = trim($data['nssf_number'] ?? 'NSSF' . rand(100000, 999999));
        $nhifNo = trim($data['nhif_number'] ?? 'NHIF' . rand(100000, 999999));
        $bankName = trim($data['bank_name'] ?? 'Kenya Commercial Bank (KCB)');
        $bankBranch = trim($data['bank_branch'] ?? 'Machakos Branch');
        $bankAccount = trim($data['bank_account_number'] ?? '11' . rand(10000000, 99999999));
        $basicSalary = floatval($data['basic_salary'] ?? $data['gross_pay'] ?? 50000);
        $houseAlw = floatval($data['house_allowance'] ?? 0);
        $commuterAlw = floatval($data['commuter_allowance'] ?? 0);
        $otherAlw = floatval($data['other_allowances'] ?? 0);
        $customDeds = floatval($data['custom_deductions'] ?? 0);
        $status = trim($data['status'] ?? 'Active');

        // Auto-generate Staff Number
        $count = $this->db->query("SELECT COUNT(*) FROM staff_members WHERE school_id = '{$schoolId}'")->fetchColumn();
        $staffNumber = 'STF-' . str_pad((string)($count + 1), 4, '0', STR_PAD_LEFT);

        if (empty($firstName)) {
            throw new Exception('Staff first name is required.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO staff_members (
                school_id, staff_number, first_name, last_name, role, department_name, phone, email,
                national_id, kra_pin, nssf_number, nhif_number, bank_name, bank_branch, bank_account_number,
                basic_salary, house_allowance, commuter_allowance, other_allowances, custom_deductions, status
            ) VALUES (
                :school_id, :staff_no, :fname, :lname, :role, :dept, :phone, :email,
                :nid, :kra, :nssf, :nhif, :bname, :bbranch, :bacc,
                :basic, :house, :commuter, :other, :ded, :status
            )
            RETURNING *
        ");
        $stmt->execute([
            ':school_id' => $schoolId,
            ':staff_no'  => $staffNumber,
            ':fname'     => $firstName,
            ':lname'     => $lastName,
            ':role'      => $role,
            ':dept'      => $departmentName,
            ':phone'     => $phone,
            ':email'     => $email,
            ':nid'       => $nationalId,
            ':kra'       => $kraPin,
            ':nssf'      => $nssfNo,
            ':nhif'      => $nhifNo,
            ':bname'     => $bankName,
            ':bbranch'   => $bankBranch,
            ':bacc'      => $bankAccount,
            ':basic'     => $basicSalary,
            ':house'     => $houseAlw,
            ':commuter'  => $commuterAlw,
            ':other'     => $otherAlw,
            ':ded'       => $customDeds,
            ':status'    => $status
        ]);
        $created = $stmt->fetch(PDO::FETCH_ASSOC);

        $rates = $this->getStatutoryRates($schoolId);
        $gross = $basicSalary + $houseAlw + $commuterAlw + $otherAlw;
        $calc = $this->calculatePayrollForSalary($gross, $customDeds, $rates);

        $created['name'] = trim($firstName . ' ' . $lastName);
        $created['dept'] = $departmentName;
        $created['gross_pay'] = $calc['gross_pay'];
        $created['nssf'] = $calc['total_nssf'];
        $created['nhif'] = $calc['shif_nhif'];
        $created['paye'] = $calc['net_paye'];
        $created['net_pay'] = $calc['net_pay'];

        return $created;
    }

    public function updateStaffMember(string $schoolId, string $id, array $data): array
    {
        $firstName = trim($data['first_name'] ?? '');
        $lastName = trim($data['last_name'] ?? '');
        $role = trim($data['role'] ?? '');
        $departmentName = trim($data['department_name'] ?? $data['dept'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $basicSalary = floatval($data['basic_salary'] ?? $data['gross_pay'] ?? 0);
        $status = trim($data['status'] ?? 'Active');

        $stmt = $this->db->prepare("
            UPDATE staff_members
            SET first_name = :fname, last_name = :lname, role = :role, department_name = :dept, phone = :phone, basic_salary = :basic, status = :status, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND school_id = :school_id
            RETURNING *
        ");
        $stmt->execute([
            ':id'        => $id,
            ':school_id' => $schoolId,
            ':fname'     => $firstName,
            ':lname'     => $lastName,
            ':role'      => $role,
            ':dept'      => $departmentName,
            ':phone'     => $phone,
            ':basic'     => $basicSalary,
            ':status'    => $status
        ]);
        $updated = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$updated) {
            throw new Exception('Staff member not found.');
        }
        return $updated;
    }

    public function deleteStaffMember(string $schoolId, string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM staff_members WHERE id = :id AND school_id = :school_id");
        $stmt->execute([':id' => $id, ':school_id' => $schoolId]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 5. PAYROLL CALCULATOR & PROCESSING
    // ==========================================
    public function calculatePayrollForSalary(float $grossPay, float $customDeductions, array $rates): array
    {
        // 1. NSSF Calculation (Tier I & II)
        // Standard Tier I: 6% of lower limit (up to 7,000) = 420
        // Standard Tier II: 6% of upper limit (7,001 to 36,000) = up to 1,740
        $nssfTier1 = min(420.00, $grossPay * 0.06);
        $nssfTier2 = 0.00;
        if ($grossPay > 7000) {
            $nssfTier2 = min(1740.00, ($grossPay - 7000) * 0.06);
        }
        $totalNssf = min($rates['nssf_max'] ?? 2160.00, $nssfTier1 + $nssfTier2);

        // 2. SHIF / NHIF (2.75% of Gross)
        $shifRate = ($rates['shif_rate'] ?? 2.75) / 100.0;
        $shif = round($grossPay * $shifRate, 2);

        // 3. Affordable Housing Levy (1.5% of Gross)
        $housingRate = ($rates['housing_levy_employee'] ?? 1.50) / 100.0;
        $housingLevy = round($grossPay * $housingRate, 2);

        // 4. Taxable Pay (Gross less allowable NSSF deduction)
        $taxablePay = max(0, $grossPay - $totalNssf);

        // 5. Graduated PAYE Calculation (Monthly Tax Bands per Finance Act)
        $grossTax = 0.00;
        if ($taxablePay <= 24000) {
            $grossTax = $taxablePay * 0.10;
        } elseif ($taxablePay <= 32333) {
            $grossTax = (24000 * 0.10) + (($taxablePay - 24000) * 0.25);
        } elseif ($taxablePay <= 500000) {
            $grossTax = (24000 * 0.10) + (8333 * 0.25) + (($taxablePay - 32333) * 0.30);
        } elseif ($taxablePay <= 800000) {
            $grossTax = (24000 * 0.10) + (8333 * 0.25) + (467667 * 0.30) + (($taxablePay - 500000) * 0.325);
        } else {
            $grossTax = (24000 * 0.10) + (8333 * 0.25) + (467667 * 0.30) + (300000 * 0.325) + (($taxablePay - 800000) * 0.35);
        }

        // 6. Tax Reliefs
        $personalRelief = $rates['personal_relief'] ?? 2400.00;
        $insuranceRelief = min(5000.00, $shif * (($rates['insurance_relief_rate'] ?? 15.00) / 100.0));
        $totalRelief = $personalRelief + $insuranceRelief;

        $netPaye = max(0.00, $grossTax - $totalRelief);

        // 7. Total Deductions and Net Take Home
        $totalStatutory = $totalNssf + $netPaye + $shif + $housingLevy;
        $totalDeductions = $totalStatutory + $customDeductions;
        $netPay = max(0.00, $grossPay - $totalDeductions);

        return [
            'gross_pay'         => $grossPay,
            'nssf_tier_1'       => $nssfTier1,
            'nssf_tier_2'       => $nssfTier2,
            'total_nssf'        => $totalNssf,
            'taxable_pay'       => $taxablePay,
            'gross_tax'         => round($grossTax, 2),
            'personal_relief'   => $personalRelief,
            'insurance_relief'  => round($insuranceRelief, 2),
            'net_paye'          => round($netPaye, 2),
            'shif_nhif'         => $shif,
            'housing_levy'      => $housingLevy,
            'custom_deductions' => $customDeductions,
            'total_deductions'  => round($totalDeductions, 2),
            'net_pay'           => round($netPay, 2)
        ];
    }

    public function getPayrollPeriodSummary(string $schoolId, string $periodMonth = 'July 2026'): array
    {
        $rates = $this->getStatutoryRates($schoolId);
        $staffList = $this->getStaffMembers($schoolId);

        $totGross = 0.00;
        $totTaxable = 0.00;
        $totPaye = 0.00;
        $totNssf = 0.00;
        $totShif = 0.00;
        $totHousing = 0.00;
        $totCustom = 0.00;
        $totNet = 0.00;

        $payrollLines = [];

        foreach ($staffList as $s) {
            $gross = floatval($s['basic_salary']) + floatval($s['house_allowance']) + floatval($s['commuter_allowance']) + floatval($s['other_allowances']);
            $custom = floatval($s['custom_deductions']);
            $calc = $this->calculatePayrollForSalary($gross, $custom, $rates);

            $totGross += $calc['gross_pay'];
            $totTaxable += $calc['taxable_pay'];
            $totPaye += $calc['net_paye'];
            $totNssf += $calc['total_nssf'];
            $totShif += $calc['shif_nhif'];
            $totHousing += $calc['housing_levy'];
            $totCustom += $calc['custom_deductions'];
            $totNet += $calc['net_pay'];

            $payrollLines[] = [
                'staff_id'     => $s['id'],
                'staff_number' => $s['staff_number'],
                'name'         => $s['name'],
                'role'         => $s['role'],
                'dept'         => $s['dept'],
                'bank_name'    => $s['bank_name'],
                'bank_account' => $s['bank_account_number'],
                'gross_pay'    => $calc['gross_pay'],
                'nssf'         => $calc['total_nssf'],
                'nhif'         => $calc['shif_nhif'],
                'housing_levy' => $calc['housing_levy'],
                'paye'         => $calc['net_paye'],
                'custom_ded'   => $calc['custom_deductions'],
                'net_pay'      => $calc['net_pay']
            ];
        }

        // Check if saved period exists in DB
        $stmtP = $this->db->prepare("SELECT * FROM payroll_periods WHERE school_id = :school_id AND period_month = :month");
        $stmtP->execute([':school_id' => $schoolId, ':month' => $periodMonth]);
        $savedPeriod = $stmtP->fetch(PDO::FETCH_ASSOC);

        $status = $savedPeriod['status'] ?? 'Approved';

        return [
            'period_month' => $periodMonth,
            'status'       => $status,
            'summary'      => [
                'staff_count'             => count($staffList),
                'total_gross'             => $totGross,
                'total_taxable'           => $totTaxable,
                'total_paye'              => $totPaye,
                'total_nssf'              => $totNssf,
                'total_shif'              => $totShif,
                'total_housing_levy'      => $totHousing,
                'total_statutory'         => $totPaye + $totNssf + $totShif + $totHousing,
                'total_custom_deductions' => $totCustom,
                'total_net_payable'       => $totNet
            ],
            'lines' => $payrollLines
        ];
    }

    public function processMonthlyPayroll(string $schoolId, string $periodMonth, ?string $userId = null): array
    {
        $rates = $this->getStatutoryRates($schoolId);
        $staffList = $this->getStaffMembers($schoolId);

        if (empty($staffList)) {
            throw new Exception('No staff members registered. Please add staff members before processing payroll.');
        }

        $this->db->beginTransaction();
        try {
            $summary = $this->getPayrollPeriodSummary($schoolId, $periodMonth);
            $sum = $summary['summary'];

            // 1. Create or Update Payroll Period
            $stmtP = $this->db->prepare("
                INSERT INTO payroll_periods (
                    school_id, period_month, total_gross, total_taxable, total_paye, total_nssf,
                    total_shif, total_housing_levy, total_custom_deductions, total_net_payable,
                    staff_count, status, processed_by, approved_by, updated_at
                ) VALUES (
                    :school_id, :pmonth, :gross, :taxable, :paye, :nssf,
                    :shif, :housing, :custom, :net,
                    :count, 'Approved', :proc_by, :appr_by, CURRENT_TIMESTAMP
                )
                ON CONFLICT (school_id, period_month)
                DO UPDATE SET
                    total_gross = EXCLUDED.total_gross,
                    total_taxable = EXCLUDED.total_taxable,
                    total_paye = EXCLUDED.total_paye,
                    total_nssf = EXCLUDED.total_nssf,
                    total_shif = EXCLUDED.total_shif,
                    total_housing_levy = EXCLUDED.total_housing_levy,
                    total_custom_deductions = EXCLUDED.total_custom_deductions,
                    total_net_payable = EXCLUDED.total_net_payable,
                    staff_count = EXCLUDED.staff_count,
                    status = 'Approved',
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            ");
            $stmtP->execute([
                ':school_id' => $schoolId,
                ':pmonth'    => $periodMonth,
                ':gross'     => $sum['total_gross'],
                ':taxable'   => $sum['total_taxable'],
                ':paye'      => $sum['total_paye'],
                ':nssf'      => $sum['total_nssf'],
                ':shif'      => $sum['total_shif'],
                ':housing'   => $sum['total_housing_levy'],
                ':custom'    => $sum['total_custom_deductions'],
                ':net'       => $sum['total_net_payable'],
                ':count'     => $sum['staff_count'],
                ':proc_by'   => $userId,
                ':appr_by'   => $userId
            ]);
            $period = $stmtP->fetch(PDO::FETCH_ASSOC);

            // 2. Clear old payslips for this period and insert new payslips
            $delSlips = $this->db->prepare("DELETE FROM payslips WHERE payroll_period_id = :pid");
            $delSlips->execute([':pid' => $period['id']]);

            $stmtSlip = $this->db->prepare("
                INSERT INTO payslips (
                    school_id, payroll_period_id, staff_id, staff_name, staff_number, role, department,
                    kra_pin, nssf_no, nhif_no, bank_name, bank_account, basic_salary, allowances, gross_pay,
                    nssf_tier_1, nssf_tier_2, total_nssf, taxable_pay, paye_tax, personal_relief, insurance_relief,
                    net_tax_paye, shif_nhif, housing_levy, sacco_deductions, welfare_deductions,
                    loan_advance_recovery, total_deductions, net_pay, status
                ) VALUES (
                    :school_id, :pid, :staff_id, :sname, :sno, :role, :dept,
                    :kra, :nssf_no, :nhif_no, :bname, :bacc, :basic, :alw, :gross,
                    :nt1, :nt2, :tot_nssf, :taxable, :gross_tax, :prel, :irel,
                    :net_paye, :shif, :housing, :sacco, :welfare,
                    :loan, :tot_ded, :net, 'Processed'
                )
            ");

            foreach ($staffList as $s) {
                $basic = floatval($s['basic_salary']);
                $alw = floatval($s['house_allowance']) + floatval($s['commuter_allowance']) + floatval($s['other_allowances']);
                $gross = $basic + $alw;
                $custom = floatval($s['custom_deductions']);
                $calc = $this->calculatePayrollForSalary($gross, $custom, $rates);

                $stmtSlip->execute([
                    ':school_id'  => $schoolId,
                    ':pid'        => $period['id'],
                    ':staff_id'   => $s['id'],
                    ':sname'      => $s['name'],
                    ':sno'        => $s['staff_number'],
                    ':role'       => $s['role'],
                    ':dept'       => $s['dept'],
                    ':kra'        => $s['kra_pin'] ?? 'A000000000X',
                    ':nssf_no'    => $s['nssf_number'] ?? 'NSSF1234',
                    ':nhif_no'    => $s['nhif_number'] ?? 'NHIF1234',
                    ':bname'      => $s['bank_name'] ?? 'Kenya Commercial Bank',
                    ':bacc'       => $s['bank_account_number'] ?? '1100000000',
                    ':basic'      => $basic,
                    ':alw'        => $alw,
                    ':gross'      => $calc['gross_pay'],
                    ':nt1'        => $calc['nssf_tier_1'],
                    ':nt2'        => $calc['nssf_tier_2'],
                    ':tot_nssf'   => $calc['total_nssf'],
                    ':taxable'    => $calc['taxable_pay'],
                    ':gross_tax'  => $calc['gross_tax'],
                    ':prel'       => $calc['personal_relief'],
                    ':irel'       => $calc['insurance_relief'],
                    ':net_paye'   => $calc['net_paye'],
                    ':shif'       => $calc['shif_nhif'],
                    ':housing'    => $calc['housing_levy'],
                    ':sacco'      => $custom > 1000 ? $custom - 500 : 0,
                    ':welfare'    => 500,
                    ':loan'       => 0,
                    ':tot_ded'    => $calc['total_deductions'],
                    ':net'        => $calc['net_pay']
                ]);
            }

            $this->db->commit();
            return $period;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ==========================================
    // 6. PAYSLIP LOOKUP
    // ==========================================
    public function getStaffPayslip(string $schoolId, string $staffId, string $periodMonth = 'July 2026'): array
    {
        // 1. Check if finalized payslip exists in DB
        $stmt = $this->db->prepare("
            SELECT ps.*, pp.period_month
            FROM payslips ps
            JOIN payroll_periods pp ON ps.payroll_period_id = pp.id
            WHERE ps.school_id = :school_id AND ps.staff_id = :staff_id AND pp.period_month = :month
        ");
        $stmt->execute([':school_id' => $schoolId, ':staff_id' => $staffId, ':month' => $periodMonth]);
        $slip = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($slip) {
            $slip['payslip_number'] = 'PS-' . strtoupper(substr($slip['id'], 0, 8));
            return $slip;
        }

        // Otherwise generate on-the-fly preview
        $stmtS = $this->db->prepare("SELECT * FROM staff_members WHERE id = :id AND school_id = :school_id");
        $stmtS->execute([':id' => $staffId, ':school_id' => $schoolId]);
        $s = $stmtS->fetch(PDO::FETCH_ASSOC);

        if (!$s) {
            throw new Exception('Staff member not found.');
        }

        $rates = $this->getStatutoryRates($schoolId);
        $basic = floatval($s['basic_salary']);
        $alw = floatval($s['house_allowance']) + floatval($s['commuter_allowance']) + floatval($s['other_allowances']);
        $gross = $basic + $alw;
        $custom = floatval($s['custom_deductions']);
        $calc = $this->calculatePayrollForSalary($gross, $custom, $rates);

        return [
            'payslip_number'        => 'PS-PREVIEW-' . strtoupper(substr($staffId, 0, 8)),
            'staff_name'            => trim($s['first_name'] . ' ' . $s['last_name']),
            'staff_number'          => $s['staff_number'],
            'role'                  => $s['role'],
            'department'            => $s['department_name'] ?? 'Academic / Teaching',
            'kra_pin'               => $s['kra_pin'] ?? 'A001234567X',
            'nssf_no'               => $s['nssf_number'] ?? 'NSSF123456',
            'nhif_no'               => $s['nhif_number'] ?? 'NHIF123456',
            'bank_name'             => $s['bank_name'] ?? 'Kenya Commercial Bank',
            'bank_account'          => $s['bank_account_number'] ?? '1100000000',
            'period_month'          => $periodMonth,
            'basic_salary'          => $basic,
            'allowances'            => $alw,
            'gross_pay'             => $calc['gross_pay'],
            'nssf_tier_1'           => $calc['nssf_tier_1'],
            'nssf_tier_2'           => $calc['nssf_tier_2'],
            'total_nssf'            => $calc['total_nssf'],
            'taxable_pay'           => $calc['taxable_pay'],
            'paye_tax'              => $calc['gross_tax'],
            'personal_relief'       => $calc['personal_relief'],
            'insurance_relief'      => $calc['insurance_relief'],
            'net_tax_paye'          => $calc['net_paye'],
            'shif_nhif'             => $calc['shif_nhif'],
            'housing_levy'          => $calc['housing_levy'],
            'sacco_deductions'      => $custom > 500 ? $custom - 500 : 0,
            'welfare_deductions'    => 500,
            'loan_advance_recovery' => 0,
            'total_deductions'      => $calc['total_deductions'],
            'net_pay'               => $calc['net_pay'],
            'status'                => 'Preview'
        ];
    }
}