<?php
session_start();
require_once '../../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Método no permitido');
}

try {
    // Clear all session data
    session_unset();
    session_destroy();
    
    // Start a new session for the response
    session_start();
    
    sendJsonResponse(true, 'Sesión cerrada exitosamente');
    
} catch (Exception $e) {
    error_log('Logout error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error al cerrar sesión');
}
?>
