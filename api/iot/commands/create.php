<?php
require_once __DIR__ . '/../../../includes/functions.php';

header('Content-Type: application/json');
requireIotControlToken();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Método no permitido', null, 405);
}

$input = getJsonInput();
$deviceId = trim((string) ($input['device_id'] ?? ''));
$commandText = trim((string) ($input['command_text'] ?? ''));
$commandType = trim((string) ($input['command_type'] ?? 'manual'));
$reason = trim((string) ($input['reason'] ?? ''));
$createdBy = trim((string) ($input['created_by'] ?? 'ai-worker'));
$dedupeKey = trim((string) ($input['dedupe_key'] ?? ''));
$payload = $input['payload'] ?? [];

if (!isValidUuid($deviceId)) {
    sendJsonResponse(false, 'device_id inválido', null, 422);
}

if ($commandText === '') {
    sendJsonResponse(false, 'command_text es requerido', null, 422);
}

if (!is_array($payload)) {
    sendJsonResponse(false, 'payload inválido', null, 422);
}

if ($dedupeKey !== '') {
    $existing = $db->makeRequest(
        "greenhouse_commands?select=*&device_id=eq.$deviceId&dedupe_key=eq.$dedupeKey&limit=1",
        'GET',
        null,
        true
    );

    if ($existing['status'] === 200 && !empty($existing['data'])) {
        sendJsonResponse(true, 'Comando ya existente', ['command' => $existing['data'][0], 'duplicate' => true]);
    }
}

$insertResponse = $db->makeRequest('greenhouse_commands', 'POST', [
    'device_id' => $deviceId,
    'command_text' => $commandText,
    'command_type' => $commandType,
    'payload' => $payload,
    'reason' => $reason,
    'created_by' => $createdBy,
    'dedupe_key' => $dedupeKey !== '' ? $dedupeKey : null,
    'status' => 'pending',
], true);

if (!in_array($insertResponse['status'], [200, 201], true) || empty($insertResponse['data'])) {
    sendJsonResponse(false, 'No se pudo crear el comando', $insertResponse, 502);
}

sendJsonResponse(true, 'Comando creado', ['command' => $insertResponse['data'][0], 'duplicate' => false], 201);
?>
