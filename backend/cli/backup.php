<?php
// Automated Database Backup CLI tool
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../app/' . str_replace(['App\\', '\\'], ['', '/'], $class) . '.php';
    if (file_exists($file)) require $file;
});

$config = require __DIR__ . '/../config/database.php';
$backupDir = __DIR__ . '/../storage/backups';
if (!is_dir($backupDir)) @mkdir($backupDir, 0777, true);

$timestamp = date('Y-m-d_H-i-s');
$filename = "finance_backup_{$timestamp}.sql";
$filepath = "{$backupDir}/{$filename}";

echo "Starting Database Backup for '{$config['database']}'...
";

// Use pg_dump if available, or fallback to PHP-based SQL export
$pgDumpCommand = "pg_dump -h {$config['host']} -p {$config['port']} -U {$config['username']} -d {$config['database']} -F p -f \"{$filepath}\"";
putenv("PGPASSWORD={$config['password']}");
@exec($pgDumpCommand, $output, $returnVar);

if ($returnVar === 0 && file_exists($filepath) && filesize($filepath) > 0) {
    echo "[SUCCESS] Database backup saved to: {$filepath} (" . round(filesize($filepath) / 1024, 2) . " KB)
";
} else {
    echo "[INFO] Using internal SQL schema & data extractor fallback...
";
    try {
        $db = \App\Database::getConnection();
        $tables = $db->query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")->fetchAll(PDO::FETCH_COLUMN);
        
        $handle = fopen($filepath, 'w');
        fwrite($handle, "-- School Finance PostgreSQL Backup
-- Generated: " . date('Y-m-d H:i:s') . "

");
        
        foreach ($tables as $table) {
            $rows = $db->query("SELECT * FROM \"{$table}\"")->fetchAll(PDO::FETCH_ASSOC);
            if (count($rows) > 0) {
                fwrite($handle, "-- Data for table {$table} (" . count($rows) . " rows)
");
                foreach ($rows as $row) {
                    $cols = array_keys($row);
                    $vals = array_map(function ($v) use ($db) {
                        return $v === null ? 'NULL' : $db->quote($v);
                    }, array_values($row));
                    fwrite($handle, "INSERT INTO \"{$table}\" (\"" . implode('", "', $cols) . "\") VALUES (" . implode(', ', $vals) . ") ON CONFLICT DO NOTHING;
");
                }
                fwrite($handle, "
");
            }
        }
        fclose($handle);
        echo "[SUCCESS] Internal SQL backup saved to: {$filepath} (" . round(filesize($filepath) / 1024, 2) . " KB)
";
    } catch (Throwable $e) {
        echo "[ERROR] Backup failed: " . $e->getMessage() . "
";
        exit(1);
    }
}