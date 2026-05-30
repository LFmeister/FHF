-- Reset greenhouse telemetry to the v2 flexible model.
--
-- WARNING: this deletes existing telemetry history and sensor readings.
-- It keeps greenhouse_devices, greenhouse_commands, and project integrations.
--
-- Run this only if you are OK losing old greenhouse_telemetry rows.

drop function if exists public.greenhouse_apply_three_float_payload() cascade;
drop function if exists public.greenhouse_jsonb_to_bool(jsonb) cascade;
drop function if exists public.greenhouse_jsonb_to_smallint(jsonb) cascade;
drop function if exists public.greenhouse_jsonb_to_integer(jsonb) cascade;

drop table if exists public.greenhouse_sensor_readings cascade;
drop table if exists public.greenhouse_telemetry cascade;

create table if not exists public.greenhouse_telemetry (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.greenhouse_devices(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  source text not null default 'esp32-gateway',
  device_uptime_ms bigint,
  stream boolean,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists greenhouse_telemetry_device_recorded_idx
  on public.greenhouse_telemetry(device_id, recorded_at desc);

alter table public.greenhouse_telemetry enable row level security;

drop policy if exists "Project members can view linked greenhouse telemetry" on public.greenhouse_telemetry;
create policy "Project members can view linked greenhouse telemetry"
on public.greenhouse_telemetry
for select
using (
  exists (
    select 1
    from public.project_greenhouse_integrations pgi
    join public.project_members pm on pm.project_id = pgi.project_id
    where pm.user_id = auth.uid()
      and pgi.device_id = greenhouse_telemetry.device_id
  )
);

create table if not exists public.greenhouse_sensor_readings (
  id bigint generated always as identity primary key,
  telemetry_id bigint references public.greenhouse_telemetry(id) on delete cascade,
  device_id uuid not null references public.greenhouse_devices(id) on delete cascade,
  recorded_at timestamptz not null,
  sensor_key text not null,
  sensor_label text,
  sensor_kind text not null,
  metric text not null,
  unit text,
  value_number numeric,
  value_boolean boolean,
  value_text text,
  metadata jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint greenhouse_sensor_readings_has_value check (
    value_number is not null
    or value_boolean is not null
    or value_text is not null
  )
);

create index if not exists greenhouse_sensor_readings_device_recorded_idx
  on public.greenhouse_sensor_readings(device_id, recorded_at desc);

create index if not exists greenhouse_sensor_readings_sensor_metric_idx
  on public.greenhouse_sensor_readings(device_id, sensor_key, metric, recorded_at desc);

create unique index if not exists greenhouse_sensor_readings_unique_metric_idx
  on public.greenhouse_sensor_readings(telemetry_id, sensor_key, metric);

alter table public.greenhouse_sensor_readings enable row level security;

drop policy if exists "Project members can view linked greenhouse sensor readings" on public.greenhouse_sensor_readings;
create policy "Project members can view linked greenhouse sensor readings"
on public.greenhouse_sensor_readings
for select
using (
  exists (
    select 1
    from public.project_greenhouse_integrations pgi
    join public.project_members pm on pm.project_id = pgi.project_id
    where pgi.device_id = greenhouse_sensor_readings.device_id
      and pm.user_id = auth.uid()
  )
);
