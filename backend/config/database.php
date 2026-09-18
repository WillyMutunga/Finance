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

$driver = getenv('DB_CONNECTION') ?: getenv('DB_DRIVER') ?: 'pgsql';
$defaultPort = ($driver === 'mysql') ? '3306' : '5432';

return [
    'driver'    => $driver,
    'host'      => getenv('DB_HOST') ?: '/var/run/postgresql',
    'port'      => getenv('DB_PORT') ?: $defaultPort,
    'database'  => getenv('DB_DATABASE') ?: 'skysofts_finance',
    'username'  => getenv('DB_USERNAME') ?: 'skysofts_Sharks',
    'password'  => getenv('DB_PASSWORD') ?: 'William#20',
    'charset'   => 'utf8mb4',
    'schema'    => 'public',
    'sslmode'   => getenv('DB_SSLMODE') ?: 'prefer',
];

