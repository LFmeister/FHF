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
$password = $input['password'] ?? '';

// Validation
if (empty($email) || empty($password)) {
    sendJsonResponse(false, 'Correo y contraseña son requeridos');
}

if (!validateEmail($email)) {
    sendJsonResponse(false, 'Correo electrónico inválido');
}

try {
    // Authenticate with Supabase
    $response = $db->auth('token?grant_type=password', [
        'email' => $email,
        'password' => $password
    ]);
    
    if ($response['status'] === 200 && isset($response['data']['access_token'])) {
        $userData = $response['data'];
        
        // Store session data
        $_SESSION['user_id'] = $userData['user']['id'];
        $_SESSION['user_email'] = $userData['user']['email'];
        $_SESSION['access_token'] = $userData['access_token'];
        $_SESSION['refresh_token'] = $userData['refresh_token'];
        
        // Get user profile data
        $userResponse = $db->makeRequest(
            "users?id=eq." . $userData['user']['id'],
            'GET'
        );
        
        if ($userResponse['status'] === 200 && !empty($userResponse['data'])) {
            $_SESSION['user_name'] = $userResponse['data'][0]['name'];
        }
        
        sendJsonResponse(true, 'Inicio de sesión exitoso', [
            'user' => [
                'id' => $userData['user']['id'],
                'email' => $userData['user']['email'],
                'name' => $_SESSION['user_name'] ?? ''
            ]
        ]);
    } else {
        $errorMessage = 'Credenciales inválidas';
        if (isset($response['data']['error_description'])) {
            $errorMessage = $response['data']['error_description'];
        }
        sendJsonResponse(false, $errorMessage);
    }
    
} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
