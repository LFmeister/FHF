<?php
session_start();
require_once '../../config/database.php';
require_once '../../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Método no permitido');
}

if (!isLoggedIn()) {
    sendJsonResponse(false, 'No autorizado');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendJsonResponse(false, 'Datos inválidos');
}

$inviteCode = strtoupper(sanitizeInput($input['invite_code'] ?? ''));
$userId = $_SESSION['user_id'];

// Validation
if (empty($inviteCode)) {
    sendJsonResponse(false, 'El código de invitación es requerido');
}

if (strlen($inviteCode) !== 8) {
    sendJsonResponse(false, 'El código de invitación debe tener 8 caracteres');
}

try {
    // Find project by invite code
    $projectResponse = $db->makeRequest(
        "projects?select=*&invite_code=eq.$inviteCode",
        'GET'
    );
    
    if ($projectResponse['status'] !== 200 || empty($projectResponse['data'])) {
        sendJsonResponse(false, 'Código de invitación inválido');
    }
    
    $project = $projectResponse['data'][0];
    
    // Check if user is already a member
    $memberResponse = $db->makeRequest(
        "project_members?select=id&project_id=eq.{$project['id']}&user_id=eq.$userId",
        'GET'
    );
    
    if ($memberResponse['status'] === 200 && !empty($memberResponse['data'])) {
        sendJsonResponse(false, 'Ya eres miembro de este proyecto');
    }
    
    // Add user as project member
    $memberData = [
        'project_id' => $project['id'],
        'user_id' => $userId,
        'role' => 'member',
        'joined_at' => date('Y-m-d H:i:s')
    ];
    
    $response = $db->makeRequest('project_members', 'POST', $memberData);
    
    if ($response['status'] === 201) {
        // Log activity
        $userName = $_SESSION['user_name'] ?? 'Usuario';
        logActivity($userId, $project['id'], 'member_joined', "$userName se unió al proyecto");
        
        sendJsonResponse(true, 'Te has unido al proyecto exitosamente', [
            'project' => $project
        ]);
    } else {
        sendJsonResponse(false, 'Error al unirse al proyecto');
    }
    
} catch (Exception $e) {
    error_log('Join project error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
