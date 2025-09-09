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
$title = sanitizeInput($input['title'] ?? '');
$amount = floatval($input['amount'] ?? 0);
$category = sanitizeInput($input['category'] ?? '');
$incomeDate = sanitizeInput($input['income_date'] ?? '');
$description = sanitizeInput($input['description'] ?? '');
$userId = $_SESSION['user_id'];

// Validation
if (empty($projectId)) {
    sendJsonResponse(false, 'El proyecto es requerido');
}

if (empty($title)) {
    sendJsonResponse(false, 'El título del ingreso es requerido');
}

if ($amount <= 0) {
    sendJsonResponse(false, 'El monto debe ser mayor a 0');
}

if (empty($incomeDate)) {
    sendJsonResponse(false, 'La fecha del ingreso es requerida');
}

try {
    // Verify user is member of the project
    if (!isProjectMember($userId, $projectId)) {
        sendJsonResponse(false, 'No tienes permisos para agregar ingresos a este proyecto');
    }
    
    // Create income
    $incomeData = [
        'project_id' => $projectId,
        'user_id' => $userId,
        'title' => $title,
        'description' => $description,
        'amount' => $amount,
        'category' => $category,
        'income_date' => $incomeDate,
        'status' => 'approved',
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    $response = $db->makeRequest('income', 'POST', $incomeData);
    
    if ($response['status'] === 201 && !empty($response['data'])) {
        $income = $response['data'][0];
        
        // Log activity
        logActivity($userId, $projectId, 'income_added', "Ingreso agregado: $title - " . formatCurrency($amount));
        
        sendJsonResponse(true, 'Ingreso agregado exitosamente', [
            'income' => $income
        ]);
    } else {
        sendJsonResponse(false, 'Error al agregar el ingreso');
    }
    
} catch (Exception $e) {
    error_log('Create income error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
