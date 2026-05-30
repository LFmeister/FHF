<?php
require_once __DIR__ . '/../../../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Método no permitido', null, 405);
}

$device = authenticateGreenhouseDevice();
$input = getJsonInput();
$status = $input['status'] ?? null;

if (!is_array($status)) {
    sendJsonResponse(false, 'Payload status inválido', null, 422);
}

$recordedAt = $input['recorded_at'] ?? gmdate('c');
$deviceId = $device['id'];

$telemetryData = [
    'device_id' => $deviceId,
    'recorded_at' => $recordedAt,
    'source' => 'arduino-gateway',
    'device_uptime_ms' => $status['uptime_ms'] ?? null,
    'dht_ok' => isset($status['dht_ok']) ? (bool) $status['dht_ok'] : null,
    'temp_c' => $status['temp_c'] ?? null,
    'hum_pct' => $status['hum_pct'] ?? null,
    'float_raw' => $status['float_raw'] ?? null,
    'float_state' => $status['float_state'] ?? null,
    'tank_low' => isset($status['tank_low']) ? (bool) $status['tank_low'] : null,
    'tank_mid' => isset($status['tank_mid']) ? (bool) $status['tank_mid'] : null,
    'tank_full' => isset($status['tank_full']) ? (bool) $status['tank_full'] : null,
    'tank_low_when' => $status['tank_low_when'] ?? null,
    'float_low_raw' => $status['float_low_raw'] ?? ($input['float_switches']['low']['raw'] ?? null),
    'float_mid_raw' => $status['float_mid_raw'] ?? ($input['float_switches']['mid']['raw'] ?? null),
    'float_high_raw' => $status['float_high_raw'] ?? ($input['float_switches']['high']['raw'] ?? null),
    'float_low_state' => $status['float_low_state'] ?? ($input['float_switches']['low']['state'] ?? null),
    'float_mid_state' => $status['float_mid_state'] ?? ($input['float_switches']['mid']['state'] ?? null),
    'float_high_state' => $status['float_high_state'] ?? ($input['float_switches']['high']['state'] ?? null),
    'float_mid_active_when' => $status['float_mid_active_when'] ?? null,
    'float_high_active_when' => $status['float_high_active_when'] ?? null,
    'dht_fresh' => isset($status['dht_fresh']) ? (bool) $status['dht_fresh'] : null,
    'dht_age_ms' => $status['dht_age_ms'] ?? null,
    'light_on' => isset($status['light_on']) ? (bool) $status['light_on'] : null,
    'pump_on' => isset($status['pump_on']) ? (bool) $status['pump_on'] : null,
    'pump_remaining_ms' => $status['pump_remaining_ms'] ?? null,
    'stream' => isset($status['stream']) ? (bool) $status['stream'] : null,
    'raw_payload' => $input,
];

$insertResponse = $db->makeRequest('greenhouse_telemetry', 'POST', $telemetryData, true);
if (!in_array($insertResponse['status'], [200, 201], true) || empty($insertResponse['data'])) {
    sendJsonResponse(false, 'No se pudo guardar la telemetría', $insertResponse, 502);
}

$db->makeRequest(
    "greenhouse_devices?id=eq.$deviceId",
    'PATCH',
    [
        'last_seen_at' => gmdate('c'),
        'last_ip' => getRequestIp(),
        'updated_at' => gmdate('c'),
    ],
    true
);

$pendingResponse = $db->makeRequest(
    "greenhouse_commands?select=id&device_id=eq.$deviceId&status=in.(pending,dispatched)",
    'GET',
    null,
    true
);

sendJsonResponse(true, 'Telemetría almacenada', [
    'telemetry' => $insertResponse['data'][0],
    'pending_commands' => $pendingResponse['status'] === 200 && is_array($pendingResponse['data']) ? count($pendingResponse['data']) : 0,
    'telemetry_interval_sec' => (int) envValue('FHF_IOT_TELEMETRY_INTERVAL_SEC', '30'),
    'command_poll_sec' => (int) envValue('FHF_IOT_COMMAND_POLL_SEC', '5'),
]);
?>
