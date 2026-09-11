<?php

namespace App\Controllers;

use App\Database;
use App\Services\ReportService;

class ReportController
{
    private ReportService $reportService;

    public function __construct()
    {
        $this->reportService = new ReportService();
    }

    public function cashbook(): void
    {
        $schoolId      = Database::getTenantId();
        $accountTypeId = $_GET['account_type_id'] ?? null;
        $bankAccountId = $_GET['bank_account_id'] ?? null;
        $month         = $_GET['month'] ?? null;
        $year          = $_GET['year'] ?? null;
        $startDate     = $_GET['start_date'] ?? null;
        $endDate       = $_GET['end_date'] ?? null;

        $data = $this->reportService->getCashbook($schoolId, $accountTypeId, $bankAccountId, $month, $year, $startDate, $endDate);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function trialBalance(): void
    {
        $schoolId = Database::getTenantId();
        $asOfDate = $_GET['as_of_date'] ?? null;

        $data = $this->reportService->getTrialBalance($schoolId, $asOfDate);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function consolidatedTrialBalance(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->reportService->getConsolidatedTrialBalance($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function feeRegister(): void
    {
        $schoolId       = Database::getTenantId();
        $classId        = $_GET['class_id'] ?? null;
        $termId         = $_GET['term_id'] ?? null;
        $academicYearId = $_GET['academic_year_id'] ?? null;
        $status         = $_GET['status'] ?? null;
        $search         = $_GET['search'] ?? $_GET['q'] ?? null;

        $data = $this->reportService->getFeeRegister($schoolId, $classId, $termId, $academicYearId, $status, $search);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function studentBalancesPerTerm(): void
    {
        $schoolId       = Database::getTenantId();
        $academicYearId = $_GET['academic_year_id'] ?? null;
        $classId        = $_GET['class_id'] ?? null;

        $data = $this->reportService->getStudentBalancesPerTerm($schoolId, $academicYearId, $classId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function studentVoteHeadBalances(): void
    {
        $schoolId = Database::getTenantId();
        $classId  = $_GET['class_id'] ?? null;

        $data = $this->reportService->getStudentVoteHeadBalances($schoolId, $classId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function incomeSummary(): void
    {
        $schoolId    = Database::getTenantId();
        $startDate   = $_GET['start_date'] ?? null;
        $endDate     = $_GET['end_date'] ?? null;
        $summaryBy   = $_GET['summary_by'] ?? 'vote_head';
        $accountType = $_GET['account_type'] ?? null;

        $data = $this->reportService->getIncomeSummary($schoolId, $startDate, $endDate, $summaryBy, $accountType);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function expenseSummary(): void
    {
        $schoolId   = Database::getTenantId();
        $startDate  = $_GET['start_date'] ?? null;
        $endDate    = $_GET['end_date'] ?? null;
        $categoryId = $_GET['category_id'] ?? null;

        $data = $this->reportService->getExpenseSummary($schoolId, $startDate, $endDate, $categoryId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function voteHeadSummary(): void
    {
        $schoolId = Database::getTenantId();
        $year     = $_GET['year'] ?? '2026';

        $data = $this->reportService->getVoteHeadSummary($schoolId, $year);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function studentCollectionSummary(): void
    {
        $schoolId = Database::getTenantId();
        $termId   = $_GET['term_id'] ?? null;

        $data = $this->reportService->getStudentCollectionSummary($schoolId, $termId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function receivedCheques(): void
    {
        $schoolId = Database::getTenantId();
        $data = $this->reportService->getReceivedCheques($schoolId);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function ipsas(): void
    {
        $schoolId      = Database::getTenantId();
        $financialYear = $_GET['financial_year'] ?? '2026/2027';

        $data = $this->reportService->getIpsasStatements($schoolId, $financialYear);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }

    public function aging(): void
    {
        $schoolId = Database::getTenantId();
        $type     = $_GET['type'] ?? 'suppliers';

        $data = $this->reportService->getAgingReports($schoolId, $type);
        echo json_encode(['status' => 'success', 'data' => $data]);
    }
}