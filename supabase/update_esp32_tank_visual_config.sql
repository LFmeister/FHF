-- Optional visual configuration for the ESP32 greenhouse tank.
-- The dashboard uses these values to draw the tank and sensor positions.

update public.greenhouse_devices
set metadata = coalesce(metadata, '{}'::jsonb) || '{
  "tank_config": {
    "label": "Tanque principal",
    "shape": "vertical",
    "capacity_liters": 0,
    "sensors": {
      "low": {
        "label": "Bajo",
        "position_percent": 20,
        "pin": 27,
        "active_when": "open"
      },
      "mid": {
        "label": "Medio",
        "position_percent": 55,
        "pin": 32,
        "active_when": "closed"
      },
      "high": {
        "label": "Alto",
        "position_percent": 90,
        "pin": 33,
        "active_when": "closed"
      }
    }
  }
}'::jsonb
where id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'
returning id, name, metadata->'tank_config' as tank_config;

update public.project_greenhouse_integrations
set metadata = coalesce(metadata, '{}'::jsonb) || '{
  "tank_config": {
    "label": "Tanque principal",
    "shape": "vertical",
    "capacity_liters": 0,
    "sensors": {
      "low": {
        "label": "Bajo",
        "position_percent": 20,
        "pin": 27,
        "active_when": "open"
      },
      "mid": {
        "label": "Medio",
        "position_percent": 55,
        "pin": 32,
        "active_when": "closed"
      },
      "high": {
        "label": "Alto",
        "position_percent": 90,
        "pin": 33,
        "active_when": "closed"
      }
    }
  }
}'::jsonb,
updated_at = now()
where device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'
returning project_id, device_id, metadata->'tank_config' as tank_config;
