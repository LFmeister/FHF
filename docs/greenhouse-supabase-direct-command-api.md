# ESP32 Direct Supabase Command API

Use this only if the ESP32 will talk directly to Supabase instead of the PHP backend.

Do not put the Supabase `service_role` key in the device. Use only the public anon key plus the RPC functions from:

```text
supabase/greenhouse_device_command_rpc.sql
```

## Supabase values needed by the ESP32

```cpp
#define SUPABASE_URL "https://skejleilyksauxtrhxac.supabase.co"
#define SUPABASE_ANON_KEY "YOUR_SUPABASE_ANON_KEY"
#define DEVICE_ID "6f272f36-131f-4c87-b9f7-3bb0a83d4c71"
#define DEVICE_TOKEN "YOUR_DEVICE_TOKEN_PLAINTEXT"
```

`DEVICE_TOKEN` is not visible in Supabase if you only stored its hash. If you lost it, create a new one and update:

```sql
update public.greenhouse_devices
set api_token_hash = encode(digest('NEW_LONG_DEVICE_TOKEN', 'sha256'), 'hex')
where id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71';
```

## Read next command

POST:

```text
https://skejleilyksauxtrhxac.supabase.co/rest/v1/rpc/device_next_greenhouse_command
```

Headers:

```http
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

Body:

```json
{
  "input_device_id": "6f272f36-131f-4c87-b9f7-3bb0a83d4c71",
  "input_device_token": "YOUR_DEVICE_TOKEN_PLAINTEXT"
}
```

Response with no command:

```json
{
  "command": null,
  "poll_after_sec": 5
}
```

Response with command:

```json
{
  "command": {
    "id": 123,
    "device_id": "6f272f36-131f-4c87-b9f7-3bb0a83d4c71",
    "command_text": "PUMP_ON",
    "command_type": "pump",
    "payload": {
      "duration_ms": 30000
    },
    "status": "dispatched"
  },
  "poll_after_sec": 5
}
```

## Acknowledge command

POST:

```text
https://skejleilyksauxtrhxac.supabase.co/rest/v1/rpc/device_ack_greenhouse_command
```

Headers:

```http
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

Body success:

```json
{
  "input_device_id": "6f272f36-131f-4c87-b9f7-3bb0a83d4c71",
  "input_device_token": "YOUR_DEVICE_TOKEN_PLAINTEXT",
  "input_command_id": 123,
  "input_success": true,
  "input_result": {
    "ack": "executed"
  }
}
```

Body failure:

```json
{
  "input_device_id": "6f272f36-131f-4c87-b9f7-3bb0a83d4c71",
  "input_device_token": "YOUR_DEVICE_TOKEN_PLAINTEXT",
  "input_command_id": 123,
  "input_success": false,
  "input_result": {
    "error": "tank_low"
  }
}
```

## Why not read the table directly?

Direct table reads like `/rest/v1/greenhouse_commands?...` are risky with an anon key. The RPC functions validate the device token, update command state, and prevent reading commands from another device.
