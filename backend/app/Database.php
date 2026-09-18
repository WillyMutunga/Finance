<?php

namespace App;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;
    private static ?string $currentTenantId = 'a0000000-0000-0000-0000-000000000001'; // Default Greenwood Academy

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $configFile = file_exists(__DIR__ . '/../config/database.php') ? __DIR__ . '/../config/database.php' : __DIR__ . '/config/database.php';
            $config = require $configFile;
            $driver = $config['driver'] ?? 'pgsql';
            
            $pdoOptions = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            if ($driver === 'mysql') {
                $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";
                self::$instance = new PDO($dsn, $config['username'], $config['password'], $pdoOptions);
            } else {
                // PostgreSQL: Try Unix sockets (standard for cPanel shared hosting) then TCP
                $dsnCandidates = [
                    "pgsql:dbname={$config['database']}",
                    "pgsql:host=/tmp;dbname={$config['database']}",
                    "pgsql:host=/var/run/postgresql;dbname={$config['database']}",
                    "pgsql:host={$config['host']};port={$config['port']};dbname={$config['database']};sslmode={$config['sslmode']}",
                    "pgsql:host=127.0.0.1;port={$config['port']};dbname={$config['database']}"
                ];

                $lastException = null;
                foreach ($dsnCandidates as $candidateDsn) {
                    try {
                        self::$instance = new PDO($candidateDsn, $config['username'], $config['password'], $pdoOptions);
                        $lastException = null;
                        break;
                    } catch (PDOException $e) {
                        $lastException = $e;
                    }
                }

                if (self::$instance === null && $lastException !== null) {
                    if (getenv('APP_ENV') === 'production' || getenv('APP_DEBUG') === 'true') {
                        throw new \RuntimeException("Database connection failed [{$driver}://{$config['database']}]: " . $lastException->getMessage(), (int)$lastException->getCode(), $lastException);
                    }
                    $sqlitePath = sys_get_temp_dir() . '/school_finance_dev.sqlite';
                    self::$instance = new PDO("sqlite:" . $sqlitePath, null, null, $pdoOptions);
                }
            }

            // Set tenant session context in Postgres if tenant id is present
            if (self::$instance !== null && self::$currentTenantId) {
                try {
                    self::$instance->exec("SET app.current_tenant_id = " . self::$instance->quote(self::$currentTenantId));
                } catch (\Exception $e) {
                    // ignore if parameter not recognized
                }
            }
        }

        return self::$instance;
    }

    public static function setTenantId(string $tenantId): void
    {
        self::$currentTenantId = $tenantId;
        if (self::$instance !== null) {
            try {
                self::$instance->exec("SET app.current_tenant_id = " . self::$instance->quote($tenantId));
            } catch (\Exception $e) {
                // Ignore if not supported in fallback driver
            }
        }
    }

    public static function getTenantId(): string
    {
        return self::$currentTenantId ?? 'a0000000-0000-0000-0000-000000000001';
    }
}
