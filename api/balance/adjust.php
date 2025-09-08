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

$projectId = sanitizeInput($input['project_id'] ?? '');
$amount = floatval($input['amount'] ?? 0);
$type = sanitizeInput($input['type'] ?? '');
$description = sanitizeInput($input['description'] ?? '');
$referenceNumber = sanitizeInput($input['reference_number'] ?? '');
$userId = $_SESSION['user_id'];

// Validation
if (empty($projectId)) {
    sendJsonResponse(false, 'El proyecto es requerido');
}

if ($amount == 0) {
    sendJsonResponse(false, 'El monto no puede ser cero');
}

if (empty($type) || !in_array($type, ['deposit', 'withdrawal', 'adjustment'])) {
    sendJsonResponse(false, 'Tipo de ajuste inválido');
}

if (empty($description)) {
    sendJsonResponse(false, 'La descripción es requerida');
}

try {
    // Verify user is project owner (only owners can adjust balance)
    $projectResponse = $db->makeRequest(
        "projects?select=owner_id&id=eq.$projectId",
        'GET'
    );
    
    if ($projectResponse['status'] !== 200 || empty($projectResponse['data'])) {
        sendJsonResponse(false, 'Proyecto no encontrado');
    }
    
    $project = $projectResponse['data'][0];
    if ($project['owner_id'] !== $userId) {
        sendJsonResponse(false, 'Solo el propietario del proyecto puede ajustar el balance');
    }
    
    // Create balance adjustment record
    $adjustmentData = [
        'project_id' => $projectId,
        'user_id' => $userId,
        'amount' => $amount,
        'type' => $type,
        'description' => $description,
        'reference_number' => $referenceNumber,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $response = $db->makeRequest('balance_adjustments', 'POST', $adjustmentData);
    
    if ($response['status'] === 201 && !empty($response['data'])) {
        $adjustment = $response['data'][0];
        
        // Log activity
        $activityDesc = "Balance ajustado: " . ucfirst($type) . " de " . formatCurrency(abs($amount));
        if ($referenceNumber) {
            $activityDesc .= " (Ref: $referenceNumber)";
        }
        logActivity($userId, $projectId, 'balance_updated', $activityDesc);
        
        sendJsonResponse(true, 'Balance ajustado exitosamente', [
            'adjustment' => $adjustment
        ]);
    } else {
        sendJsonResponse(false, 'Error al ajustar el balance');
    }
    
} catch (Exception $e) {
    error_log('Balance adjustment error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
