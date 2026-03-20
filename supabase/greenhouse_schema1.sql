-- Incremental migration for project/greenhouse integration
-- Run this after the original greenhouse_schema.sql

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

create table if not exists public.project_greenhouse_integrations (
  project_id uuid primary key references public.projects(id) on delete cascade,
  device_id uuid references public.greenhouse_devices(id) on delete set null,
  greenhouse_code text not null,
  connected_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists project_greenhouse_integrations_device_idx
  on public.project_greenhouse_integrations(device_id)
  where device_id is not null;

create index if not exists project_greenhouse_integrations_project_code_idx
  on public.project_greenhouse_integrations(project_id, greenhouse_code);

drop trigger if exists project_greenhouse_integrations_set_updated_at on public.project_greenhouse_integrations;
create trigger project_greenhouse_integrations_set_updated_at
before update on public.project_greenhouse_integrations
for each row execute function public.set_updated_at();

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
    where pgi.device_id = greenhouse_telemetry.device_id
      and pm.user_id = auth.uid()
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

-- Optional demo reference:
-- use GH-COL-7429 as the local pairing code in the frontend

