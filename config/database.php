<?php
require_once __DIR__ . '/env.php';

loadEnvironment(__DIR__ . '/../.env');

class Database {
    private string $supabaseUrl;
    private string $supabaseAnonKey;
    private string $supabaseServiceKey;

    public function __construct() {
        $this->supabaseUrl = rtrim(envRequired('SUPABASE_URL'), '/');
        $this->supabaseAnonKey = envRequired('SUPABASE_ANON_KEY');
        $this->supabaseServiceKey = envRequired('SUPABASE_SERVICE_ROLE_KEY');
    }

    public function makeRequest(string $endpoint, string $method = 'GET', $data = null, bool $useServiceKey = false): array {
        $url = $this->supabaseUrl . '/rest/v1/' . ltrim($endpoint, '/');
        $apiKey = $useServiceKey ? $this->supabaseServiceKey : $this->supabaseAnonKey;
        $authToken = $useServiceKey ? $this->supabaseServiceKey : ($_SESSION['access_token'] ?? null);

        $headers = [
            'Content-Type: application/json',
            'Prefer: return=representation',
            'apikey: ' . $apiKey,
        ];

        if (!empty($authToken)) {
            $headers[] = 'Authorization: Bearer ' . $authToken;
        }

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
        ]);

        if ($data !== null && in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }

        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = $response === false ? curl_error($ch) : null;
        curl_close($ch);

        return [
            'data' => $response !== false ? json_decode($response, true) : null,
            'status' => $httpCode,
            'error' => $curlError,
        ];
    }

    public function auth(string $endpoint, array $data): array {
        $url = $this->supabaseUrl . '/auth/v1/' . ltrim($endpoint, '/');
        $headers = [
            'Content-Type: application/json',
            'apikey: ' . $this->supabaseAnonKey,
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = $response === false ? curl_error($ch) : null;
        curl_close($ch);

        return [
            'data' => $response !== false ? json_decode($response, true) : null,
            'status' => $httpCode,
            'error' => $curlError,
        ];
    }

    public function uploadFile(string $bucket, string $path, $file): array {
        if (empty($_SESSION['access_token'])) {
            throw new RuntimeException('Missing access token for storage upload.');
        }

        $url = $this->supabaseUrl . '/storage/v1/object/' . trim($bucket, '/') . '/' . ltrim($path, '/');
        $headers = [
            'Authorization: Bearer ' . $_SESSION['access_token'],
            'apikey: ' . $this->supabaseAnonKey,
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $file,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = $response === false ? curl_error($ch) : null;
        curl_close($ch);

        return [
            'data' => $response !== false ? json_decode($response, true) : null,
            'status' => $httpCode,
            'error' => $curlError,
        ];
    }
}

$db = new Database();
?>
