-- Supabase RPC endpoints for ESP32/Arduino direct command polling.
--
-- This lets the device read/ack greenhouse_commands directly from Supabase
-- without exposing table-wide read/write access.
--
-- NEVER put the service_role key in the Arduino. Use the Supabase anon key
-- plus these RPC functions.

create extension if not exists pgcrypto;

create or replace function public.device_next_greenhouse_command(
  input_device_id uuid,
  input_device_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_device public.greenhouse_devices%rowtype;
  selected_command public.greenhouse_commands%rowtype;
  retry_window_sec integer := 60;
  retry_before timestamptz := now() - make_interval(secs => retry_window_sec);
begin
  select *
    into matched_device
    from public.greenhouse_devices gd
    where gd.id = input_device_id
      and gd.status = 'active'
      and gd.api_token_hash = encode(digest(trim(input_device_token), 'sha256'), 'hex')
    limit 1;

  if matched_device.id is null then
    raise exception 'Dispositivo no autorizado';
  end if;

  select *
    into selected_command
    from public.greenhouse_commands gc
    where gc.device_id = input_device_id
      and (
        gc.status = 'pending'
        or (
          gc.status = 'dispatched'
          and gc.dispatched_at is not null
          and gc.dispatched_at < retry_before
        )
      )
    order by
      case when gc.status = 'pending' then 0 else 1 end,
      gc.created_at asc
    limit 1
    for update skip locked;

  if selected_command.id is null then
    update public.greenhouse_devices
      set last_seen_at = now(),
          updated_at = now()
      where id = input_device_id;

    return jsonb_build_object(
      'command', null,
      'poll_after_sec', 5
    );
  end if;

  update public.greenhouse_commands
    set status = 'dispatched',
        dispatched_at = now()
    where id = selected_command.id
    returning * into selected_command;

  update public.greenhouse_devices
    set last_seen_at = now(),
        updated_at = now()
    where id = input_device_id;

  return jsonb_build_object(
    'command', to_jsonb(selected_command),
    'poll_after_sec', 5
  );
end;
$$;

create or replace function public.device_ack_greenhouse_command(
  input_device_id uuid,
  input_device_token text,
  input_command_id bigint,
  input_success boolean,
  input_result jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_device public.greenhouse_devices%rowtype;
  updated_command public.greenhouse_commands%rowtype;
begin
  select *
    into matched_device
    from public.greenhouse_devices gd
    where gd.id = input_device_id
      and gd.status = 'active'
      and gd.api_token_hash = encode(digest(trim(input_device_token), 'sha256'), 'hex')
    limit 1;

  if matched_device.id is null then
    raise exception 'Dispositivo no autorizado';
  end if;

  update public.greenhouse_commands
    set status = case when input_success then 'completed' else 'failed' end,
        completed_at = now(),
        result_payload = coalesce(input_result, '{}'::jsonb)
    where id = input_command_id
      and device_id = input_device_id
    returning * into updated_command;

  if updated_command.id is null then
    raise exception 'Comando no encontrado para este dispositivo';
  end if;

  update public.greenhouse_devices
    set last_seen_at = now(),
        updated_at = now()
    where id = input_device_id;

  return jsonb_build_object(
    'command_id', updated_command.id,
    'status', updated_command.status,
    'completed_at', updated_command.completed_at
  );
end;
$$;

grant execute on function public.device_next_greenhouse_command(uuid, text) to anon, authenticated;
grant execute on function public.device_ack_greenhouse_command(uuid, text, bigint, boolean, jsonb) to anon, authenticated;
