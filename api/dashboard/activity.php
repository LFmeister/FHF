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
        "project_members?select=project_id&user_id=eq.$userId",
        'GET'
    );
    
    if ($projectsResponse['status'] !== 200 || empty($projectsResponse['data'])) {
        sendJsonResponse(true, 'Actividad obtenida', []);
        return;
    }
    
    $projectIds = array_column($projectsResponse['data'], 'project_id');
    $projectIdsStr = implode(',', array_map(function($id) { return "'$id'"; }, $projectIds));
    
    // Get recent activity logs
    $activityResponse = $db->makeRequest(
        "activity_logs?select=*,users(name)&project_id=in.($projectIdsStr)&order=created_at.desc&limit=10",
        'GET'
    );
    
    $activities = [];
    
    if ($activityResponse['status'] === 200 && !empty($activityResponse['data'])) {
        foreach ($activityResponse['data'] as $activity) {
            $activities[] = [
                'id' => $activity['id'],
                'action' => $activity['action'],
                'description' => $activity['description'],
                'user_name' => $activity['users']['name'] ?? 'Usuario',
                'created_at' => $activity['created_at'],
                'type' => getActivityType($activity['action'])
            ];
        }
    }
    
    sendJsonResponse(true, 'Actividad obtenida', $activities);
    
} catch (Exception $e) {
    error_log('Dashboard activity error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}

function getActivityType($action) {
    $typeMap = [
        'project_created' => 'project',
        'expense_added' => 'expense',
        'balance_updated' => 'balance',
        'member_joined' => 'member',
        'file_uploaded' => 'file'
    ];
    
    return $typeMap[$action] ?? 'general';
}
?>
