-- Connect a project to a greenhouse device by greenhouse_devices.metadata.integration_code.
--
-- Run this in Supabase SQL editor after the device exists in greenhouse_devices.
-- It lets the frontend connect dynamic codes such as GH-0070077C8680 without
-- exposing unlinked devices through broad RLS select policies.

drop function if exists public.connect_project_greenhouse_by_code(uuid, text);

create or replace function public.connect_project_greenhouse_by_code(
  target_project_id uuid,
  target_greenhouse_code text
)
returns table (
  linked_project_id uuid,
  linked_device_id uuid,
  linked_greenhouse_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(trim(target_greenhouse_code));
  matched_device public.greenhouse_devices%rowtype;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  if normalized_code = '' then
    raise exception 'Codigo de invernadero requerido';
  end if;

  if not exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = current_user_id
      and pm.role in ('owner', 'admin', 'normal')
  ) then
    raise exception 'No tienes permisos para enlazar este invernadero';
  end if;

  select gd.*
    into matched_device
    from public.greenhouse_devices gd
    where gd.status = 'active'
      and upper(gd.metadata->>'integration_code') = normalized_code
    limit 1;

  if matched_device.id is null then
    raise exception 'Codigo no reconocido: %', normalized_code;
  end if;

  insert into public.project_greenhouse_integrations (
    project_id,
    device_id,
    greenhouse_code,
    connected_by,
    metadata,
    connected_at
  )
  values (
    target_project_id,
    matched_device.id,
    normalized_code,
    current_user_id,
    coalesce(matched_device.metadata, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
      'device_name', matched_device.name,
      'location', matched_device.location,
      'timezone', matched_device.timezone,
      'status', matched_device.status,
      'pairing_type', 'device-code'
    )),
    now()
  )
  on conflict on constraint project_greenhouse_integrations_pkey
  do update set
    device_id = excluded.device_id,
    greenhouse_code = excluded.greenhouse_code,
    connected_by = excluded.connected_by,
    metadata = excluded.metadata,
    updated_at = now();

  return query
  select
    target_project_id as linked_project_id,
    matched_device.id as linked_device_id,
    normalized_code as linked_greenhouse_code;
end;
$$;

grant execute on function public.connect_project_greenhouse_by_code(uuid, text) to authenticated;
