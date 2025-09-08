<?php
session_start();
require_once '../../config/database.php';
require_once '../../includes/functions.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    sendJsonResponse(false, 'No autorizado');
}

$userId = $_SESSION['user_id'];

try {
    // Get user's projects
    $projectsResponse = $db->makeRequest(
        "project_members?select=project_id,projects(current_balance,currency)&user_id=eq.$userId",
        'GET'
    );
    
    $totalBalance = 0;
    $projectIds = [];
    
    if ($projectsResponse['status'] === 200 && !empty($projectsResponse['data'])) {
        foreach ($projectsResponse['data'] as $member) {
            if (isset($member['projects'])) {
                $totalBalance += $member['projects']['current_balance'];
                $projectIds[] = $member['project_id'];
            }
        }
    }
    
    $monthlyExpenses = 0;
    $pendingExpenses = 0;
    
    if (!empty($projectIds)) {
        $projectIdsStr = implode(',', array_map(function($id) { return "'$id'"; }, $projectIds));
        
        // Get monthly expenses (current month)
        $currentMonth = date('Y-m');
        $monthlyResponse = $db->makeRequest(
            "expenses?select=amount&project_id=in.($projectIdsStr)&expense_date=gte.$currentMonth-01&expense_date=lt." . date('Y-m-d', strtotime('first day of next month')),
            'GET'
        );
        
        if ($monthlyResponse['status'] === 200 && !empty($monthlyResponse['data'])) {
            foreach ($monthlyResponse['data'] as $expense) {
                $monthlyExpenses += $expense['amount'];
            }
        }
        
        // Get pending expenses count
        $pendingResponse = $db->makeRequest(
            "expenses?select=id&project_id=in.($projectIdsStr)&status=eq.pending",
            'GET'
        );
        
        if ($pendingResponse['status'] === 200) {
            $pendingExpenses = count($pendingResponse['data']);
        }
    }
    
    sendJsonResponse(true, 'Estadísticas obtenidas', [
        'totalBalance' => $totalBalance,
        'monthlyExpenses' => $monthlyExpenses,
        'pendingExpenses' => $pendingExpenses,
        'totalProjects' => count($projectIds)
    ]);
    
} catch (Exception $e) {
    error_log('Dashboard stats error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
