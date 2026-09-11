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

return [
    'driver'    => 'pgsql',
    'host'      => getenv('DB_HOST') ?: '127.0.0.1',
    'port'      => getenv('DB_PORT') ?: '5432',
    'database'  => getenv('DB_DATABASE') ?: 'finance',
    'username'  => getenv('DB_USERNAME') ?: 'postgres',
    'password'  => getenv('DB_PASSWORD') ?: 'William#20',
    'charset'   => 'utf8',
    'schema'    => 'public',
    'sslmode'   => getenv('DB_SSLMODE') ?: 'prefer',
];
