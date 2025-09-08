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

$name = sanitizeInput($input['name'] ?? '');
$description = sanitizeInput($input['description'] ?? '');
$initialBalance = floatval($input['initial_balance'] ?? 0);
$currency = sanitizeInput($input['currency'] ?? 'USD');
$userId = $_SESSION['user_id'];

// Validation
if (empty($name)) {
    sendJsonResponse(false, 'El nombre del proyecto es requerido');
}

if ($initialBalance < 0) {
    sendJsonResponse(false, 'El balance inicial no puede ser negativo');
}

try {
    // Generate unique invite code
    do {
        $inviteCode = generateInviteCode();
        $checkResponse = $db->makeRequest(
            "projects?select=id&invite_code=eq.$inviteCode",
            'GET'
        );
    } while ($checkResponse['status'] === 200 && !empty($checkResponse['data']));
    
    // Create project
    $projectData = [
        'name' => $name,
        'description' => $description,
        'owner_id' => $userId,
        'invite_code' => $inviteCode,
        'initial_balance' => $initialBalance,
        'current_balance' => $initialBalance,
        'currency' => $currency,
        'status' => 'active',
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    $response = $db->makeRequest('projects', 'POST', $projectData);
    
    if ($response['status'] === 201 && !empty($response['data'])) {
        $project = $response['data'][0];
        
        // Log activity
        logActivity($userId, $project['id'], 'project_created', "Proyecto '{$name}' creado");
        
        // If initial balance > 0, create balance adjustment record
        if ($initialBalance > 0) {
            $balanceData = [
                'project_id' => $project['id'],
                'user_id' => $userId,
                'amount' => $initialBalance,
                'type' => 'deposit',
                'description' => 'Balance inicial del proyecto',
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $db->makeRequest('balance_adjustments', 'POST', $balanceData);
        }
        
        sendJsonResponse(true, 'Proyecto creado exitosamente', [
            'project' => $project
        ]);
    } else {
        sendJsonResponse(false, 'Error al crear el proyecto');
    }
    
} catch (Exception $e) {
    error_log('Create project error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
