<?php
session_start();
require_once '../../config/database.php';
require_once '../../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Método no permitido');
}

if (!isLoggedIn()) {
    sendJsonResponse(false, 'No autorizado');
}

$projectId = sanitizeInput($_GET['project_id'] ?? '');
$userId = $_SESSION['user_id'];

// Validation
if (empty($projectId)) {
    sendJsonResponse(false, 'El proyecto es requerido');
}

try {
    // Verify user is member of the project
    if (!isProjectMember($userId, $projectId)) {
        sendJsonResponse(false, 'No tienes permisos para ver los ingresos de este proyecto');
    }
    
    // Get project income
    $response = $db->makeRequest(
        "income?select=*,users(name)&project_id=eq.$projectId&order=created_at.desc",
        'GET'
    );
    
    if ($response['status'] === 200) {
        sendJsonResponse(true, 'Ingresos obtenidos exitosamente', [
            'income' => $response['data']
        ]);
    } else {
        sendJsonResponse(false, 'Error al obtener los ingresos');
    }
    
} catch (Exception $e) {
    error_log('List income error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
