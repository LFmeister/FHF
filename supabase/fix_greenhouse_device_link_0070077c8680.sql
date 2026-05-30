-- Fix project greenhouse integration to point to the ESP32 device that is
-- actually receiving telemetry.
--
-- Wrong device_id seen by the app:
-- c056ac9b-f101-4865-8241-961fed2db3a5
--
-- Correct device_id:
-- 6f272f36-131f-4c87-b9f7-3bb0a83d4c71

update public.project_greenhouse_integrations
set
  device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71',
  greenhouse_code = 'GH-0070077C8680',
  metadata = coalesce(metadata, '{}'::jsonb) || '{
    "device_name": "ESP32 Invernadero 00:70:07:7C:86:80",
    "location": "Girardota, Antioquia, Colombia",
    "timezone": "America/Bogota",
    "status": "active",
    "pairing_type": "device-id",
    "esp32_mac": "00:70:07:7C:86:80"
  }'::jsonb,
  updated_at = now()
where device_id = 'c056ac9b-f101-4865-8241-961fed2db3a5'
   or greenhouse_code = 'GH-0070077C8680'
returning project_id, device_id, greenhouse_code, metadata;

-- Verify latest telemetry for the corrected device.
select
  id,
  device_id,
  recorded_at,
  tank_low,
  tank_mid,
  tank_full,
  float_low_raw,
  float_mid_raw,
  float_high_raw,
  float_low_state,
  float_mid_state,
  float_high_state
from public.greenhouse_telemetry
where device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'
order by recorded_at desc
limit 10;
