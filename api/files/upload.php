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

$projectId = sanitizeInput($_POST['project_id'] ?? '');
$expenseId = sanitizeInput($_POST['expense_id'] ?? '');
$userId = $_SESSION['user_id'];

// Validation
if (empty($projectId)) {
    sendJsonResponse(false, 'El proyecto es requerido');
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    sendJsonResponse(false, 'No se ha subido ningún archivo válido');
}

$file = $_FILES['file'];
$originalFilename = $file['name'];
$fileSize = $file['size'];
$mimeType = $file['type'];
$tempPath = $file['tmp_name'];

// Validate file type
if (!isValidFileType($originalFilename)) {
    sendJsonResponse(false, 'Tipo de archivo no permitido');
}

// Validate file size (max 10MB)
if ($fileSize > 10 * 1024 * 1024) {
    sendJsonResponse(false, 'El archivo es demasiado grande (máximo 10MB)');
}

try {
    // Verify user is member of the project
    if (!isProjectMember($userId, $projectId)) {
        sendJsonResponse(false, 'No tienes permisos para subir archivos a este proyecto');
    }
    
    // If expense_id is provided, verify it belongs to the project
    if (!empty($expenseId)) {
        $expenseResponse = $db->makeRequest(
            "expenses?select=id&id=eq.$expenseId&project_id=eq.$projectId",
            'GET'
        );
        
        if ($expenseResponse['status'] !== 200 || empty($expenseResponse['data'])) {
            sendJsonResponse(false, 'Gasto no encontrado o no pertenece al proyecto');
        }
    }
    
    // Generate unique filename
    $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filePath = "uploads/$projectId/$filename";
    
    // Create upload directory if it doesn't exist
    $uploadDir = "uploads/$projectId";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Move uploaded file
    if (!move_uploaded_file($tempPath, $filePath)) {
        sendJsonResponse(false, 'Error al guardar el archivo');
    }
    
    // For production, you would upload to Supabase Storage here
    // $fileContent = file_get_contents($filePath);
    // $uploadResponse = $db->uploadFile('project-files', "$projectId/$filename", $fileContent);
    
    // For now, we'll use local storage and create a relative URL
    $fileUrl = "uploads/$projectId/$filename";
    
    // Save file record to database
    $fileData = [
        'project_id' => $projectId,
        'user_id' => $userId,
        'expense_id' => !empty($expenseId) ? $expenseId : null,
        'filename' => $filename,
        'original_filename' => $originalFilename,
        'file_type' => getFileType($extension),
        'file_size' => $fileSize,
        'file_url' => $fileUrl,
        'mime_type' => $mimeType,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $response = $db->makeRequest('file_uploads', 'POST', $fileData);
    
    if ($response['status'] === 201 && !empty($response['data'])) {
        $fileRecord = $response['data'][0];
        
        // Log activity
        $activityDesc = "Archivo subido: $originalFilename";
        if (!empty($expenseId)) {
            $activityDesc .= " (asociado a gasto)";
        }
        logActivity($userId, $projectId, 'file_uploaded', $activityDesc);
        
        sendJsonResponse(true, 'Archivo subido exitosamente', [
            'file' => $fileRecord
        ]);
    } else {
        // Clean up file if database insert failed
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        sendJsonResponse(false, 'Error al guardar la información del archivo');
    }
    
} catch (Exception $e) {
    error_log('File upload error: ' . $e->getMessage());
    // Clean up file on error
    if (isset($filePath) && file_exists($filePath)) {
        unlink($filePath);
    }
    sendJsonResponse(false, 'Error interno del servidor');
}
?>
