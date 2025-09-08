<?php
session_start();
require_once '../../config/database.php';
require_once '../../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Método no permitido');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendJsonResponse(false, 'Datos inválidos');
}

$email = sanitizeInput($input['email'] ?? '');

// Validation
if (empty($email)) {
    sendJsonResponse(false, 'Correo electrónico es requerido');
}

if (!validateEmail($email)) {
    sendJsonResponse(false, 'Correo electrónico inválido');
}

try {
    // Send password reset email via Supabase
    $response = $db->auth('recover', [
        'email' => $email
    ]);
    
    if ($response['status'] === 200) {
        sendJsonResponse(true, 'Se ha enviado un enlace de recuperación a tu correo electrónico');
    } else {
        $errorMessage = 'Error al enviar el enlace de recuperación';
        if (isset($response['data']['error_description'])) {
            $errorMessage = $response['data']['error_description'];
        }
        sendJsonResponse(false, $errorMessage);
    }
    
} catch (Exception $e) {
    error_log('Password reset error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
