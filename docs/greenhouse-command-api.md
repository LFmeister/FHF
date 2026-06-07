# Greenhouse Command API

El Arduino/ESP32 no debe leer Supabase directamente. Debe consultar los comandos a traves del backend PHP.

## Autenticacion del dispositivo

Todos los endpoints del dispositivo usan:

```http
X-Device-Id: 6f272f36-131f-4c87-b9f7-3bb0a83d4c71
X-Device-Token: TOKEN_EN_TEXTO_PLANO_DEL_DISPOSITIVO
Content-Type: application/json
```

El token en texto plano debe coincidir con el `api_token_hash` guardado en `greenhouse_devices`.

## Leer siguiente comando

```http
POST /api/iot/commands/next.php
```

Tambien funciona con `GET`, pero se recomienda `POST` desde la placa para mantener consistencia.

Respuesta cuando no hay comandos:

```json
{
  "success": true,
  "message": "Sin comandos pendientes",
  "data": {
    "command": null,
    "poll_after_sec": 5
  }
}
```

Respuesta cuando hay comando:

```json
{
  "success": true,
  "message": "Comando disponible",
  "data": {
    "command": {
      "id": 123,
      "device_id": "6f272f36-131f-4c87-b9f7-3bb0a83d4c71",
      "command_text": "PUMP_ON",
      "command_type": "pump",
      "payload": {
        "duration_ms": 30000
      },
      "reason": "Riego manual desde dashboard",
      "status": "dispatched",
      "created_at": "2026-05-31T00:00:00Z",
      "dispatched_at": "2026-05-31T00:00:05Z"
    },
    "poll_after_sec": 5
  }
}
```

Cuando `next.php` entrega un comando, automaticamente cambia su estado:

```text
pending -> dispatched
```

Si un comando queda en `dispatched` demasiado tiempo sin confirmacion, puede volver a entregarse despues de `FHF_IOT_COMMAND_RETRY_SEC`.

## Confirmar comando ejecutado

```http
POST /api/iot/commands/ack.php
```

Body si se ejecuto correctamente:

```json
{
  "command_id": 123,
  "success": true,
  "result": {
    "ack": "pump_started",
    "duration_ms": 30000
  }
}
```

Body si fallo:

```json
{
  "command_id": 123,
  "success": false,
  "result": {
    "error": "tank_low",
    "message": "No se activa bomba porque el tanque esta bajo"
  }
}
```

El endpoint actualiza:

```text
success true  -> completed
success false -> failed
```

## Crear comandos desde servidor/control

Este endpoint no es para el Arduino; es para la app, dashboard, worker o automatizacion:

```http
POST /api/iot/commands/create.php
X-Control-Token: CONTROL_TOKEN
```

Body:

```json
{
  "device_id": "6f272f36-131f-4c87-b9f7-3bb0a83d4c71",
  "command_text": "PUMP_ON",
  "command_type": "pump",
  "payload": {
    "duration_ms": 30000
  },
  "reason": "Riego manual desde dashboard",
  "created_by": "dashboard",
  "dedupe_key": "optional-unique-key"
}
```

## Flujo recomendado en la placa

1. Enviar telemetria cada intervalo.
2. Consultar `/api/iot/commands/next.php` cada 5 segundos.
3. Si `data.command` es `null`, esperar `poll_after_sec`.
4. Si llega comando, ejecutarlo localmente con validaciones de seguridad.
5. Confirmar con `/api/iot/commands/ack.php`.

La placa siempre debe aplicar seguridad local. Por ejemplo, no encender bomba si el flotador indica tanque bajo, aunque llegue un comando.
