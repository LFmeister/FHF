-- Add explicit columns for three tank float switches.
-- Run this in Supabase SQL editor before deploying the updated ingest endpoint.

alter table public.greenhouse_telemetry
  add column if not exists tank_mid boolean,
  add column if not exists tank_full boolean,
  add column if not exists float_low_raw smallint,
  add column if not exists float_mid_raw smallint,
  add column if not exists float_high_raw smallint,
  add column if not exists float_low_state text,
  add column if not exists float_mid_state text,
  add column if not exists float_high_state text,
  add column if not exists float_mid_active_when text,
  add column if not exists float_high_active_when text,
  add column if not exists dht_fresh boolean,
  add column if not exists dht_age_ms integer;

create index if not exists greenhouse_telemetry_tank_level_idx
  on public.greenhouse_telemetry(device_id, tank_low, tank_mid, tank_full, recorded_at desc);

create or replace function public.greenhouse_jsonb_to_bool(value jsonb)
returns boolean
language sql
immutable
as $$
  select case
    when value is null then null
    when jsonb_typeof(value) = 'boolean' then (value #>> '{}')::boolean
    when lower(value #>> '{}') in ('1', 'true', 't', 'yes', 'y', 'on') then true
    when lower(value #>> '{}') in ('0', 'false', 'f', 'no', 'n', 'off') then false
    else null
  end;
$$;

create or replace function public.greenhouse_jsonb_to_smallint(value jsonb)
returns smallint
language sql
immutable
as $$
  select case
    when value is null then null
    when (value #>> '{}') ~ '^-?[0-9]+$' then (value #>> '{}')::smallint
    else null
  end;
$$;

create or replace function public.greenhouse_jsonb_to_integer(value jsonb)
returns integer
language sql
immutable
as $$
  select case
    when value is null then null
    when (value #>> '{}') ~ '^-?[0-9]+$' then (value #>> '{}')::integer
    else null
  end;
$$;

create or replace function public.greenhouse_apply_three_float_payload()
returns trigger
language plpgsql
as $$
declare
  payload jsonb := coalesce(new.raw_payload, '{}'::jsonb);
  status jsonb := coalesce(payload->'status', payload);
  switches jsonb := coalesce(payload->'float_switches', '{}'::jsonb);
begin
  new.tank_low := coalesce(
    new.tank_low,
    public.greenhouse_jsonb_to_bool(status->'tank_low'),
    public.greenhouse_jsonb_to_bool(switches->'low'->'tank_low')
  );

  new.tank_mid := coalesce(
    new.tank_mid,
    public.greenhouse_jsonb_to_bool(status->'tank_mid'),
    public.greenhouse_jsonb_to_bool(switches->'mid'->'active')
  );

  new.tank_full := coalesce(
    new.tank_full,
    public.greenhouse_jsonb_to_bool(status->'tank_full'),
    public.greenhouse_jsonb_to_bool(switches->'high'->'active')
  );

  new.float_low_raw := coalesce(
    new.float_low_raw,
    public.greenhouse_jsonb_to_smallint(status->'float_low_raw'),
    public.greenhouse_jsonb_to_smallint(switches->'low'->'raw')
  );

  new.float_mid_raw := coalesce(
    new.float_mid_raw,
    public.greenhouse_jsonb_to_smallint(status->'float_mid_raw'),
    public.greenhouse_jsonb_to_smallint(switches->'mid'->'raw')
  );

  new.float_high_raw := coalesce(
    new.float_high_raw,
    public.greenhouse_jsonb_to_smallint(status->'float_high_raw'),
    public.greenhouse_jsonb_to_smallint(switches->'high'->'raw')
  );

  new.float_low_state := coalesce(new.float_low_state, status->>'float_low_state', switches->'low'->>'state');
  new.float_mid_state := coalesce(new.float_mid_state, status->>'float_mid_state', switches->'mid'->>'state');
  new.float_high_state := coalesce(new.float_high_state, status->>'float_high_state', switches->'high'->>'state');
  new.float_mid_active_when := coalesce(new.float_mid_active_when, status->>'float_mid_active_when');
  new.float_high_active_when := coalesce(new.float_high_active_when, status->>'float_high_active_when');
  new.dht_fresh := coalesce(new.dht_fresh, public.greenhouse_jsonb_to_bool(status->'dht_fresh'));
  new.dht_age_ms := coalesce(new.dht_age_ms, public.greenhouse_jsonb_to_integer(status->'dht_age_ms'));

  return new;
end;
$$;

drop trigger if exists greenhouse_telemetry_three_float_payload on public.greenhouse_telemetry;
create trigger greenhouse_telemetry_three_float_payload
before insert or update of raw_payload on public.greenhouse_telemetry
for each row
execute function public.greenhouse_apply_three_float_payload();

update public.greenhouse_telemetry
set raw_payload = raw_payload
where raw_payload is not null
  and (
    tank_mid is null
    or tank_full is null
    or float_low_raw is null
    or float_mid_raw is null
    or float_high_raw is null
    or float_low_state is null
    or float_mid_state is null
    or float_high_state is null
  );
