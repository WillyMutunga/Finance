<?php

$config = require __DIR__ . '/config/database.php';

try {
    $dsn = "pgsql:host={$config['host']};port={$config['port']};dbname={$config['database']};sslmode={$config['sslmode']}";
    echo "Connecting to: {$dsn} as {$config['username']}...\n";
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "Connected successfully!\n";

    $sql = file_get_contents(__DIR__ . '/database/schema.sql');
    $pdo->exec($sql);
    echo "Schema executed successfully!\n";

    // Ensure Default School Tenant exists
    $schoolStmt = $pdo->prepare("SELECT COUNT(*) FROM schools WHERE id = 'a0000000-0000-0000-0000-000000000001'");
    $schoolStmt->execute();
    if ((int)$schoolStmt->fetchColumn() === 0) {
        $insertSchool = $pdo->prepare("
            INSERT INTO schools (id, name, code, subdomain, email, phone, address, currency, mpesa_paybill, sms_sender_id)
            VALUES (
                'a0000000-0000-0000-0000-000000000001',
                'NDUUNDUNE SECONDARY SCHOOL',
                'NDU001',
                'nduundune',
                'info@nduundune.sc.ke',
                '+254700000000',
                'P.O. Box 101, Machakos, Kenya',
                'KES',
                '522123',
                'NDUUNDUNE'
            )
        ");
        $insertSchool->execute();
        echo "Default school tenant (NDUUNDUNE SECONDARY SCHOOL) initialized.\n";
    }

    $tablesStmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Active tables in database (" . count($tables) . "): " . implode(', ', $tables) . "\n";

} catch (Exception $e) {
    echo "MIGRATION ERROR: " . $e->getMessage() . "\n";
}
