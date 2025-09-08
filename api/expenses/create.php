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
$expenseDate = sanitizeInput($input['expense_date'] ?? '');
$description = sanitizeInput($input['description'] ?? '');
$userId = $_SESSION['user_id'];

// Validation
if (empty($projectId)) {
    sendJsonResponse(false, 'El proyecto es requerido');
}

if (empty($title)) {
    sendJsonResponse(false, 'El título del gasto es requerido');
}

if ($amount <= 0) {
    sendJsonResponse(false, 'El monto debe ser mayor a 0');
}

if (empty($expenseDate)) {
    sendJsonResponse(false, 'La fecha del gasto es requerida');
}

try {
    // Verify user is member of the project
    if (!isProjectMember($userId, $projectId)) {
        sendJsonResponse(false, 'No tienes permisos para agregar gastos a este proyecto');
    }
    
    // Create expense
    $expenseData = [
        'project_id' => $projectId,
        'user_id' => $userId,
        'title' => $title,
        'description' => $description,
        'amount' => $amount,
        'category' => $category,
        'expense_date' => $expenseDate,
        'status' => 'pending',
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    $response = $db->makeRequest('expenses', 'POST', $expenseData);
    
    if ($response['status'] === 201 && !empty($response['data'])) {
        $expense = $response['data'][0];
        
        // Log activity
        logActivity($userId, $projectId, 'expense_added', "Gasto agregado: $title - " . formatCurrency($amount));
        
        sendJsonResponse(true, 'Gasto agregado exitosamente', [
            'expense' => $expense
        ]);
    } else {
        sendJsonResponse(false, 'Error al agregar el gasto');
    }
    
} catch (Exception $e) {
    error_log('Create expense error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
