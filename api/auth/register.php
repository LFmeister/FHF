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

$name = sanitizeInput($input['name'] ?? '');
$email = sanitizeInput($input['email'] ?? '');
$password = $input['password'] ?? '';

// Validation
if (empty($name) || empty($email) || empty($password)) {
    sendJsonResponse(false, 'Todos los campos son requeridos');
}

if (!validateEmail($email)) {
    sendJsonResponse(false, 'Correo electrónico inválido');
}

if (!validatePassword($password)) {
    sendJsonResponse(false, 'La contraseña debe tener al menos 6 caracteres');
}

try {
    // Register with Supabase Auth
    $response = $db->auth('signup', [
        'email' => $email,
        'password' => $password
    ]);
    
    if ($response['status'] === 200 && isset($response['data']['user'])) {
        $userData = $response['data'];
        
        // Create user profile in users table
        $profileResponse = $db->makeRequest('users', 'POST', [
            'id' => $userData['user']['id'],
            'name' => $name,
            'email' => $email,
            'created_at' => date('Y-m-d H:i:s')
        ], true);
        
        if ($profileResponse['status'] === 201) {
            sendJsonResponse(true, 'Cuenta creada exitosamente. Revisa tu correo para confirmar tu cuenta.', [
                'user' => [
                    'id' => $userData['user']['id'],
                    'email' => $userData['user']['email'],
                    'name' => $name
                ]
            ]);
        } else {
            sendJsonResponse(false, 'Error al crear el perfil de usuario');
        }
    } else {
        $errorMessage = 'Error al crear la cuenta';
        if (isset($response['data']['error_description'])) {
            $errorMessage = $response['data']['error_description'];
        } elseif (isset($response['data']['msg'])) {
            $errorMessage = $response['data']['msg'];
        }
        sendJsonResponse(false, $errorMessage);
    }
    
} catch (Exception $e) {
    error_log('Registration error: ' . $e->getMessage());
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
