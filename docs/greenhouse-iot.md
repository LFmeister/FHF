# FHF Greenhouse IoT Integration

## Purpose

This document defines the production-ready remote architecture for the greenhouse project.

The current stack is:

- Arduino Uno as the field controller
- a local gateway process next to the Arduino in Colombia
- FHF PHP endpoints as the application backend
- Supabase as persistent storage and command queue
- an AI worker in Australia that reads telemetry and creates commands

## Architecture

The field side and the AI side must be decoupled.

1. The Arduino reads sensors and exposes a serial protocol.
2. The gateway process reads serial status frames from the Arduino.
3. The gateway uploads telemetry to FHF.
4. FHF writes telemetry and commands to Supabase.
5. The Australia-side worker polls the latest telemetry from FHF.
6. The worker decides a safe action and creates a command in FHF.
7. The gateway polls FHF for pending commands, applies them to the Arduino, and acknowledges the result.

This is intentionally asynchronous. A greenhouse does not need a hard real-time round trip between Colombia and Australia.

## Why this is viable

This design is viable for hobby automation because the relevant changes are slow:

- `DHT11` values change slowly
- the float switch changes rarely
- light and irrigation actions happen on the order of seconds or minutes, not milliseconds

What must remain local:

- pump safety when the tank is low
- fallback behavior if internet fails
- actuator limits such as maximum pump duration

## Security

### Supabase secrets

The Supabase URL, anon key, and service role key are no longer hardcoded in PHP.

They are now read from:

- `config/env.php`
- `config/database.php`
- `.env`
- `.env.example`

Important:

- the old `service_role` key must be rotated in Supabase before exposing the system publicly
- `.env` must stay private and is already ignored by `.gitignore`

### Device authentication

Every field gateway uses:

- `device_id`
- `device_token`

Only the SHA-256 hash of the device token is stored in Supabase.

### Control-plane authentication

The AI worker uses:

- `FHF_IOT_CONTROL_TOKEN`

That token is required to read remote telemetry and enqueue commands.

## Supabase schema

Run `supabase/greenhouse_schema.sql` in Supabase.

The schema creates:

- `greenhouse_devices`
- `greenhouse_telemetry`
- `greenhouse_commands`
- `project_greenhouse_integrations`

The queue supports:

- `pending`
- `dispatched`
- `completed`
- `failed`
- `cancelled`

## Project dashboard integration

The accounting app can now link one greenhouse to one project.

The project user pastes a greenhouse code inside the project dashboard. That code creates or updates a row in:

- `project_greenhouse_integrations`

Current practical rule:

- for local/demo testing use `GH-COL-7429`

The frontend uses that code to show:

- latest temperature
- humidity
- tank status
- light and pump state
- recent telemetry samples
- recent commands

If you later want a real device to be linkable by code, store the pairing code in:

- `greenhouse_devices.metadata.integration_code`

There is also a retry window for stale `dispatched` commands so a gateway crash does not permanently lose a command.

## Endpoints

### Device-side endpoints

- `POST /api/iot/telemetry/ingest.php`
- `POST /api/iot/commands/next.php`
- `POST /api/iot/commands/ack.php`

### Worker-side endpoints

- `GET /api/iot/telemetry/latest.php`
- `POST /api/iot/commands/create.php`

## Recommended timing

These defaults are the correct starting point for the current hardware:

- Arduino local serial status: every `5 seconds`
- telemetry upload to FHF/Supabase: every `30 seconds`
- immediate upload on important state change: enabled
- command polling from the gateway: every `5 seconds`
- stale dispatched command retry window: `60 seconds`
- AI decision polling in Australia: every `15 seconds`

Why not every 2 seconds in Supabase:

- DHT11 and float switch do not justify that write rate
- it creates noise and unnecessary database writes
- `30 seconds` is enough for monitoring and AI decisions in a hobby greenhouse

## Deployment flow

1. Run `supabase/greenhouse_schema.sql`.
2. Create one device row in `greenhouse_devices`.
3. Generate a long random plaintext device token.
4. Store only its SHA-256 hash in Supabase.
5. Copy `.env.example` to `.env` in `FHF` and fill in the secrets.
6. Rotate the old Supabase `service_role` key.
7. Deploy FHF behind HTTPS.
8. Run the gateway process next to the Arduino.
9. Run the AI worker from Australia.

## Operational notes

- The Arduino Uno cannot upload to Supabase directly by itself because it has no network stack in the current setup.
- The upload path is: `Arduino -> gateway -> FHF -> Supabase`.
- This is the correct design for your current hardware.
- If you later migrate to an ESP32 or another network-capable board, the transport layer can change without changing the database model.
