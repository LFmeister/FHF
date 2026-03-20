<?php
require_once __DIR__ . '/../../../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Método no permitido', null, 405);
}

$device = authenticateGreenhouseDevice();
$deviceId = $device['id'];
$input = getJsonInput();
$commandId = isset($input['command_id']) ? (int) $input['command_id'] : 0;
$success = !empty($input['success']);
$resultPayload = $input['result'] ?? [];

if ($commandId <= 0) {
    sendJsonResponse(false, 'command_id inválido', null, 422);
}

if (!is_array($resultPayload)) {
    sendJsonResponse(false, 'result inválido', null, 422);
}

$patchResponse = $db->makeRequest(
    "greenhouse_commands?id=eq.$commandId&device_id=eq.$deviceId",
    'PATCH',
    [
        'status' => $success ? 'completed' : 'failed',
        'completed_at' => gmdate('c'),
        'result_payload' => $resultPayload,
    ],
    true
);

if (!in_array($patchResponse['status'], [200, 204], true)) {
    sendJsonResponse(false, 'No se pudo confirmar el comando', $patchResponse, 502);
}

sendJsonResponse(true, 'Comando confirmado', [
    'command_id' => $commandId,
    'status' => $success ? 'completed' : 'failed',
]);
?>
