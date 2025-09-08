<?php
session_start();
require_once '../../config/database.php';
require_once '../../includes/functions.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    sendJsonResponse(false, 'No autorizado');
}

$projectId = $_GET['id'] ?? '';
$userId = $_SESSION['user_id'];

if (empty($projectId)) {
    sendJsonResponse(false, 'ID de proyecto requerido');
}

try {
    // Verify user has access to this project
    if (!isProjectMember($userId, $projectId)) {
        sendJsonResponse(false, 'No tienes acceso a este proyecto');
    }
    
    // Get total expenses
    $expensesResponse = $db->makeRequest(
        "expenses?select=amount,status&project_id=eq.$projectId",
        'GET'
    );
    
    $totalExpenses = 0;
    $pendingExpenses = 0;
    
    if ($expensesResponse['status'] === 200 && !empty($expensesResponse['data'])) {
        foreach ($expensesResponse['data'] as $expense) {
            $totalExpenses += $expense['amount'];
            if ($expense['status'] === 'pending') {
                $pendingExpenses++;
            }
        }
    }
    
    sendJsonResponse(true, 'Estadísticas obtenidas', [
        'totalExpenses' => $totalExpenses,
        'pendingExpenses' => $pendingExpenses
    ]);
    
} catch (Exception $e) {
    error_log('Project stats error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
