<?php
require_once __DIR__ . '/../../../includes/functions.php';

header('Content-Type: application/json');
$device = authenticateGreenhouseDevice();
$deviceId = $device['id'];
$retryWindowSec = (int) envValue('FHF_IOT_COMMAND_RETRY_SEC', '60');
$retryBefore = rawurlencode(gmdate('c', time() - max(10, $retryWindowSec)));

$response = $db->makeRequest(
    "greenhouse_commands?select=*&device_id=eq.$deviceId&status=eq.pending&order=created_at.asc&limit=1",
    'GET',
    null,
    true
);

if ($response['status'] !== 200) {
    sendJsonResponse(false, 'No se pudo consultar la cola de comandos', $response, 502);
}

if (empty($response['data'])) {
    $response = $db->makeRequest(
        "greenhouse_commands?select=*&device_id=eq.$deviceId&status=eq.dispatched&dispatched_at=lt.$retryBefore&order=created_at.asc&limit=1",
        'GET',
        null,
        true
    );

    if ($response['status'] !== 200) {
        sendJsonResponse(false, 'No se pudo consultar la cola de comandos', $response, 502);
    }
}

if (empty($response['data'])) {
    sendJsonResponse(true, 'Sin comandos pendientes', [
        'command' => null,
        'poll_after_sec' => (int) envValue('FHF_IOT_COMMAND_POLL_SEC', '5'),
    ]);
}

$command = $response['data'][0];
$commandId = (int) $command['id'];
$dispatchResponse = $db->makeRequest(
    "greenhouse_commands?id=eq.$commandId&device_id=eq.$deviceId",
    'PATCH',
    [
        'status' => 'dispatched',
        'dispatched_at' => gmdate('c'),
    ],
    true
);

if (in_array($dispatchResponse['status'], [200, 204], true) && !empty($dispatchResponse['data'])) {
    $command = $dispatchResponse['data'][0];
} else {
    $command['status'] = 'dispatched';
    $command['dispatched_at'] = gmdate('c');
}

sendJsonResponse(true, 'Comando disponible', [
    'command' => $command,
    'poll_after_sec' => (int) envValue('FHF_IOT_COMMAND_POLL_SEC', '5'),
]);
?>
