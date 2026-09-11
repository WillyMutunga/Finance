<?php
// Load .env if present
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            putenv("{$name}={$value}");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Front Controller & REST API Router
$corsOrigin = getenv('CORS_ALLOWED_ORIGINS') ?: '*';
header("Access-Control-Allow-Origin: {$corsOrigin}");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autoload classes
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

use App\Database;
use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\StudentController;
use App\Controllers\FeeController;
use App\Controllers\PaymentController;
use App\Controllers\ReconciliationController;
use App\Controllers\ExpenseController;
use App\Controllers\PledgeController;
use App\Controllers\ReportController;
use App\Controllers\AuditController;
use App\Controllers\ParentPortalController;
use App\Controllers\WebhookController;
use App\Controllers\AccountingController;
use App\Controllers\ConfigController;
use App\Controllers\StudentGroupController;
use App\Controllers\AdjustmentController;
use App\Controllers\SMSController;
use App\Controllers\UserController;
use App\Controllers\StaffPayrollController;
use App\Controllers\InventoryController;

// Set Tenant Context
$tenantId = $_SERVER['HTTP_X_TENANT_ID'] ?? 'a0000000-0000-0000-0000-000000000001';
Database::setTenantId($tenantId);

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Normalize base path if in subdirectory (e.g., /api/...)
$uri = preg_replace('#^/api#', '', $uri);
if (empty($uri)) $uri = '/';

