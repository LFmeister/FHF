-- RPCs for Meister Greenhouse AI to create and inspect greenhouse commands.
--
-- Why this exists:
-- - The local Telegram bot runs with the Supabase anon key.
-- - We do not want to expose broad insert/select permissions on greenhouse_commands.
-- - These functions validate a separate bot command token stored as a SHA-256 hash
--   in greenhouse_devices.metadata.ai_command_token_hash.
--
-- 1) Choose a long secret token for the bot, for example:
--    openssl rand -hex 32
--
-- 2) Store only its hash in Supabase:
--    update public.greenhouse_devices
--    set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
--      'ai_command_token_hash',
--      encode(extensions.digest(convert_to('PASTE_LONG_BOT_COMMAND_TOKEN_HERE', 'UTF8'), 'sha256'::text), 'hex')
--    )
--    where id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71';
--
-- 3) Add the plaintext token to the bot .env as:
--    GREENHOUSE_BOT_COMMAND_TOKEN=PASTE_LONG_BOT_COMMAND_TOKEN_HERE

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.greenhouse_authorize_bot_command(
  input_device_id uuid,
  input_bot_token text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.greenhouse_devices gd
    where gd.id = input_device_id
      and gd.status = 'active'
      and gd.metadata->>'ai_command_token_hash' = encode(
        extensions.digest(convert_to(trim(input_bot_token), 'UTF8'), 'sha256'::text),
        'hex'
      )
  );
$$;

create or replace function public.bot_create_greenhouse_command(
  input_device_id uuid,
  input_bot_token text,
  input_command_text text,
  input_command_type text default 'manual',
  input_payload jsonb default '{}'::jsonb,
  input_reason text default null,
  input_dedupe_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_command public.greenhouse_commands%rowtype;
  existing_command public.greenhouse_commands%rowtype;
  normalized_dedupe_key text := nullif(trim(coalesce(input_dedupe_key, '')), '');
begin
  if not public.greenhouse_authorize_bot_command(input_device_id, input_bot_token) then
    raise exception 'Bot no autorizado para crear comandos';
  end if;

  if nullif(trim(coalesce(input_command_text, '')), '') is null then
    raise exception 'input_command_text es requerido';
  end if;

  if normalized_dedupe_key is not null then
    select *
      into existing_command
      from public.greenhouse_commands gc
      where gc.device_id = input_device_id
        and gc.dedupe_key = normalized_dedupe_key
      limit 1;

    if existing_command.id is not null then
      return jsonb_build_object(
        'command', to_jsonb(existing_command),
        'duplicate', true
      );
    end if;
  end if;

  insert into public.greenhouse_commands (
    device_id,
    command_text,
    command_type,
    payload,
    reason,
    created_by,
    dedupe_key,
    status
  )
  values (
    input_device_id,
    trim(input_command_text),
    nullif(trim(coalesce(input_command_type, '')), ''),
    coalesce(input_payload, '{}'::jsonb),
    nullif(trim(coalesce(input_reason, '')), ''),
    'meister-greenhouse-ai',
    normalized_dedupe_key,
    'pending'
  )
  returning * into inserted_command;

  return jsonb_build_object(
    'command', to_jsonb(inserted_command),
    'duplicate', false
  );
end;
$$;

create or replace function public.bot_list_greenhouse_commands(
  input_device_id uuid,
  input_bot_token text,
  input_limit integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_limit integer := greatest(1, least(coalesce(input_limit, 10), 25));
  commands jsonb;
begin
  if not public.greenhouse_authorize_bot_command(input_device_id, input_bot_token) then
    raise exception 'Bot no autorizado para leer comandos';
  end if;

  select coalesce(jsonb_agg(to_jsonb(command_rows)), '[]'::jsonb)
    into commands
    from (
      select
        id,
        device_id,
        command_text,
        command_type,
        payload,
        reason,
        created_by,
        status,
        dispatched_at,
        completed_at,
        result_payload,
        created_at
      from public.greenhouse_commands
      where device_id = input_device_id
      order by created_at desc
      limit safe_limit
    ) command_rows;

  return jsonb_build_object('commands', commands);
end;
$$;

grant execute on function public.greenhouse_authorize_bot_command(uuid, text) to anon, authenticated;
grant execute on function public.bot_create_greenhouse_command(uuid, text, text, text, jsonb, text, text) to anon, authenticated;
grant execute on function public.bot_list_greenhouse_commands(uuid, text, integer) to anon, authenticated;
