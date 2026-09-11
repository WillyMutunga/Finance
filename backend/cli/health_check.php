<?php
// Pre-flight Deployment Health Check & Diagnostics CLI
echo "======================================================
";
echo "   SCHOOL FINANCE SYSTEM - PRE-FLIGHT HEALTH CHECK    
";
echo "======================================================

";

$errors = 0;
$warnings = 0;

// 1. PHP Version & Extensions Check
echo "[1/6] Checking PHP runtime & extensions...
";
$requiredExtensions = ['pdo', 'pdo_pgsql', 'openssl', 'mbstring', 'json', 'curl'];
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "  [PASS] Extension: {$ext}
";
    } else {
        echo "  [FAIL] Missing required extension: {$ext}
";
        $errors++;
    }
}

// 2. Environment & Config Check
echo "
[2/6] Checking Environment Configuration...
";
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    echo "  [PASS] .env file located
";
    $envContent = file_get_contents($envFile);
    if (strpos($envContent, 'APP_SECRET=') !== false) {
        echo "  [PASS] APP_SECRET configured
";
    } else {
        echo "  [WARN] APP_SECRET not set in .env
";
        $warnings++;
    }
} else {
    echo "  [FAIL] .env file not found in backend/
";
    $errors++;
}

// 3. Storage Permissions
echo "
[3/6] Checking Storage Directories & Permissions...
";
$dirs = [
    __DIR__ . '/../storage',
    __DIR__ . '/../storage/logs',
    __DIR__ . '/../storage/backups',
    __DIR__ . '/../storage/uploads'
];
foreach ($dirs as $d) {
    if (!is_dir($d)) @mkdir($d, 0777, true);
    if (is_writable($d)) {
        echo "  [PASS] Writable directory: " . basename($d) . "
";
    } else {
        echo "  [FAIL] Directory not writable: " . basename($d) . "
";
        $errors++;
    }
}

// 4. Database Connection & Schema Check
echo "
[4/6] Checking Database Connection & Tables...
";
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../app/' . str_replace(['App\\', '\\'], ['', '/'], $class) . '.php';
    if (file_exists($file)) require $file;
});

try {
    $db = \App\Database::getConnection();
    echo "  [PASS] PostgreSQL Database Connection Established
";
    
    $tables = $db->query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")->fetchAll(PDO::FETCH_COLUMN);
    echo "  [PASS] Found " . count($tables) . " active tables in public schema
";
    
    $criticalTables = ['students', 'classes', 'fee_structures', 'fee_invoices', 'payment_transactions', 'transaction_ledger', 'expense_vouchers', 'users'];
    foreach ($criticalTables as $ct) {
        if (in_array($ct, $tables)) {
            echo "    - Table '{$ct}': READY
";
        } else {
            echo "    - Table '{$ct}': MISSING
";
            $errors++;
        }
    }
} catch (Throwable $e) {
    echo "  [FAIL] Database Connection Error: " . $e->getMessage() . "
";
    $errors++;
}

// 5. Tamper-Evident Ledger Integrity Audit
echo "
[5/6] Verifying Cryptographic Ledger Integrity...
";
try {
    $ledgerService = new \App\Services\LedgerService();
    $tenantId = \App\Database::getTenantId();
    $audit = $ledgerService->verifyLedgerIntegrity($tenantId);
    if (!empty($audit['is_valid'])) {
        echo "  [PASS] Cryptographic SHA-256 Ledger Audit Passed (Verified: {$audit['verified_entries']}, Tampered: {$audit['tampered_entries']})
";
    } else {
        echo "  [FAIL] Ledger Integrity Check Failed!
";
        $errors++;
    }
} catch (Throwable $e) {
    echo "  [FAIL] Ledger Audit Error: " . $e->getMessage() . "
";
    $errors++;
}

// 6. Summary
echo "
======================================================
";
if ($errors === 0) {
    echo "   RESULT: ALL SYSTEMS OPERATIONAL (0 ERRORS, {$warnings} WARNINGS)
";
    echo "   READY FOR PRODUCTION DEPLOYMENT!
";
} else {
    echo "   RESULT: {$errors} ERRORS DETECTED. PLEASE FIX BEFORE DEPLOYING.
";
}
echo "======================================================
";
exit($errors === 0 ? 0 : 1);