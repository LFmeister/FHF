create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.greenhouse_devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  timezone text not null default 'UTC',
  status text not null default 'active' check (status in ('active', 'disabled')),
  api_token_hash text not null unique,
  last_seen_at timestamptz,
  last_ip text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.greenhouse_telemetry (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.greenhouse_devices(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  source text not null default 'arduino-gateway',
  device_uptime_ms bigint,
  dht_ok boolean,
  temp_c numeric(6,2),
  hum_pct numeric(6,2),
  float_raw smallint,
  float_state text,
  tank_low boolean,
  tank_low_when text,
  light_on boolean,
  pump_on boolean,
  pump_remaining_ms integer,
  stream boolean,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.greenhouse_commands (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.greenhouse_devices(id) on delete cascade,
  command_text text not null,
  command_type text not null,
  payload jsonb not null default '{}'::jsonb,
  reason text,
  created_by text not null default 'system',
  dedupe_key text,
  status text not null default 'pending' check (status in ('pending', 'dispatched', 'completed', 'failed', 'cancelled')),
  dispatched_at timestamptz,
  completed_at timestamptz,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.project_greenhouse_integrations (
  project_id uuid primary key references public.projects(id) on delete cascade,
  device_id uuid references public.greenhouse_devices(id) on delete set null,
  greenhouse_code text not null,
  connected_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists greenhouse_commands_dedupe_key_idx
  on public.greenhouse_commands(dedupe_key)
  where dedupe_key is not null;

create index if not exists greenhouse_telemetry_device_recorded_idx
  on public.greenhouse_telemetry(device_id, recorded_at desc);

create index if not exists greenhouse_commands_device_status_created_idx
  on public.greenhouse_commands(device_id, status, created_at asc);

create unique index if not exists project_greenhouse_integrations_device_idx
  on public.project_greenhouse_integrations(device_id)
  where device_id is not null;

create index if not exists project_greenhouse_integrations_project_code_idx
  on public.project_greenhouse_integrations(project_id, greenhouse_code);

drop trigger if exists greenhouse_devices_set_updated_at on public.greenhouse_devices;
create trigger greenhouse_devices_set_updated_at
before update on public.greenhouse_devices
for each row execute function public.set_updated_at();

drop trigger if exists project_greenhouse_integrations_set_updated_at on public.project_greenhouse_integrations;
create trigger project_greenhouse_integrations_set_updated_at
before update on public.project_greenhouse_integrations
for each row execute function public.set_updated_at();

alter table public.greenhouse_devices enable row level security;
alter table public.greenhouse_telemetry enable row level security;
alter table public.greenhouse_commands enable row level security;
alter table public.project_greenhouse_integrations enable row level security;

drop policy if exists "Users can view linked greenhouse integrations" on public.project_greenhouse_integrations;
create policy "Users can view linked greenhouse integrations"
on public.project_greenhouse_integrations
for select
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_greenhouse_integrations.project_id
      and pm.user_id = auth.uid()
  )
);

drop policy if exists "Editors can link greenhouse integrations" on public.project_greenhouse_integrations;
create policy "Editors can link greenhouse integrations"
on public.project_greenhouse_integrations
for insert
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_greenhouse_integrations.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'admin', 'normal')
  )
);

drop policy if exists "Editors can update greenhouse integrations" on public.project_greenhouse_integrations;
create policy "Editors can update greenhouse integrations"
on public.project_greenhouse_integrations
for update
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_greenhouse_integrations.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'admin', 'normal')
  )
)
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_greenhouse_integrations.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'admin', 'normal')
  )
);

drop policy if exists "Editors can delete greenhouse integrations" on public.project_greenhouse_integrations;
create policy "Editors can delete greenhouse integrations"
on public.project_greenhouse_integrations
for delete
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_greenhouse_integrations.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'admin', 'normal')
  )
);

drop policy if exists "Project members can view linked greenhouse devices" on public.greenhouse_devices;
create policy "Project members can view linked greenhouse devices"
on public.greenhouse_devices
for select
using (
  exists (
    select 1
    from public.project_greenhouse_integrations pgi
    join public.project_members pm on pm.project_id = pgi.project_id
    where pgi.device_id = greenhouse_devices.id
      and pm.user_id = auth.uid()
  )
);

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
      and (
        pgi.device_id = greenhouse_telemetry.device_id
        or (
          pgi.metadata ? 'bridge_mac'
          and upper(pgi.metadata->>'bridge_mac') = upper(coalesce(greenhouse_telemetry.raw_payload->'bridge'->>'mac', ''))
        )
      )
  )
);

drop policy if exists "Project members can view linked greenhouse commands" on public.greenhouse_commands;
create policy "Project members can view linked greenhouse commands"
on public.greenhouse_commands
for select
using (
  exists (
    select 1
    from public.project_greenhouse_integrations pgi
    join public.project_members pm on pm.project_id = pgi.project_id
    where pgi.device_id = greenhouse_commands.device_id
      and pm.user_id = auth.uid()
  )
);

-- Example device creation. Replace the plaintext token before running.
-- Production pairing code currently used by the frontend:
-- GH-BCFF4D5D7AE5 -> bridge MAC BC:FF:4D:5D:7A:E5
--
-- The demo pairing code used by the frontend is GH-COL-7429.
-- insert into public.greenhouse_devices (name, location, timezone, api_token_hash, metadata)
-- values (
--   'Greenhouse Colombia',
--   'Colombia',
--   'America/Bogota',
--   encode(digest('replace-with-a-long-random-device-token', 'sha256'), 'hex'),
--   '{"integration_code":"GH-COL-7429"}'::jsonb
-- );
