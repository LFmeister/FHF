<?php
require_once __DIR__ . '/../../../includes/functions.php';

header('Content-Type: application/json');
requireIotControlToken();

$deviceId = trim((string) ($_GET['device_id'] ?? ''));
$sinceId = isset($_GET['since_id']) ? (int) $_GET['since_id'] : 0;

if (!isValidUuid($deviceId)) {
    sendJsonResponse(false, 'device_id inválido', null, 422);
}

$response = $db->makeRequest(
    "greenhouse_telemetry?select=*&device_id=eq.$deviceId&order=id.desc&limit=1",
    'GET',
    null,
    true
);

if ($response['status'] !== 200) {
    sendJsonResponse(false, 'No se pudo consultar la telemetría', $response, 502);
}

if (empty($response['data'])) {
    sendJsonResponse(true, 'Sin telemetría', ['telemetry' => null, 'changed' => false]);
}

$telemetry = $response['data'][0];
$changed = $sinceId === 0 || (int) $telemetry['id'] > $sinceId;

sendJsonResponse(true, 'Telemetría consultada', [
    'telemetry' => $telemetry,
    'changed' => $changed,
]);
?>
