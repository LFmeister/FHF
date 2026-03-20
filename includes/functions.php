<?php
require_once __DIR__ . '/../config/database.php';

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim((string) $data)));
}

function generateInviteCode($length = 8) {
    return strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, $length));
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validatePassword($password) {
    return strlen($password) >= 6;
}

function sendJsonResponse($success, $message, $data = null, $httpStatus = 200) {
    http_response_code($httpStatus);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['access_token']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: index.php');
        exit();
    }
}

function formatCurrency($amount, $currency = 'COP') {
    if ($currency === 'COP') {
        return '$' . number_format($amount, 0, ',', ',') . ' COP';
    }

    return '$' . number_format($amount, 2);
}

function formatDate($date) {
    return date('d/m/Y H:i', strtotime($date));
}

function getAllowedFileTypes() {
    return [
        'images' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'videos' => ['mp4', 'avi', 'mov', 'wmv', 'flv'],
        'documents' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv']
    ];
}

function getFileType($extension) {
    $allowedTypes = getAllowedFileTypes();

    foreach ($allowedTypes as $type => $extensions) {
        if (in_array(strtolower($extension), $extensions, true)) {
            return $type;
        }
    }

    return false;
}

function isValidFileType($filename) {
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    return getFileType($extension) !== false;
}

function getUserProjects($userId) {
    global $db;

    $response = $db->makeRequest(
        "project_members?select=projects(*)&user_id=eq.$userId",
        'GET'
    );

    if ($response['status'] === 200) {
        return array_column($response['data'], 'projects');
    }

    return [];
}

function getProjectById($projectId) {
    global $db;

    $response = $db->makeRequest(
        "projects?id=eq.$projectId",
        'GET'
    );

    if ($response['status'] === 200 && !empty($response['data'])) {
        return $response['data'][0];
    }

    return null;
}

function isProjectMember($userId, $projectId) {
    global $db;

    $response = $db->makeRequest(
        "project_members?user_id=eq.$userId&project_id=eq.$projectId",
        'GET'
    );

    return $response['status'] === 200 && !empty($response['data']);
}

function logActivity($userId, $projectId, $action, $description) {
    global $db;

    $data = [
        'user_id' => $userId,
        'project_id' => $projectId,
        'action' => $action,
        'description' => $description,
        'created_at' => date('Y-m-d H:i:s')
    ];

    return $db->makeRequest('activity_logs', 'POST', $data);
}

function getJsonInput(): array {
    static $input = null;

    if ($input !== null) {
        return $input;
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        $input = [];
        return $input;
    }

    $decoded = json_decode($raw, true);
    $input = is_array($decoded) ? $decoded : [];
    return $input;
}

function getHeaderValue(string $name): ?string {
    $normalized = 'HTTP_' . strtoupper(str_replace('-', '_', $name));

    if (isset($_SERVER[$normalized])) {
        return trim((string) $_SERVER[$normalized]);
    }

    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $headerName => $headerValue) {
            if (strcasecmp($headerName, $name) === 0) {
                return trim((string) $headerValue);
            }
        }
    }

    return null;
}

function isValidUuid(string $value): bool {
    return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value) === 1;
}

function hashDeviceToken(string $token): string {
    return hash('sha256', trim($token));
}

function getRequestIp(): ?string {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }

    if (!empty($_SERVER['REMOTE_ADDR'])) {
        return trim($_SERVER['REMOTE_ADDR']);
    }

    return null;
}

function requireIotControlToken(): void {
    $expected = envRequired('FHF_IOT_CONTROL_TOKEN');
    $input = getJsonInput();
    $provided = getHeaderValue('X-Control-Token') ?? ($input['control_token'] ?? ($_GET['control_token'] ?? null));

    if (!is_string($provided) || !hash_equals($expected, trim($provided))) {
        sendJsonResponse(false, 'Control token inválido', null, 401);
    }
}

function authenticateGreenhouseDevice(): array {
    global $db;

    $input = getJsonInput();
    $deviceId = trim((string) (getHeaderValue('X-Device-Id') ?? ($input['device_id'] ?? ($_GET['device_id'] ?? ''))));
    $deviceToken = trim((string) (getHeaderValue('X-Device-Token') ?? ($input['device_token'] ?? ($_GET['device_token'] ?? ''))));

    if ($deviceId === '' || $deviceToken === '') {
        sendJsonResponse(false, 'Credenciales del dispositivo requeridas', null, 401);
    }

    if (!isValidUuid($deviceId)) {
        sendJsonResponse(false, 'device_id inválido', null, 422);
    }

    $tokenHash = hashDeviceToken($deviceToken);
    $response = $db->makeRequest(
        "greenhouse_devices?select=id,name,status,timezone,metadata,last_seen_at&id=eq.$deviceId&status=eq.active&api_token_hash=eq.$tokenHash&limit=1",
        'GET',
        null,
        true
    );

    if ($response['status'] !== 200 || empty($response['data'])) {
        sendJsonResponse(false, 'Dispositivo no autorizado', null, 401);
    }

    return $response['data'][0];
}
?>