try {
    // 1. Auth & Persona
    if ($uri === '/auth/login' && $method === 'POST') {
        (new AuthController())->login();
    } elseif ($uri === '/auth/me' && $method === 'GET') {
        (new AuthController())->me();
    }

    // 2. Dashboard
    elseif ($uri === '/dashboard' && $method === 'GET') {
        (new DashboardController())->index();
    }

    // 3. Students
    elseif ($uri === '/students/bulk-update' && $method === 'POST') {
        (new StudentController())->bulkUpdate();
    }
    elseif ($uri === '/students/next-admission-number' && $method === 'GET') {
        (new StudentController())->nextAdmissionNumber();
    } elseif ($uri === '/students' && $method === 'GET') {
        (new StudentController())->index();
    } elseif ($uri === '/students' && $method === 'POST') {
        (new StudentController())->create();
    } elseif (preg_match('#^/students/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'GET') {
        (new StudentController())->show($matches[1]);
    } elseif (preg_match('#^/students/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new StudentController())->update($matches[1]);
    } elseif (preg_match('#^/students/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new StudentController())->delete($matches[1]);
    }

    // 3.1 Student Groups & Activities
    elseif ($uri === '/student-groups' && $method === 'GET') {
        (new StudentGroupController())->index();
    } elseif ($uri === '/student-groups' && $method === 'POST') {
        (new StudentGroupController())->create();
    } elseif (preg_match('#^/student-groups/([a-zA-Z0-9\-]+)/members$#', $uri, $matches) && $method === 'GET') {
        (new StudentGroupController())->getMembers($matches[1]);
    } elseif (preg_match('#^/student-groups/([a-zA-Z0-9\-]+)/assign$#', $uri, $matches) && $method === 'POST') {
        (new StudentGroupController())->assignMembers($matches[1]);
    } elseif (preg_match('#^/student-groups/([a-zA-Z0-9\-]+)/members/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new StudentGroupController())->removeMember($matches[1], $matches[2]);
    }

    // 4. Fee Structures & Invoicing
    elseif ($uri === '/fees/structures' && $method === 'GET') {
        (new FeeController())->structures();
    } elseif ($uri === '/fees/structures' && $method === 'POST') {
        (new FeeController())->create();
    } elseif (preg_match('#^/fees/structures/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new FeeController())->update($matches[1]);
    } elseif (preg_match('#^/fees/structures/([a-zA-Z0-9\-]+)/update$#', $uri, $matches) && $method === 'POST') {
        (new FeeController())->update($matches[1]);
    } elseif (preg_match('#^/fees/structures/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new FeeController())->delete($matches[1]);
    } elseif ($uri === '/fees/invoices' && $method === 'GET') {
        (new FeeController())->invoices();
    } elseif ($uri === '/fees/vote-heads' && $method === 'GET') {
        (new FeeController())->voteHeads();
    } elseif ($uri === '/fees/bulk-invoice' && $method === 'POST') {
        (new FeeController())->bulkInvoice();
    } elseif ($uri === '/fees/adjustments' && $method === 'GET') {
        (new AdjustmentController())->index();
    } elseif ($uri === '/fees/adjustments' && $method === 'POST') {
        (new AdjustmentController())->create();
    }

    // 5. Payments & Collections
    elseif ($uri === '/payments' && $method === 'GET') {
        (new PaymentController())->index();
    } elseif ($uri === '/payments/manual' && $method === 'POST') {
        (new PaymentController())->recordManual();
    } elseif ($uri === '/payments/in-kind' && $method === 'GET') {
        (new AdjustmentController())->getPaymentsInKind();
    } elseif ($uri === '/payments/in-kind' && $method === 'POST') {
        (new AdjustmentController())->createPaymentInKind();
    } elseif ($uri === '/payments/bursaries' && $method === 'GET') {
        (new AdjustmentController())->getBursaries();
    } elseif ($uri === '/payments/bursaries' && $method === 'POST') {
        (new AdjustmentController())->createBursary();
    } elseif ($uri === '/payments/grants' && $method === 'GET') {
        (new AdjustmentController())->getGrants();
    } elseif ($uri === '/payments/grants' && $method === 'POST') {
        (new AdjustmentController())->createGrant();
    } elseif ($uri === '/payments/pledges' && $method === 'GET') {
        (new AdjustmentController())->getPledges();
    } elseif ($uri === '/payments/pledges' && $method === 'POST') {
        (new AdjustmentController())->createPledge();
    } elseif ($uri === '/payments/overpayments' && $method === 'GET') {
        (new PaymentController())->getOverpayments();
    } elseif ($uri === '/payments/overpayments/transfer' && $method === 'POST') {
        (new PaymentController())->transferOverpayment();
    } elseif ($uri === '/payments/reversals/request' && $method === 'POST') {
        (new PaymentController())->requestReversal();
    } elseif ($uri === '/payments/reversals/pending' && $method === 'GET') {
        (new PaymentController())->getPendingReversals();
    } elseif (preg_match('#^/payments/reversals/([a-zA-Z0-9\-]+)/approve$#', $uri, $matches) && $method === 'POST') {
        (new PaymentController())->approveReversal($matches[1]);
    } elseif (preg_match('#^/payments/reversals/([a-zA-Z0-9\-]+)/reject$#', $uri, $matches) && $method === 'POST') {
        (new PaymentController())->rejectReversal($matches[1]);
    } elseif ($uri === '/payments/reversals/reversed' && $method === 'GET') {
        (new PaymentController())->getReversedReceipts();
    } elseif (preg_match('#^/receipts/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'GET') {
        (new PaymentController())->getReceipt($matches[1]);
    }

    // 6. Automated Reconciliation & Exceptions
    elseif ($uri === '/reconciliation/exceptions' && $method === 'GET') {
        (new ReconciliationController())->exceptions();
    } elseif ($uri === '/reconciliation/auto-reconcile' && $method === 'POST') {
        (new ReconciliationController())->autoReconcileAll();
    } elseif ($uri === '/reconciliation/manual-resolve' && $method === 'POST') {
        (new ReconciliationController())->manualResolve();
    } elseif ($uri === '/reconciliation/matches' && $method === 'GET') {
        (new ReconciliationController())->matchesLog();
    }

    // 6b. Integrations & Payment Gateways (SkyPay, M-Pesa, Bank Feeds)
    elseif ($uri === '/integrations/overview' && $method === 'GET') {
        (new IntegrationController())->overview();
    } elseif ($uri === '/integrations/bank-accounts' && $method === 'GET') {
        (new IntegrationController())->bankAccounts();
    } elseif ($uri === '/integrations/bank-accounts' && $method === 'POST') {
        (new IntegrationController())->createBankAccount();
    } elseif (preg_match('#^/integrations/bank-accounts/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new IntegrationController())->updateBankAccount($matches[1]);
    } elseif (preg_match('#^/integrations/bank-accounts/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new IntegrationController())->deleteBankAccount($matches[1]);
    } elseif ($uri === '/integrations/transactions' && $method === 'GET') {
        (new IntegrationController())->transactions();
    } elseif ($uri === '/integrations/attempts' && $method === 'GET') {
        (new IntegrationController())->attempts();
    } elseif ($uri === '/integrations/stk-push' && $method === 'POST') {
        (new IntegrationController())->triggerSTKPush();
    } elseif ($uri === '/integrations/simulate-payment' && $method === 'POST') {
        (new IntegrationController())->simulatePayment();
    } elseif ($uri === '/integrations/settings' && $method === 'GET') {
        (new IntegrationController())->settings();
    } elseif ($uri === '/integrations/settings' && $method === 'POST') {
        (new IntegrationController())->updateSettings();
    }

    // 7. Expenses & Vouchers
    elseif ($uri === '/expenses' && $method === 'GET') {
        (new ExpenseController())->index();
    } elseif ($uri === '/expenses' && $method === 'POST') {
        (new ExpenseController())->create();
    } elseif ($uri === '/expenses/categories' && $method === 'GET') {
        (new ExpenseController())->categories();
    } elseif (preg_match('#^/expenses/([a-zA-Z0-9\-]+)/approve$#', $uri, $matches) && $method === 'POST') {
        (new ExpenseController())->approve($matches[1]);
    } elseif (preg_match('#^/expenses/([a-zA-Z0-9\-]+)/disburse$#', $uri, $matches) && $method === 'POST') {
        (new ExpenseController())->disburse($matches[1]);
    } elseif (preg_match('#^/expenses/([a-zA-Z0-9\-]+)/cancel$#', $uri, $matches) && $method === 'POST') {
        (new ExpenseController())->cancel($matches[1]);
    } elseif (preg_match('#^/expenses/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new ExpenseController())->cancel($matches[1]);
    } elseif ($uri === '/expenses/lpos' && $method === 'GET') {
        (new ExpenseController())->lpos();
    } elseif ($uri === '/expenses/lpos' && $method === 'POST') {
        (new ExpenseController())->createLpo();
    } elseif (preg_match('#^/expenses/lpos/([a-zA-Z0-9\-]+)/status$#', $uri, $matches) && $method === 'POST') {
        (new ExpenseController())->updateLpoStatus($matches[1]);
    } elseif ($uri === '/expenses/bills' && $method === 'GET') {
        (new ExpenseController())->bills();
    } elseif ($uri === '/expenses/bills' && $method === 'POST') {
        (new ExpenseController())->createBill();
    } elseif (preg_match('#^/expenses/bills/([a-zA-Z0-9\-]+)/pay$#', $uri, $matches) && $method === 'POST') {
        (new ExpenseController())->payBill($matches[1]);
    } elseif ($uri === '/expenses/suppliers' && $method === 'GET') {
        (new ExpenseController())->suppliers();
    } elseif ($uri === '/expenses/suppliers' && $method === 'POST') {
        (new ExpenseController())->createSupplier();
    } elseif (preg_match('#^/expenses/suppliers/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new ExpenseController())->updateSupplier($matches[1]);
    } elseif (preg_match('#^/expenses/suppliers/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new ExpenseController())->deleteSupplier($matches[1]);
    } elseif ($uri === '/expenses/supplier-take-ons' && $method === 'GET') {
        (new ExpenseController())->supplierTakeOns();
    } elseif ($uri === '/expenses/supplier-take-ons' && $method === 'POST') {
        (new ExpenseController())->createSupplierTakeOn();
    } elseif ($uri === '/expenses/fee-refunds' && $method === 'GET') {
        (new ExpenseController())->feeRefunds();
    } elseif ($uri === '/expenses/fee-refunds' && $method === 'POST') {
        (new ExpenseController())->createFeeRefund();
    } elseif (preg_match('#^/expenses/fee-refunds/([a-zA-Z0-9\-]+)/approve$#', $uri, $matches) && $method === 'POST') {
        (new ExpenseController())->approveFeeRefund($matches[1]);
    } elseif (preg_match('#^/expenses/fee-refunds/([a-zA-Z0-9\-]+)/disburse$#', $uri, $matches) && $method === 'POST') {
        (new ExpenseController())->disburseFeeRefund($matches[1]);
    } elseif ($uri === '/expenses/petty-cash' && $method === 'GET') {
        (new ExpenseController())->pettyCash();
    } elseif ($uri === '/expenses/petty-cash' && $method === 'POST') {
        (new ExpenseController())->recordPettyCash();
    }

    // 8. Other Income & Alternative Revenue Streams
    elseif ($uri === '/other-income/categories' && $method === 'GET') {
        (new OtherIncomeController())->categories();
    } elseif ($uri === '/other-income/categories' && $method === 'POST') {
        (new OtherIncomeController())->createCategory();
    } elseif ($uri === '/other-income/customers' && $method === 'GET') {
        (new OtherIncomeController())->customers();
    } elseif ($uri === '/other-income/customers' && $method === 'POST') {
        (new OtherIncomeController())->createCustomer();
    } elseif (preg_match('#^/other-income/customers/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new OtherIncomeController())->updateCustomer($matches[1]);
    } elseif (preg_match('#^/other-income/customers/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new OtherIncomeController())->deleteCustomer($matches[1]);
    } elseif ($uri === '/other-income/invoices' && $method === 'GET') {
        (new OtherIncomeController())->invoices();
    } elseif ($uri === '/other-income/invoices' && $method === 'POST') {
        (new OtherIncomeController())->createInvoice();
    } elseif (preg_match('#^/other-income/invoices/([a-zA-Z0-9\-]+)/pay$#', $uri, $matches) && $method === 'POST') {
        (new OtherIncomeController())->payInvoice($matches[1]);
    } elseif ($uri === '/other-income/receipts' && $method === 'GET') {
        (new OtherIncomeController())->receipts();
    } elseif ($uri === '/other-income/receipts' && $method === 'POST') {
        (new OtherIncomeController())->createReceipt();
    } elseif ($uri === '/other-income/take-ons' && $method === 'GET') {
        (new OtherIncomeController())->takeOns();
    } elseif ($uri === '/other-income/take-ons' && $method === 'POST') {
        (new OtherIncomeController())->createTakeOn();
    } elseif ($uri === '/other-income/donors' && $method === 'GET') {
        (new OtherIncomeController())->donors();
    } elseif ($uri === '/other-income/donors' && $method === 'POST') {
        (new OtherIncomeController())->createDonor();
    } elseif ($uri === '/other-income/donations' && $method === 'GET') {
        (new OtherIncomeController())->donations();
    } elseif ($uri === '/other-income/donations' && $method === 'POST') {
        (new OtherIncomeController())->createDonation();
    }

    // 9. Pledges
    elseif ($uri === '/pledges' && $method === 'GET') {
        (new PledgeController())->index();
    } elseif ($uri === '/pledges' && $method === 'POST') {
        (new PledgeController())->create();
    } elseif (preg_match('#^/pledges/([a-zA-Z0-9\-]+)/remind$#', $uri, $matches) && $method === 'POST') {
        (new PledgeController())->sendReminder($matches[1]);
    }

    // 9. Financial & Academic Reports
    elseif ($uri === '/reports/cashbook' && $method === 'GET') {
        (new ReportController())->cashbook();
    } elseif ($uri === '/reports/trial-balance' && $method === 'GET') {
        (new ReportController())->trialBalance();
    } elseif ($uri === '/reports/consolidated-trial-balance' && $method === 'GET') {
        (new ReportController())->consolidatedTrialBalance();
    } elseif ($uri === '/reports/fee-register' && $method === 'GET') {
        (new ReportController())->feeRegister();
    } elseif ($uri === '/reports/student-balances-per-term' && $method === 'GET') {
        (new ReportController())->studentBalancesPerTerm();
    } elseif ($uri === '/reports/student-vote-head-balances' && $method === 'GET') {
        (new ReportController())->studentVoteHeadBalances();
    } elseif ($uri === '/reports/income-summary' && $method === 'GET') {
        (new ReportController())->incomeSummary();
    } elseif ($uri === '/reports/expense-summary' && $method === 'GET') {
        (new ReportController())->expenseSummary();
    } elseif ($uri === '/reports/vote-head-summary' && $method === 'GET') {
        (new ReportController())->voteHeadSummary();
    } elseif ($uri === '/reports/student-collection-summary' && $method === 'GET') {
        (new ReportController())->studentCollectionSummary();
    } elseif ($uri === '/reports/received-cheques' && $method === 'GET') {
        (new ReportController())->receivedCheques();
    } elseif ($uri === '/reports/ipsas' && $method === 'GET') {
        (new ReportController())->ipsas();
    } elseif ($uri === '/reports/aging' && $method === 'GET') {
        (new ReportController())->aging();
    }

    // 9.1 Stores & Inventory Management
    elseif ($uri === '/inventory/stores' && $method === 'GET') {
        (new InventoryController())->getStores();
    } elseif ($uri === '/inventory/stores' && $method === 'POST') {
        (new InventoryController())->createStore();
    } elseif (preg_match('#^/inventory/stores/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new InventoryController())->deleteStore($matches[1]);
    } elseif ($uri === '/inventory/categories' && $method === 'GET') {
        (new InventoryController())->getCategories();
    } elseif ($uri === '/inventory/categories' && $method === 'POST') {
        (new InventoryController())->createCategory();
    } elseif (preg_match('#^/inventory/categories/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new InventoryController())->deleteCategory($matches[1]);
    } elseif ($uri === '/inventory/units' && $method === 'GET') {
        (new InventoryController())->getUnits();
    } elseif ($uri === '/inventory/units' && $method === 'POST') {
        (new InventoryController())->createUnit();
    } elseif (preg_match('#^/inventory/units/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new InventoryController())->deleteUnit($matches[1]);
    } elseif ($uri === '/inventory/items' && $method === 'GET') {
        (new InventoryController())->getItems();
    } elseif ($uri === '/inventory/items' && $method === 'POST') {
        (new InventoryController())->createItem();
    } elseif (preg_match('#^/inventory/items/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new InventoryController())->updateItem($matches[1]);
    } elseif (preg_match('#^/inventory/items/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new InventoryController())->deleteItem($matches[1]);
    } elseif ($uri === '/inventory/transactions' && $method === 'GET') {
        (new InventoryController())->getTransactions();
    } elseif ($uri === '/inventory/transactions' && $method === 'POST') {
        (new InventoryController())->recordTransaction();
    } elseif ($uri === '/inventory/usage-report' && $method === 'GET') {
        (new InventoryController())->getUsageReport();
    }

    // 10. Audit & Compliance
    elseif ($uri === '/audit/logs' && $method === 'GET') {
        (new AuditController())->logs();
    } elseif ($uri === '/audit/verify-ledger' && $method === 'GET') {
        (new AuditController())->verifyLedger();
    }

    // 11. Configurations (Academic Years, Terms, Classes, Streams, School Profile)
    elseif (($uri === '/school/profile' || $uri === '/school') && $method === 'GET') {
        (new ConfigController())->getSchoolProfile();
    } elseif (($uri === '/school/profile' || $uri === '/school') && ($method === 'PUT' || $method === 'POST')) {
        (new ConfigController())->updateSchoolProfile();
    } elseif ($uri === '/academic-years' && $method === 'GET') {
        (new ConfigController())->getAcademicYears();
    } elseif ($uri === '/academic-years' && $method === 'POST') {
        (new ConfigController())->createAcademicYear();
    } elseif ($uri === '/terms' && $method === 'GET') {
        (new ConfigController())->getTerms();
    } elseif ($uri === '/terms' && $method === 'POST') {
        (new ConfigController())->createTerm();
    } elseif ($uri === '/terms/set-active' && $method === 'POST') {
        (new ConfigController())->setActiveTerm();
    } elseif ($uri === '/classes' && $method === 'GET') {
        (new ConfigController())->getClasses();
    } elseif ($uri === '/classes' && $method === 'POST') {
        (new ConfigController())->createClass();
    } elseif ($uri === '/streams' && $method === 'POST') {
        (new ConfigController())->createStream();
    }

    // 12. Accounting Sub-System
    elseif ($uri === '/accounting/account-types' && $method === 'GET') {
        (new AccountingController())->getAccountTypes();
    } elseif ($uri === '/accounting/account-types' && $method === 'POST') {
        (new AccountingController())->createAccountType();
    } elseif (preg_match('#^/accounting/account-types/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new AccountingController())->updateAccountType($matches[1]);
    } elseif (preg_match('#^/accounting/account-types/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new AccountingController())->deleteAccountType($matches[1]);
    } elseif ($uri === '/accounting/vote-heads' && $method === 'GET') {
        (new AccountingController())->getVoteHeads();
    } elseif ($uri === '/accounting/vote-heads' && $method === 'POST') {
        (new AccountingController())->createVoteHead();
    } elseif (preg_match('#^/accounting/vote-heads/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new AccountingController())->updateVoteHead($matches[1]);
    } elseif (preg_match('#^/accounting/vote-heads/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new AccountingController())->deleteVoteHead($matches[1]);
    } elseif ($uri === '/accounting/accounts' && $method === 'GET') {
        (new AccountingController())->getAccounts();
    } elseif ($uri === '/accounting/accounts' && $method === 'POST') {
        (new AccountingController())->createAccount();
    } elseif (preg_match('#^/accounting/accounts/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new AccountingController())->updateAccount($matches[1]);
    } elseif (preg_match('#^/accounting/accounts/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new AccountingController())->deleteAccount($matches[1]);
    } elseif ($uri === '/accounting/take-ons' && $method === 'GET') {
        (new AccountingController())->getTakeOns();
    } elseif ($uri === '/accounting/take-ons' && $method === 'POST') {
        (new AccountingController())->createTakeOn();
    } elseif (preg_match('#^/accounting/take-ons/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new AccountingController())->deleteTakeOn($matches[1]);
    } elseif ($uri === '/accounting/transfers' && $method === 'GET') {
        (new AccountingController())->getTransfers();
    } elseif ($uri === '/accounting/transfers' && $method === 'POST') {
        (new AccountingController())->createTransfer();
    } elseif ($uri === '/accounting/budgets' && $method === 'GET') {
        (new AccountingController())->getBudgets();
    } elseif ($uri === '/accounting/budgets' && $method === 'POST') {
        (new AccountingController())->setBudget();
    } elseif ($uri === '/accounting/journal' && $method === 'GET') {
        (new AccountingController())->getJournalEntries();
    } elseif ($uri === '/accounting/journal' && $method === 'POST') {
        (new AccountingController())->createJournalEntry();
    } elseif ($uri === '/accounting/general-ledger' && $method === 'GET') {
        (new AccountingController())->getGeneralLedger();
    }

    // 13. Parent Portal (Mobile-First / PWA)
    elseif (preg_match('#^/parent/student/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'GET') {
        (new ParentPortalController())->studentSummary($matches[1]);
    } elseif ($uri === '/parent/pay-stk' && $method === 'POST') {
        (new ParentPortalController())->paySTK();
    }

    // 14. SMS Communication
    elseif ($uri === '/sms/logs' && $method === 'GET') {
        (new SMSController())->logs();
    } elseif ($uri === '/sms/send-bulk' && $method === 'POST') {
        (new SMSController())->sendBulk();
    }

    // 15. User Management & Roles
    elseif ($uri === '/users' && $method === 'GET') {
        (new UserController())->index();
    } elseif ($uri === '/users' && $method === 'POST') {
        (new UserController())->create();
    } elseif (preg_match('#^/users/([a-zA-Z0-9\-]+)/status$#', $uri, $matches) && $method === 'POST') {
        (new UserController())->updateStatus($matches[1]);
    } elseif (preg_match('#^/users/([a-zA-Z0-9\-]+)/reset-password$#', $uri, $matches) && $method === 'POST') {
        (new UserController())->resetPassword($matches[1]);
    } elseif (preg_match('#^/users/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new UserController())->delete($matches[1]);
    }

    // 15b. Staff & Payroll Management
    elseif ($uri === '/staff/statutory-rates' && $method === 'GET') {
        (new StaffPayrollController())->getStatutoryRates();
    } elseif ($uri === '/staff/statutory-rates' && $method === 'POST') {
        (new StaffPayrollController())->updateStatutoryRates();
    } elseif ($uri === '/staff/departments' && $method === 'GET') {
        (new StaffPayrollController())->getDepartments();
    } elseif ($uri === '/staff/departments' && $method === 'POST') {
        (new StaffPayrollController())->createDepartment();
    } elseif (preg_match('#^/staff/departments/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new StaffPayrollController())->deleteDepartment($matches[1]);
    } elseif ($uri === '/staff/allowances' && $method === 'GET') {
        (new StaffPayrollController())->getAllowances();
    } elseif ($uri === '/staff/allowances' && $method === 'POST') {
        (new StaffPayrollController())->createAllowance();
    } elseif (preg_match('#^/staff/allowances/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new StaffPayrollController())->deleteAllowance($matches[1]);
    } elseif ($uri === '/staff/deductions' && $method === 'GET') {
        (new StaffPayrollController())->getDeductions();
    } elseif ($uri === '/staff/deductions' && $method === 'POST') {
        (new StaffPayrollController())->createDeduction();
    } elseif (preg_match('#^/staff/deductions/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new StaffPayrollController())->deleteDeduction($matches[1]);
    } elseif ($uri === '/staff/members' && $method === 'GET') {
        (new StaffPayrollController())->getStaff();
    } elseif ($uri === '/staff/members' && $method === 'POST') {
        (new StaffPayrollController())->createStaff();
    } elseif (preg_match('#^/staff/members/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
        (new StaffPayrollController())->updateStaff($matches[1]);
    } elseif (preg_match('#^/staff/members/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'DELETE') {
        (new StaffPayrollController())->deleteStaff($matches[1]);
    } elseif ($uri === '/payroll/period' && $method === 'GET') {
        (new StaffPayrollController())->getPayrollPeriod();
    } elseif ($uri === '/payroll/process' && $method === 'POST') {
        (new StaffPayrollController())->processPayroll();
    } elseif (preg_match('#^/payroll/payslip/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'GET') {
        (new StaffPayrollController())->getPayslip($matches[1]);
    }

        // 17. Transport Management
    elseif ($uri === '/transport/vehicles' && $method === 'GET') {
        (new \App\Controllers\TransportController())->getVehicles();
    } elseif ($uri === '/transport/vehicles' && $method === 'POST') {
        (new \App\Controllers\TransportController())->createVehicle();
    } elseif (preg_match('#^/transport/vehicles/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new \App\Controllers\TransportController())->deleteVehicle($matches[1]);
    } elseif ($uri === '/transport/routes' && $method === 'GET') {
        (new \App\Controllers\TransportController())->getRoutes();
    } elseif ($uri === '/transport/routes' && $method === 'POST') {
        (new \App\Controllers\TransportController())->createRoute();
    } elseif (preg_match('#^/transport/routes/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new \App\Controllers\TransportController())->deleteRoute($matches[1]);
    } elseif ($uri === '/transport/students' && $method === 'GET') {
        (new \App\Controllers\TransportController())->getStudents();
    } elseif ($uri === '/transport/students/assign' && $method === 'POST') {
        (new \App\Controllers\TransportController())->assignStudent();
    } elseif (preg_match('#^/transport/students/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new \App\Controllers\TransportController())->deleteStudent($matches[1]);
    } elseif ($uri === '/transport/logs' && $method === 'GET') {
        (new \App\Controllers\TransportController())->getLogs();
    } elseif ($uri === '/transport/logs' && $method === 'POST') {
        (new \App\Controllers\TransportController())->createLog();
    }

    // 18. Pocket Money / Student Wallets
    elseif ($uri === '/pocket-money/wallets' && $method === 'GET') {
        (new \App\Controllers\PocketMoneyController())->getWallets();
    } elseif ($uri === '/pocket-money/transactions' && $method === 'GET') {
        (new \App\Controllers\PocketMoneyController())->getTransactions();
    } elseif ($uri === '/pocket-money/transactions' && $method === 'POST') {
        (new \App\Controllers\PocketMoneyController())->recordTransaction();
    } elseif ($uri === '/pocket-money/deposit' && $method === 'POST') {
        $_POST['transaction_type'] = 'DEPOSIT';
        (new \App\Controllers\PocketMoneyController())->recordTransaction();
    } elseif ($uri === '/pocket-money/withdraw' && $method === 'POST') {
        $_POST['transaction_type'] = 'WITHDRAWAL';
        (new \App\Controllers\PocketMoneyController())->recordTransaction();
    }

    // 19. Assets Register & Categories
    elseif ($uri === '/assets/categories' && $method === 'GET') {
        (new \App\Controllers\AssetController())->getCategories();
    } elseif ($uri === '/assets/categories' && $method === 'POST') {
        (new \App\Controllers\AssetController())->createCategory();
    } elseif (preg_match('#^/assets/categories/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new \App\Controllers\AssetController())->deleteCategory($matches[1]);
    } elseif ($uri === '/assets' && $method === 'GET') {
        (new \App\Controllers\AssetController())->getAssets();
    } elseif ($uri === '/assets' && $method === 'POST') {
        (new \App\Controllers\AssetController())->createAsset();
    } elseif (preg_match('#^/assets/([a-zA-Z0-9\-]+)$#', $uri, $matches) && ($method === 'DELETE' || $method === 'POST')) {
        (new \App\Controllers\AssetController())->deleteAsset($matches[1]);
    }

    // 20. Deletion Logs & Audit
    elseif ($uri === '/audit/deletions' && $method === 'GET') {
        (new \App\Controllers\AuditController())->getDeletions();
    } elseif ($uri === '/audit/restore' && $method === 'POST') {
        (new \App\Controllers\AuditController())->restoreDeletion();
    } elseif ($uri === '/audit/logs' && $method === 'GET') {
        (new \App\Controllers\AuditController())->getLogs();
    } elseif ($uri === '/audit/verify-ledger' && ($method === 'GET' || $method === 'POST')) {
        (new \App\Controllers\AuditController())->verifyLedger();
    }

    // 21. Enhanced Messaging Routes
    elseif ($uri === '/messaging/sms-logs' && $method === 'GET') {
        (new \App\Controllers\SMSController())->logs();
    } elseif ($uri === '/messaging/send-broadcast' && $method === 'POST') {
        (new \App\Controllers\SMSController())->sendBulk();
    }

        // 22. Configurations & Institution Profile
    elseif ($uri === '/config/school' && $method === 'GET') {
        (new \App\Controllers\ConfigController())->getSchoolProfile();
    } elseif ($uri === '/config/school' && $method === 'POST') {
        (new \App\Controllers\ConfigController())->updateSchoolProfile();
    } elseif ($uri === '/config/academic-years' && $method === 'GET') {
        (new \App\Controllers\ConfigController())->getAcademicYears();
    } elseif ($uri === '/config/academic-years' && $method === 'POST') {
        (new \App\Controllers\ConfigController())->createAcademicYear();
    } elseif ($uri === '/config/terms' && $method === 'GET') {
        (new \App\Controllers\ConfigController())->getTerms();
    } elseif ($uri === '/config/terms' && $method === 'POST') {
        (new \App\Controllers\ConfigController())->createTerm();
    } elseif ($uri === '/config/vote-heads' && $method === 'GET') {
        (new \App\Controllers\ConfigController())->getVoteHeads();
    } elseif ($uri === '/config/vote-heads' && $method === 'POST') {
        (new \App\Controllers\ConfigController())->createVoteHead();
    } elseif ($uri === '/config/accounts' && $method === 'GET') {
        (new \App\Controllers\ConfigController())->getAccounts();
    } elseif ($uri === '/config/accounts' && $method === 'POST') {
        (new \App\Controllers\ConfigController())->createAccount();
    }

    // 23. Bank Statements & Bank Reconciliation
    elseif ($uri === '/bank-recon/statements' && $method === 'GET') {
        (new \App\Controllers\BankReconController())->getStatements();
    } elseif ($uri === '/bank-recon/upload' && $method === 'POST') {
        (new \App\Controllers\BankReconController())->uploadStatement();
    } elseif (preg_match('#^/bank-recon/statements/([a-zA-Z0-9\-]+)/lines$#', $uri, $matches) && $method === 'GET') {
        (new \App\Controllers\BankReconController())->getStatementLines($matches[1]);
    } elseif ($uri === '/bank-recon/match-line' && $method === 'POST') {
        (new \App\Controllers\BankReconController())->matchLine();
    } elseif ($uri === '/bank-recon/reports' && $method === 'GET') {
        (new \App\Controllers\BankReconController())->getReconciliationReports();
    } elseif ($uri === '/bank-recon/reports' && $method === 'POST') {
        (new \App\Controllers\BankReconController())->createReconciliationReport();
    }

    // 24. End-of-Term Rollover & Student Promotions
    elseif ($uri === '/promotions' && $method === 'GET') {
        (new \App\Controllers\PromotionController())->getPromotions();
    } elseif ($uri === '/promotions/preview' && $method === 'GET') {
        (new \App\Controllers\PromotionController())->previewPromotion();
    } elseif ($uri === '/promotions/execute' && $method === 'POST') {
        (new \App\Controllers\PromotionController())->executePromotion();
    }

    // 25. Sibling Discounts & Sponsor Bursary Management
    elseif ($uri === '/sponsors/sibling-rules' && $method === 'GET') {
        (new \App\Controllers\SponsorDiscountController())->getSiblingRules();
    } elseif ($uri === '/sponsors/sibling-rules' && $method === 'POST') {
        (new \App\Controllers\SponsorDiscountController())->createSiblingRule();
    } elseif ($uri === '/sponsors/siblings-detected' && $method === 'GET') {
        (new \App\Controllers\SponsorDiscountController())->detectSiblings();
    } elseif ($uri === '/sponsors' && $method === 'GET') {
        (new \App\Controllers\SponsorDiscountController())->getSponsors();
    } elseif ($uri === '/sponsors' && $method === 'POST') {
        (new \App\Controllers\SponsorDiscountController())->createSponsor();
    } elseif ($uri === '/sponsors/allocations' && $method === 'GET') {
        (new \App\Controllers\SponsorDiscountController())->getAllocations();
    } elseif ($uri === '/sponsors/allocations' && $method === 'POST') {
        (new \App\Controllers\SponsorDiscountController())->createAllocation();
    }

    // 26. Student Fee Clearance Workflow
    elseif ($uri === '/clearance/requests' && $method === 'GET') {
        (new \App\Controllers\ClearanceController())->getClearanceRequests();
    } elseif ($uri === '/clearance/requests' && $method === 'POST') {
        (new \App\Controllers\ClearanceController())->createClearanceRequest();
    } elseif (preg_match('#^/clearance/audit/([a-zA-Z0-9\-]+)$#', $uri, $matches) && $method === 'GET') {
        (new \App\Controllers\ClearanceController())->auditStudentClearance($matches[1]);
    }

    // 27. Kitchen Rations & Boarding Cost Calculator
    elseif ($uri === '/kitchen/rations' && $method === 'GET') {
        (new \App\Controllers\KitchenRationController())->getRationLogs();
    } elseif ($uri === '/kitchen/rations' && $method === 'POST') {
        (new \App\Controllers\KitchenRationController())->logDailyRation();
    } elseif ($uri === '/kitchen/cost-analysis' && $method === 'GET') {
        (new \App\Controllers\KitchenRationController())->getCostAnalysis();
    }

    // 16. External Webhooks & M-Pesa Simulator
    elseif ($uri === '/webhooks/mpesa/c2b-confirmation' && $method === 'POST') {
        (new WebhookController())->mpesaC2BConfirmation();
    } elseif ($uri === '/webhooks/mpesa/c2b-validation' && $method === 'POST') {
        (new WebhookController())->mpesaC2BValidation();
    } elseif ($uri === '/webhooks/mpesa/stk-callback' && $method === 'POST') {
        (new WebhookController())->mpesaSTKCallback();
    } elseif ($uri === '/webhooks/mpesa/simulate-c2b' && $method === 'POST') {
        (new WebhookController())->simulateC2B();
    }

    // Health check
    elseif ($uri === '/' || $uri === '/health') {
        echo json_encode([
            'status'     => 'online',
            'system'     => 'School Fees & Finance Management API',
            'version'    => '1.0.0',
            'tenant'     => Database::getTenantId(),
            'compliance' => 'Audit-Ready Immutable Ledger (SHA-256)'
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => "Route not found: {$method} {$uri}"]);
    }
} catch (\Throwable $e) {
    http_response_code(500);
    $logDir = __DIR__ . '/../storage/logs';
    if (!is_dir($logDir)) @mkdir($logDir, 0777, true);
    $logMsg = sprintf("[%s] %s: %s in %s:%d\nStack trace:\n%s\n\n", date('Y-m-d H:i:s'), get_class($e), $e->getMessage(), $e->getFile(), $e->getLine(), $e->getTraceAsString());
    @file_put_contents("{$logDir}/app.log", $logMsg, FILE_APPEND);

    $isDebug = (getenv('APP_DEBUG') === 'true' || getenv('APP_ENV') === 'development');
    if ($isDebug) {
        echo json_encode([
            'status'  => 'error',
            'message' => $e->getMessage(),
            'file'    => basename($e->getFile()),
            'line'    => $e->getLine()
        ]);
    } else {
        echo json_encode([
            'status'  => 'error',
            'message' => 'An internal server error occurred. Please contact the administrator.'
        ]);
    }
}
