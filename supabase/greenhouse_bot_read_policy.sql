-- Allows the local Meister Greenhouse bot to read telemetry with the public anon key.
-- The policy is restricted to the known ESP32 greenhouse device.
--
-- Run this only if /diagnostico in Telegram shows 0 visible telemetry rows,
-- while the Supabase SQL editor shows rows in greenhouse_telemetry.

grant select on public.greenhouse_telemetry to anon;
grant select on public.greenhouse_sensor_readings to anon;

alter table public.greenhouse_telemetry enable row level security;
alter table public.greenhouse_sensor_readings enable row level security;

drop policy if exists "greenhouse bot can read esp32 telemetry" on public.greenhouse_telemetry;
create policy "greenhouse bot can read esp32 telemetry"
on public.greenhouse_telemetry
for select
to anon
using (
  device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'::uuid
);

drop policy if exists "greenhouse bot can read esp32 sensor readings" on public.greenhouse_sensor_readings;
create policy "greenhouse bot can read esp32 sensor readings"
on public.greenhouse_sensor_readings
for select
to anon
using (
  device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'::uuid
);
