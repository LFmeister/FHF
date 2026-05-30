-- Diagnostic queries for the v2 greenhouse telemetry model.

-- Latest raw events.
select
  id,
  device_id,
  recorded_at,
  device_uptime_ms,
  stream,
  raw_payload->'esp32' as esp32,
  raw_payload->'status' as status,
  raw_payload->'float_switches' as float_switches
from public.greenhouse_telemetry
where device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'
order by recorded_at desc
limit 5;

-- Latest normalized sensor readings by sensor.
select distinct on (sensor_key, metric)
  sensor_key,
  sensor_label,
  sensor_kind,
  metric,
  unit,
  value_number,
  value_boolean,
  value_text,
  recorded_at,
  raw_payload
from public.greenhouse_sensor_readings
where device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'
order by sensor_key, metric, recorded_at desc;

-- Tank sensor comparison from normalized readings.
select
  sensor_key,
  max(value_number) filter (where metric = 'raw') as raw,
  max(value_text) filter (where metric = 'state') as state,
  bool_or(value_boolean) filter (where metric in ('active', 'tank_low')) as active
from public.greenhouse_sensor_readings
where device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'
  and sensor_kind = 'float_switch'
  and recorded_at = (
    select max(recorded_at)
    from public.greenhouse_sensor_readings
    where device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'
      and sensor_kind = 'float_switch'
  )
group by sensor_key
order by sensor_key;
