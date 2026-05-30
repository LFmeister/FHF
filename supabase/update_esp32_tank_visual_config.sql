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
        "pin": 18,
        "active_when": "closed"
      },
      "high": {
        "label": "Alto",
        "position_percent": 90,
        "pin": 19,
        "active_when": "closed"
      }
    }
  },
  "sensor_layout": {
    "environment": [
      {
        "key": "dht_1",
        "label": "DHT11 ambiente 1",
        "data_pin": 4
      },
      {
        "key": "dht_2",
        "label": "DHT11 ambiente 2",
        "data_pin": 14
      },
      {
        "key": "dht_3",
        "label": "DHT11 ambiente 3",
        "data_pin": 16
      }
    ],
    "soil_moisture": [
      {
        "key": "soil_1",
        "label": "Suelo 1",
        "analog_pin": 32
      },
      {
        "key": "soil_2",
        "label": "Suelo 2",
        "analog_pin": 33
      },
      {
        "key": "soil_3",
        "label": "Suelo 3",
        "analog_pin": 34
      },
      {
        "key": "soil_4",
        "label": "Suelo 4",
        "analog_pin": 35
      },
      {
        "key": "soil_5",
        "label": "Suelo 5",
        "analog_pin": "SVN"
      }
    ]
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
        "pin": 18,
        "active_when": "closed"
      },
      "high": {
        "label": "Alto",
        "position_percent": 90,
        "pin": 19,
        "active_when": "closed"
      }
    }
  },
  "sensor_layout": {
    "environment": [
      {
        "key": "dht_1",
        "label": "DHT11 ambiente 1",
        "data_pin": 4
      },
      {
        "key": "dht_2",
        "label": "DHT11 ambiente 2",
        "data_pin": 14
      },
      {
        "key": "dht_3",
        "label": "DHT11 ambiente 3",
        "data_pin": 16
      }
    ],
    "soil_moisture": [
      {
        "key": "soil_1",
        "label": "Suelo 1",
        "analog_pin": 32
      },
      {
        "key": "soil_2",
        "label": "Suelo 2",
        "analog_pin": 33
      },
      {
        "key": "soil_3",
        "label": "Suelo 3",
        "analog_pin": 34
      },
      {
        "key": "soil_4",
        "label": "Suelo 4",
        "analog_pin": 35
      },
      {
        "key": "soil_5",
        "label": "Suelo 5",
        "analog_pin": "SVN"
      }
    ]
  }
}'::jsonb,
updated_at = now()
where device_id = '6f272f36-131f-4c87-b9f7-3bb0a83d4c71'
returning project_id, device_id, metadata->'tank_config' as tank_config;
