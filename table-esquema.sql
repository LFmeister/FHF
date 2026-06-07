create table public.greenhouse_commands (
  id bigint generated always as identity not null,
  device_id uuid not null,
  command_text text not null,
  command_type text not null,
  payload jsonb not null default '{}'::jsonb,
  reason text null,
  created_by text not null default 'system'::text,
  dedupe_key text null,
  status text not null default 'pending'::text,
  dispatched_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint greenhouse_commands_pkey primary key (id),
  constraint greenhouse_commands_device_id_fkey foreign KEY (device_id) references greenhouse_devices (id) on delete CASCADE,
  constraint greenhouse_commands_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'dispatched'::text,
          'completed'::text,
          'failed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists greenhouse_commands_dedupe_key_idx on public.greenhouse_commands using btree (dedupe_key) TABLESPACE pg_default
where
  (dedupe_key is not null);

create index IF not exists greenhouse_commands_device_status_created_idx on public.greenhouse_commands using btree (device_id, status, created_at) TABLESPACE pg_default;