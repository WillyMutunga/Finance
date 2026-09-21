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
                // PostgreSQL: Try Unix socket (/var/run/postgresql on cPanel) then TCP fallbacks
                $dsnCandidates = [
                    "pgsql:host=/var/run/postgresql;port=5432;dbname={$config['database']}",
                    "pgsql:host=/var/run/postgresql;dbname={$config['database']}",
                    "pgsql:dbname={$config['database']}",
                    "pgsql:host=127.0.0.1;port=5432;dbname={$config['database']};sslmode=require",
                    "pgsql:host=localhost;port=5432;dbname={$config['database']};sslmode=require",
                    "pgsql:host=/tmp;port=5432;dbname={$config['database']}",
                    "pgsql:host={$config['host']};port={$config['port']};dbname={$config['database']};sslmode={$config['sslmode']}"
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

            if (self::$instance !== null) {
                self::ensureSchema(self::$instance);
            }
        }

        return self::$instance;
    }

    public static function ensureSchema(PDO $db): void
    {
        try { $db->exec("ALTER TABLE schools ADD COLUMN slug VARCHAR(100)"); } catch (\Throwable $e) {}
        try { $db->exec("ALTER TABLE schools ADD COLUMN subdomain VARCHAR(100)"); } catch (\Throwable $e) {}
        try { $db->exec("ALTER TABLE users ADD COLUMN username VARCHAR(100)"); } catch (\Throwable $e) {}
        try { $db->exec("ALTER TABLE users ADD COLUMN is_school_admin BOOLEAN DEFAULT FALSE"); } catch (\Throwable $e) {}

        try { $db->exec("UPDATE schools SET slug = 'nduundune', subdomain = 'nduundune' WHERE slug IS NULL"); } catch (\Throwable $e) {}
        try { $db->exec("UPDATE users SET username = 'willy' WHERE (email = 'accounts@nduundune.ac.ke' OR role = 'super_admin') AND username IS NULL"); } catch (\Throwable $e) {}
        try { $db->exec("UPDATE users SET username = 'kioko' WHERE (email LIKE 'kioko%' OR name ILIKE '%mbithi%' OR name ILIKE '%kioko%') AND username IS NULL"); } catch (\Throwable $e) {}
        try { $db->exec("UPDATE users SET username = 'nicholas' WHERE (email LIKE 'nicholas%' OR role = 'head_teacher') AND username IS NULL"); } catch (\Throwable $e) {}

        try {
            $db->exec("
                CREATE TABLE IF NOT EXISTS auth_otps (
                    id VARCHAR(64) PRIMARY KEY,
                    school_id VARCHAR(64),
                    user_id VARCHAR(64),
                    identifier VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    otp_code VARCHAR(12) NOT NULL,
                    purpose VARCHAR(50) DEFAULT 'LOGIN_2FA',
                    temp_token VARCHAR(128) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    is_used BOOLEAN DEFAULT FALSE,
                    attempts INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");
            $db->exec("CREATE INDEX IF NOT EXISTS idx_auth_otps_token ON auth_otps(temp_token)");
            $db->exec("CREATE INDEX IF NOT EXISTS idx_auth_otps_identifier ON auth_otps(identifier)");
        } catch (\Throwable $e) {}

        try {
            $db->exec("
                CREATE TABLE IF NOT EXISTS sms_configs (
                    id VARCHAR(64) PRIMARY KEY,
                    school_id VARCHAR(64) NOT NULL,
                    provider VARCHAR(50) DEFAULT 'africastalking',
                    api_key VARCHAR(255),
                    username VARCHAR(100),
                    sender_id VARCHAR(50),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");
        } catch (\Throwable $e) {}
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
