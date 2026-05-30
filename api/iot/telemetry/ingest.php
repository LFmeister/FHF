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


function greenhouseUnitForMetric(string $metric): ?string {
    $normalized = strtolower($metric);
    if (strpos($normalized, 'temp') !== false) return 'C';
    if (strpos($normalized, 'hum') !== false) return '%';
    if (strpos($normalized, 'rssi') !== false) return 'dBm';
    if (strpos($normalized, 'age_ms') !== false || strpos($normalized, 'uptime_ms') !== false || strpos($normalized, '_ms') !== false) return 'ms';
    return null;
}

function addGreenhouseSensorReading(array &$readings, string $deviceId, int $telemetryId, string $recordedAt, string $sensorKey, ?string $sensorLabel, string $sensorKind, string $metric, $value, array $rawPayload = [], array $metadata = []): void {
    if ($value === null || $value === '') {
        return;
    }

    $reading = [
        'telemetry_id' => $telemetryId,
        'device_id' => $deviceId,
        'recorded_at' => $recordedAt,
        'sensor_key' => $sensorKey,
        'sensor_label' => $sensorLabel,
        'sensor_kind' => $sensorKind,
        'metric' => $metric,
        'unit' => greenhouseUnitForMetric($metric),
        'metadata' => empty($metadata) ? new stdClass() : $metadata,
        'raw_payload' => empty($rawPayload) ? new stdClass() : $rawPayload,
    ];

    if (is_bool($value)) {
        $reading['value_boolean'] = $value;
    } elseif (is_int($value) || is_float($value) || (is_string($value) && is_numeric($value))) {
        $reading['value_number'] = (float) $value;
    } else {
        $reading['value_text'] = (string) $value;
    }

    $readings[] = $reading;
}

function addGreenhouseMetricSet(array &$readings, string $deviceId, int $telemetryId, string $recordedAt, string $sensorKey, ?string $sensorLabel, string $sensorKind, array $payload, array $skipKeys = []): void {
    $defaultSkip = ['id', 'key', 'name', 'label', 'type', 'kind', 'unit', 'units', 'metadata'];
    $skip = array_flip(array_merge($defaultSkip, $skipKeys));

    foreach ($payload as $metric => $value) {
        if (isset($skip[$metric]) || is_array($value)) {
            continue;
        }

        addGreenhouseSensorReading($readings, $deviceId, $telemetryId, $recordedAt, $sensorKey, $sensorLabel, $sensorKind, (string) $metric, $value, $payload);
    }
}

function addGreenhouseSensorCollection(array &$readings, string $deviceId, int $telemetryId, string $recordedAt, $collection, string $defaultKind): void {
    if (!is_array($collection)) {
        return;
    }

    foreach ($collection as $key => $sensor) {
        if (!is_array($sensor)) {
            continue;
        }

        $sensorKey = (string) ($sensor['id'] ?? $sensor['key'] ?? (is_string($key) ? $key : $defaultKind . '_' . $key));
        $sensorLabel = isset($sensor['label']) || isset($sensor['name']) ? (string) ($sensor['label'] ?? $sensor['name']) : $sensorKey;
        $sensorKind = (string) ($sensor['kind'] ?? $sensor['type'] ?? $defaultKind);

        addGreenhouseMetricSet($readings, $deviceId, $telemetryId, $recordedAt, $sensorKey, $sensorLabel, $sensorKind, $sensor);
    }
}

function buildGreenhouseSensorReadings(array $input, array $status, string $deviceId, int $telemetryId, string $recordedAt): array {
    $readings = [];

    addGreenhouseMetricSet($readings, $deviceId, $telemetryId, $recordedAt, 'status', 'Estado general', 'controller_status', $status);

    if (isset($status['temp_c']) || isset($status['hum_pct']) || isset($status['dht_ok'])) {
        $dhtPayload = [
            'temp_c' => $status['temp_c'] ?? null,
            'hum_pct' => $status['hum_pct'] ?? null,
            'dht_ok' => $status['dht_ok'] ?? null,
            'dht_fresh' => $status['dht_fresh'] ?? null,
            'dht_age_ms' => $status['dht_age_ms'] ?? null,
        ];
        addGreenhouseMetricSet($readings, $deviceId, $telemetryId, $recordedAt, 'dht_main', 'DHT principal', 'environment', $dhtPayload);
    }

    addGreenhouseSensorCollection($readings, $deviceId, $telemetryId, $recordedAt, $input['sensors'] ?? null, 'sensor');
    addGreenhouseSensorCollection($readings, $deviceId, $telemetryId, $recordedAt, $input['environment_sensors'] ?? null, 'environment');
    addGreenhouseSensorCollection($readings, $deviceId, $telemetryId, $recordedAt, $input['dht_sensors'] ?? null, 'environment');

    if (isset($input['float_switches']) && is_array($input['float_switches'])) {
        foreach ($input['float_switches'] as $key => $floatSwitch) {
            if (!is_array($floatSwitch)) {
                continue;
            }

            addGreenhouseMetricSet($readings, $deviceId, $telemetryId, $recordedAt, 'float_' . $key, 'Flotador ' . $key, 'float_switch', $floatSwitch);
        }
    }

    return $readings;
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
    'float_low_raw' => $input['float_switches']['low']['raw'] ?? ($status['float_low_raw'] ?? null),
    'float_mid_raw' => $input['float_switches']['mid']['raw'] ?? ($status['float_mid_raw'] ?? null),
    'float_high_raw' => $input['float_switches']['high']['raw'] ?? ($status['float_high_raw'] ?? null),
    'float_low_state' => $input['float_switches']['low']['state'] ?? ($status['float_low_state'] ?? null),
    'float_mid_state' => $input['float_switches']['mid']['state'] ?? ($status['float_mid_state'] ?? null),
    'float_high_state' => $input['float_switches']['high']['state'] ?? ($status['float_high_state'] ?? null),
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

$sensorReadingsResponse = null;
$telemetryId = isset($insertResponse['data'][0]['id']) ? (int) $insertResponse['data'][0]['id'] : 0;
if ($telemetryId > 0) {
    $sensorReadings = buildGreenhouseSensorReadings($input, $status, $deviceId, $telemetryId, $recordedAt);
    if (!empty($sensorReadings)) {
        $sensorReadingsResponse = $db->makeRequest('greenhouse_sensor_readings', 'POST', $sensorReadings, true);
    }
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
    'sensor_readings_saved' => $sensorReadingsResponse && in_array($sensorReadingsResponse['status'], [200, 201], true) ? count($sensorReadingsResponse['data'] ?? []) : 0,
    'pending_commands' => $pendingResponse['status'] === 200 && is_array($pendingResponse['data']) ? count($pendingResponse['data']) : 0,
    'telemetry_interval_sec' => (int) envValue('FHF_IOT_TELEMETRY_INTERVAL_SEC', '30'),
    'command_poll_sec' => (int) envValue('FHF_IOT_COMMAND_POLL_SEC', '5'),
]);
?>
