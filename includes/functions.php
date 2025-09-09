<?php
require_once 'config/database.php';

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
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

function sendJsonResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
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
        // Colombian peso formatting: $100,000 COP
        return '$' . number_format($amount, 0, ',', ',') . ' COP';
    } else {
        // Default formatting for other currencies
        return '$' . number_format($amount, 2);
    }
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
        if (in_array(strtolower($extension), $extensions)) {
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
?>
