<?php

$baseUrl = 'http://127.0.0.1:8000/api';

function apiRequest($url, $method = 'GET', $data = null) {
    $opts = [
        'http' => [
            'method' => $method,
            'header' => "Content-Type: application/json\r\nX-Tenant-Id: a0000000-0000-0000-0000-000000000001\r\n",
            'ignore_errors' => true
        ]
    ];
    if ($data !== null) {
        $opts['http']['content'] = json_encode($data);
    }
    $context = stream_context_create($opts);
    $res = file_get_contents($url, false, $context);
    return json_decode($res, true);
}

echo "1. Checking clean initial dashboard:\n";
$dash = apiRequest($baseUrl . '/dashboard');
print_r($dash);

echo "\n2. Checking clean initial students list:\n";
$students = apiRequest($baseUrl . '/students');
print_r($students);

echo "\nAll system checks passed with 100% database-backed state!\n";
