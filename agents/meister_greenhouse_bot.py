import json
import os
import re
import shlex
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from supabase import create_client
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, MessageHandler, filters

load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
TELEMETRY_STALE_MINUTES = int(os.getenv("TELEMETRY_STALE_MINUTES", "30"))

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
GREENHOUSE_DEVICE_ID = os.environ["GREENHOUSE_DEVICE_ID"]
GREENHOUSE_BOT_COMMAND_TOKEN = os.getenv("GREENHOUSE_BOT_COMMAND_TOKEN", "")
MAX_IRRIGATION_SECONDS = int(os.getenv("MAX_IRRIGATION_SECONDS", "120"))
GREENHOUSE_BOT_VOICE_ENABLED = os.getenv("GREENHOUSE_BOT_VOICE_ENABLED", "true").lower() in (
    "1",
    "true",
    "yes",
    "si",
)
GREENHOUSE_BOT_VOICE_ENGINE = os.getenv("GREENHOUSE_BOT_VOICE_ENGINE", "piper").lower()
GREENHOUSE_BOT_VOICE_MAX_CHARS = int(os.getenv("GREENHOUSE_BOT_VOICE_MAX_CHARS", "900"))
GREENHOUSE_BOT_VOICE_STATE_FILE = Path(
    os.getenv(
        "GREENHOUSE_BOT_VOICE_STATE_FILE",
        str(Path(__file__).with_name(".greenhouse_bot_voice.json")),
    )
)
DEFAULT_PIPER_BIN = Path(__file__).with_name(".venv-piper") / "bin" / "piper"
PIPER_BIN = os.getenv(
    "PIPER_BIN",
    str(DEFAULT_PIPER_BIN) if DEFAULT_PIPER_BIN.exists() else "piper",
)
PIPER_VOICE_MODEL = os.getenv(
    "PIPER_VOICE_MODEL",
    str(Path.home() / "piper-voices" / "es_ES-mls_9972-low.onnx"),
)
FFMPEG_BIN = os.getenv("FFMPEG_BIN", "ffmpeg")
TTS_COMMAND = os.getenv("TTS_COMMAND", "")
PIPER_VOICE_NAME = os.getenv("PIPER_VOICE_NAME", "").strip().lower()

PIPER_VOICES = {
    "sofia": {
        "display_name": "Sofia",
        "model": str(Path.home() / "piper-voices" / "es_ES-mls_9972-low.onnx"),
        "description": "Espanol de Espana, mls_9972 low. Candidata mas suave/femenina instalada.",
    },
    "pedro": {
        "display_name": "Pedro",
        "model": str(Path.home() / "piper-voices" / "es_ES-davefx-medium.onnx"),
        "description": "Espanol de Espana, davefx medium. Voz mas grave/masculina instalada.",
    },
}

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

SYSTEM_PROMPT = """
Eres Meister Greenhouse AI, el asistente local del invernadero FHF.
Responde siempre en espanol, claro y breve.
Puedes analizar sensores de temperatura, humedad ambiental, humedad de suelo, tanque, bomba, luces y camara.
Todavia no ejecutes comandos reales.
Si el usuario pide prender bomba, riego o luces, responde que primero se deben validar sensores y reglas de seguridad.
Nunca recomiendes encender la bomba si el tanque esta bajo o sin datos confiables.
Si los datos del invernadero no son recientes, dilo claramente y no saques conclusiones operativas.
"""


def voice_safe_text(text: str) -> str:
    cleaned = re.sub(r"https?://\S+", " enlace ", text)
    cleaned = re.sub(r"[#*_`|>\[\](){}]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:GREENHOUSE_BOT_VOICE_MAX_CHARS]


def normalize_voice_name(name: str) -> str:
    return re.sub(r"[^a-z0-9_-]", "", name.strip().lower())


def read_selected_voice_name() -> str:
    try:
        if GREENHOUSE_BOT_VOICE_STATE_FILE.exists():
            data = json.loads(GREENHOUSE_BOT_VOICE_STATE_FILE.read_text(encoding="utf-8"))
            selected = normalize_voice_name(str(data.get("voice") or ""))
            if selected in PIPER_VOICES:
                return selected
    except Exception as exc:
        print(f"No pude leer la voz seleccionada: {exc}")

    if PIPER_VOICE_NAME in PIPER_VOICES:
        return PIPER_VOICE_NAME

    configured_model = str(Path(PIPER_VOICE_MODEL).expanduser())
    for name, config in PIPER_VOICES.items():
        if str(Path(config["model"]).expanduser()) == configured_model:
            return name

    return "sofia"


def write_selected_voice_name(name: str) -> None:
    GREENHOUSE_BOT_VOICE_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    GREENHOUSE_BOT_VOICE_STATE_FILE.write_text(
        json.dumps({"voice": name}, ensure_ascii=True, indent=2),
        encoding="utf-8",
    )


def get_voice_config(name: str | None = None) -> tuple[str, dict[str, str]]:
    selected = normalize_voice_name(name or "") or read_selected_voice_name()
    if selected not in PIPER_VOICES:
        raise ValueError(f"Voz desconocida: {name}")

    return selected, PIPER_VOICES[selected]


def get_piper_model_path(voice_name: str | None = None) -> Path:
    if voice_name:
        _, config = get_voice_config(voice_name)
        return Path(config["model"]).expanduser()

    selected = read_selected_voice_name()
    if selected in PIPER_VOICES:
        return Path(PIPER_VOICES[selected]["model"]).expanduser()

    return Path(PIPER_VOICE_MODEL).expanduser()


def format_voice_list() -> str:
    selected = read_selected_voice_name()
    lines = [
        "Voces disponibles:",
    ]

    for name, config in PIPER_VOICES.items():
        marker = "activa" if name == selected else "disponible"
        model_path = Path(config["model"]).expanduser()
        installed = "instalada" if model_path.exists() else "no instalada"
        lines.append(
            f"- /voces {name} - {config['display_name']} ({marker}, {installed}): {config['description']}"
        )

    lines.extend(
        [
            "",
            "Uso: /voces nombre. Ejemplo: /voces sofia",
            "Para volver a oir una muestra de la actual: /voces actual",
        ]
    )
    return "\n".join(lines)


def run_command(command: list[str], input_text: str | None = None) -> None:
    subprocess.run(
        command,
        input=input_text,
        text=input_text is not None,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        timeout=90,
    )


def synthesize_with_piper(text: str, wav_path: Path, voice_name: str | None = None) -> None:
    model_path = get_piper_model_path(voice_name)
    if not model_path.exists():
        raise FileNotFoundError(f"No existe el modelo de voz Piper: {model_path}")

    run_command(
        [
            PIPER_BIN,
            "--model",
            str(model_path),
            "--output_file",
            str(wav_path),
        ],
        input_text=text,
    )


def synthesize_with_command(text: str, wav_path: Path, text_path: Path) -> None:
    if not TTS_COMMAND.strip():
        raise RuntimeError("Falta TTS_COMMAND para GREENHOUSE_BOT_VOICE_ENGINE=command.")

    text_path.write_text(text, encoding="utf-8")
    command = [
        part.format(input=str(text_path), output=str(wav_path), text=text)
        for part in shlex.split(TTS_COMMAND)
    ]
    run_command(command)


def convert_wav_to_telegram_voice(wav_path: Path, ogg_path: Path) -> None:
    run_command(
        [
            FFMPEG_BIN,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(wav_path),
            "-c:a",
            "libopus",
            "-b:a",
            "32k",
            str(ogg_path),
        ]
    )


def synthesize_voice_note(text: str, directory: Path, voice_name: str | None = None) -> Path:
    speech_text = voice_safe_text(text)
    if not speech_text:
        raise RuntimeError("No hay texto util para sintetizar voz.")

    wav_path = directory / "respuesta.wav"
    ogg_path = directory / "respuesta.ogg"
    text_path = directory / "respuesta.txt"

    if GREENHOUSE_BOT_VOICE_ENGINE == "piper":
        synthesize_with_piper(speech_text, wav_path, voice_name)
    elif GREENHOUSE_BOT_VOICE_ENGINE == "command":
        synthesize_with_command(speech_text, wav_path, text_path)
    else:
        raise RuntimeError(f"Motor de voz no soportado: {GREENHOUSE_BOT_VOICE_ENGINE}")

    convert_wav_to_telegram_voice(wav_path, ogg_path)
    return ogg_path


async def reply_voice_sample(update: Update, text: str, voice_name: str | None = None) -> bool:
    if not GREENHOUSE_BOT_VOICE_ENABLED:
        return False

    try:
        await update.message.chat.send_action(action="record_voice")
        with tempfile.TemporaryDirectory(prefix="fhf-bot-voice-") as tmp_dir:
            voice_path = synthesize_voice_note(text, Path(tmp_dir), voice_name)
            with voice_path.open("rb") as voice_file:
                await update.message.reply_voice(voice=voice_file)
        return True
    except Exception as exc:
        print(f"No pude generar nota de voz: {exc}")
        return False


async def reply_text_and_voice(update: Update, text: str) -> None:
    message = text[:4000]
    await update.message.reply_text(message)
    await reply_voice_sample(update, message)


def ask_ollama(user_text: str, context: str = "") -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if context:
        messages.append(
            {
                "role": "system",
                "content": f"Contexto actual del invernadero:\n{context}",
            }
        )

    messages.append({"role": "user", "content": user_text})

    response = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "stream": False,
            "messages": messages,
        },
        timeout=120,
    )
    response.raise_for_status()
    data = response.json()
    return data["message"]["content"].strip()


def format_value(row: dict[str, Any]) -> str:
    unit = row.get("unit") or ""

    if row.get("value_number") is not None:
        return f"{row.get('value_number')} {unit}".strip()

    if row.get("value_boolean") is not None:
        return "si" if row.get("value_boolean") else "no"

    return row.get("value_text") or "sin dato"


def metric_name(metric: str | None) -> str:
    names = {
        "temp_c": "temperatura",
        "hum_pct": "humedad ambiental",
        "moisture_pct": "humedad de suelo",
        "raw": "lectura cruda",
        "state": "estado",
        "active": "activo",
        "tank_low": "tanque bajo",
        "pump_on": "bomba",
        "light_on": "luz",
        "stream": "stream",
        "uptime_ms": "tiempo encendido",
        "pump_remaining_ms": "tiempo restante bomba",
    }
    return names.get(metric or "", metric or "sin metrica")


def parse_recorded_at(recorded_at: str | None) -> datetime | None:
    if not recorded_at:
        return None

    value = recorded_at.strip()
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    elif value.endswith("+00"):
        value = value[:-3] + "+00:00"

    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def telemetry_age_minutes(recorded_at: str | None) -> float | None:
    parsed = parse_recorded_at(recorded_at)
    if not parsed:
        return None

    return max(0, (datetime.now(timezone.utc) - parsed).total_seconds() / 60)


def is_stale_recorded_at(recorded_at: str | None) -> bool:
    age = telemetry_age_minutes(recorded_at)
    if age is None:
        return True

    return age > TELEMETRY_STALE_MINUTES


def freshness_message(recorded_at: str | None) -> str:
    age = telemetry_age_minutes(recorded_at)
    if age is None:
        return "ADVERTENCIA: no pude calcular la edad de la ultima telemetria."

    if age > TELEMETRY_STALE_MINUTES:
        return (
            "ADVERTENCIA: estos datos no son recientes. "
            f"La ultima telemetria tiene aproximadamente {age:.0f} minutos "
            f"y el limite configurado es {TELEMETRY_STALE_MINUTES} minutos."
        )

    return f"Datos recientes: ultima lectura hace aproximadamente {age:.0f} minutos."


def get_latest_sensor_rows(limit: int = 120) -> list[dict[str, Any]]:
    device_id = GREENHOUSE_DEVICE_ID.strip()
    result = (
        supabase.table("greenhouse_sensor_readings")
        .select("sensor_key,sensor_label,sensor_kind,metric,unit,value_number,value_boolean,value_text,recorded_at")
        .eq("device_id", device_id)
        .order("recorded_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


def summarize_rows(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return "No encontre lecturas recientes del invernadero en Supabase."

    latest_by_metric: dict[str, dict[str, Any]] = {}
    for row in rows:
        key = f"{row.get('sensor_key')}:{row.get('metric')}"
        if key not in latest_by_metric:
            latest_by_metric[key] = row

    environment = []
    soil = []
    tank = []
    controller = []
    other = []

    for row in latest_by_metric.values():
        kind = row.get("sensor_kind")
        metric = row.get("metric")
        label = row.get("sensor_label") or row.get("sensor_key")
        value = format_value(row)
        line = f"- {label}: {metric_name(metric)} = {value}"

        if kind in ("environment", "temperature", "humidity", "dht"):
            environment.append(line)
        elif kind in ("soil_moisture", "soil"):
            soil.append(line)
        elif kind in ("float_switch", "tank"):
            tank.append(line)
        elif kind in ("controller", "status"):
            controller.append(line)
        else:
            other.append(line)

    latest_recorded_at = rows[0].get("recorded_at")
    lines = ["Estado actual del invernadero:"]

    if latest_recorded_at:
        lines.append(f"Ultima lectura: {latest_recorded_at}")
        lines.append(freshness_message(latest_recorded_at))

    if environment:
        lines.extend(["", "Ambiente:"])
        lines.extend(environment[:12])

    if soil:
        lines.extend(["", "Suelo:"])
        lines.extend(soil[:12])

    if tank:
        lines.extend(["", "Tanque:"])
        lines.extend(tank[:12])

    if controller:
        lines.extend(["", "Control:"])
        lines.extend(controller[:10])

    if other:
        lines.extend(["", "Otros:"])
        lines.extend(other[:8])

    return "\n".join(lines)


def get_latest_telemetry_payload() -> tuple[dict[str, Any] | None, str | None]:
    device_id = GREENHOUSE_DEVICE_ID.strip()
    result = (
        supabase.table("greenhouse_telemetry")
        .select("device_id,recorded_at,raw_payload")
        .eq("device_id", device_id)
        .order("recorded_at", desc=True)
        .limit(1)
        .execute()
    )

    rows = result.data or []
    if not rows:
        fallback_result = (
            supabase.table("greenhouse_telemetry")
            .select("device_id,recorded_at,raw_payload")
            .order("recorded_at", desc=True)
            .limit(1)
            .execute()
        )
        rows = fallback_result.data or []

    if not rows:
        return None, None

    payload = rows[0].get("raw_payload")
    recorded_at = rows[0].get("recorded_at")

    if isinstance(payload, str):
        payload = json.loads(payload)

    if not isinstance(payload, dict):
        return None, recorded_at

    return payload, recorded_at


def get_supabase_diagnostics() -> str:
    device_id = GREENHOUSE_DEVICE_ID.strip()
    lines = [
        "Diagnostico de Supabase:",
        f"- Device ID configurado: {device_id}",
    ]

    try:
        filtered_result = (
            supabase.table("greenhouse_telemetry")
            .select("id,device_id,recorded_at")
            .eq("device_id", device_id)
            .order("recorded_at", desc=True)
            .limit(3)
            .execute()
        )
        filtered_rows = filtered_result.data or []
        lines.append(f"- Telemetrias visibles para ese device_id: {len(filtered_rows)}")

        for row in filtered_rows:
            lines.append(
                f"  - id {row.get('id')} | {row.get('device_id')} | {row.get('recorded_at')}"
            )
    except Exception as exc:
        lines.append(f"- Error leyendo telemetria filtrada: {exc}")

    try:
        latest_result = (
            supabase.table("greenhouse_telemetry")
            .select("id,device_id,recorded_at")
            .order("recorded_at", desc=True)
            .limit(3)
            .execute()
        )
        latest_rows = latest_result.data or []
        lines.append(f"- Ultimas telemetrias visibles sin filtrar: {len(latest_rows)}")

        for row in latest_rows:
            lines.append(
                f"  - id {row.get('id')} | {row.get('device_id')} | {row.get('recorded_at')}"
            )
    except Exception as exc:
        lines.append(f"- Error leyendo telemetria sin filtrar: {exc}")

    try:
        readings_result = (
            supabase.table("greenhouse_sensor_readings")
            .select("id,device_id,recorded_at")
            .eq("device_id", device_id)
            .order("recorded_at", desc=True)
            .limit(3)
            .execute()
        )
        readings_rows = readings_result.data or []
        lines.append(f"- Sensor readings visibles para ese device_id: {len(readings_rows)}")
    except Exception as exc:
        lines.append(f"- Error leyendo sensor readings: {exc}")

    if "0" in lines[-1:] and not any("id " in line for line in lines):
        lines.append("")
        lines.append("Si todo aparece en 0, casi seguro es RLS o una anon key de otro proyecto.")

    return "\n".join(lines)


def state_to_spanish(state: Any) -> str:
    if state == "closed":
        return "cerrado"
    if state == "open":
        return "abierto"
    return str(state or "sin dato")


def get_status_from_raw_payload() -> str:
    payload, recorded_at = get_latest_telemetry_payload()

    if not payload:
        return "No encontre telemetria del invernadero en Supabase."

    lines = ["Estado actual del invernadero:"]

    if recorded_at:
        lines.append(f"Ultima telemetria: {recorded_at}")
        lines.append(freshness_message(recorded_at))

    status = payload.get("status") or {}
    if status:
        lines.extend(["", "Control:"])
        lines.append(f"- Bomba: {'encendida' if status.get('pump_on') else 'apagada'}")
        lines.append(f"- Luz: {'encendida' if status.get('light_on') else 'apagada'}")
        lines.append(f"- Stream: {'activo' if status.get('stream') else 'inactivo'}")

        if status.get("pump_remaining_ms") is not None:
            lines.append(f"- Tiempo restante bomba: {status.get('pump_remaining_ms')} ms")

    dht_sensors = payload.get("dht_sensors") or []
    connected_dht = [
        sensor
        for sensor in dht_sensors
        if sensor.get("ok") is not False
        and (sensor.get("temp_c") is not None or sensor.get("hum_pct") is not None)
    ]

    if connected_dht:
        lines.extend(["", "Ambiente:"])
        for sensor in connected_dht:
            label = sensor.get("label") or sensor.get("id") or "DHT"
            temp = sensor.get("temp_c")
            hum = sensor.get("hum_pct")
            values = []
            if temp is not None:
                values.append(f"{temp} C")
            if hum is not None:
                values.append(f"{hum}% humedad")
            lines.append(f"- {label}: {' / '.join(values)}")

    soil_sensors = payload.get("soil_sensors") or []
    connected_soil = [
        sensor
        for sensor in soil_sensors
        if sensor.get("raw") is not None and sensor.get("moisture_pct") != 100
    ]

    if connected_soil:
        lines.extend(["", "Suelo:"])
        for sensor in connected_soil:
            label = sensor.get("label") or sensor.get("id") or "Suelo"
            moisture = sensor.get("moisture_pct")
            raw = sensor.get("raw")
            lines.append(f"- {label}: {moisture}% humedad, raw {raw}")

    floats = payload.get("float_switches") or {}
    if floats:
        lines.extend(["", "Tanque:"])
        labels = {
            "low": "Flotador bajo",
            "mid": "Flotador medio",
            "high": "Flotador alto",
        }

        for key in ("high", "mid", "low"):
            sensor = floats.get(key)
            if not sensor:
                continue

            state = state_to_spanish(sensor.get("state"))
            raw = sensor.get("raw")
            lines.append(f"- {labels.get(key, key)}: {state}, raw {raw}")

        low_closed = (floats.get("low") or {}).get("state") == "closed"
        mid_closed = (floats.get("mid") or {}).get("state") == "closed"
        high_closed = (floats.get("high") or {}).get("state") == "closed"

        if high_closed:
            level = "alto"
        elif mid_closed:
            level = "medio"
        elif low_closed:
            level = "bajo"
        else:
            level = "sin nivel detectado"

        lines.append(f"- Nivel estimado: {level}")

    if not connected_dht and not connected_soil and not floats:
        lines.extend(["", "No encontre sensores conectados dentro del payload."])

    return "\n".join(lines)


def get_greenhouse_status() -> str:
    rows = get_latest_sensor_rows()

    if rows:
        return summarize_rows(rows)

    return get_status_from_raw_payload()


def get_latest_data_recorded_at() -> str | None:
    rows = get_latest_sensor_rows(limit=1)
    if rows:
        return rows[0].get("recorded_at")

    _, recorded_at = get_latest_telemetry_payload()
    return recorded_at


def command_token_required() -> str:
    token = GREENHOUSE_BOT_COMMAND_TOKEN.strip()
    if not token:
        raise RuntimeError("Falta GREENHOUSE_BOT_COMMAND_TOKEN en el .env del bot.")

    return token


def list_greenhouse_commands(limit: int = 8) -> list[dict[str, Any]]:
    result = supabase.rpc(
        "bot_list_greenhouse_commands",
        {
            "input_device_id": GREENHOUSE_DEVICE_ID.strip(),
            "input_bot_token": command_token_required(),
            "input_limit": limit,
        },
    ).execute()

    data = result.data or {}
    return data.get("commands") or []


def create_greenhouse_command(
    command_text: str,
    command_type: str,
    payload: dict[str, Any],
    reason: str,
    dedupe_key: str | None = None,
) -> dict[str, Any]:
    result = supabase.rpc(
        "bot_create_greenhouse_command",
        {
            "input_device_id": GREENHOUSE_DEVICE_ID.strip(),
            "input_bot_token": command_token_required(),
            "input_command_text": command_text,
            "input_command_type": command_type,
            "input_payload": payload,
            "input_reason": reason,
            "input_dedupe_key": dedupe_key,
        },
    ).execute()

    return result.data or {}


def ensure_fresh_telemetry_for_action() -> str:
    recorded_at = get_latest_data_recorded_at()
    if is_stale_recorded_at(recorded_at):
        raise RuntimeError(
            "No puedo crear comandos operativos porque la telemetria no es reciente. "
            f"{freshness_message(recorded_at)}"
        )

    return recorded_at or ""


def get_latest_float_states() -> dict[str, str]:
    payload, _ = get_latest_telemetry_payload()
    floats = (payload or {}).get("float_switches") or {}
    return {
        "low": (floats.get("low") or {}).get("state") or "",
        "mid": (floats.get("mid") or {}).get("state") or "",
        "high": (floats.get("high") or {}).get("state") or "",
    }


def ensure_tank_safe_for_irrigation() -> None:
    states = get_latest_float_states()

    if not any(states.values()):
        raise RuntimeError("No puedo validar el tanque porque no hay lecturas de flotadores.")

    # In the current payload, closed means the float is physically reached by water.
    if states.get("low") != "closed" and states.get("mid") != "closed" and states.get("high") != "closed":
        raise RuntimeError("No puedo regar: no hay nivel de agua detectado en el tanque.")

    if states.get("low") == "open" and states.get("mid") == "open" and states.get("high") == "open":
        raise RuntimeError("No puedo regar: los tres flotadores aparecen abiertos, posible tanque vacio.")


def format_command(command: dict[str, Any]) -> str:
    command_id = command.get("id")
    text = command.get("command_text") or "sin comando"
    status = command.get("status") or "sin estado"
    created_at = command.get("created_at") or "sin fecha"
    return f"- #{command_id} {text} | {status} | {created_at}"


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await reply_text_and_voice(
        update,
        "Hola. Soy Meister Greenhouse AI, la IA local del invernadero FHF. Usa /ayuda para ver comandos."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await reply_text_and_voice(
        update,
        "\n".join(
            [
                "Comandos disponibles:",
                "/estado - Ver lecturas del invernadero",
                "/analizar - Analizar datos recientes con IA local",
                "/diagnostico - Revisar conexion con Supabase",
                "/comandos - Ver comandos recientes enviados al Arduino",
                "/voces - Ver y cambiar la voz del bot. Ejemplo: /voces sofia",
                f"/regar SEGUNDOS - Crear riego seguro. Maximo {MAX_IRRIGATION_SECONDS}s",
                "/bomba_off - Crear comando para apagar bomba",
                "/luz_on - Crear comando para encender luz",
                "/luz_off - Crear comando para apagar luz",
            ]
        )
    )


async def status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        message = get_greenhouse_status()
    except Exception as exc:
        message = f"No pude leer Supabase. Error: {exc}"

    await reply_text_and_voice(update, message)


async def analyze(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.chat.send_action(action="typing")

    try:
        recorded_at = get_latest_data_recorded_at()
        if is_stale_recorded_at(recorded_at):
            message = (
                "No voy a analizar el estado actual porque la telemetria no es reciente.\n"
                f"{freshness_message(recorded_at)}\n\n"
                "Primero confirma que el Arduino/ESP32 este enviando datos nuevos a Supabase."
            )
            await reply_text_and_voice(update, message)
            return

        greenhouse_context = get_greenhouse_status()
        answer = ask_ollama(
            "Analiza el estado actual del invernadero y dime si ves algun riesgo o recomendacion. No ejecutes comandos.",
            greenhouse_context,
        )
    except Exception as exc:
        answer = f"No pude analizar el invernadero. Error: {exc}"

    await reply_text_and_voice(update, answer)


async def diagnostics(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        message = get_supabase_diagnostics()
    except Exception as exc:
        message = f"No pude ejecutar diagnostico. Error: {exc}"

    await reply_text_and_voice(update, message)


async def commands(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        items = list_greenhouse_commands(limit=8)
        if not items:
            message = "No hay comandos recientes para este invernadero."
        else:
            message = "Comandos recientes:\n" + "\n".join(format_command(item) for item in items)
    except Exception as exc:
        message = f"No pude leer comandos. Error: {exc}"

    await reply_text_and_voice(update, message)


async def voices(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        if GREENHOUSE_BOT_VOICE_ENGINE != "piper":
            await update.message.reply_text(
                "El motor de voz actual no es Piper. /voces solo cambia voces Piper configuradas.",
            )
            return

        if not context.args:
            selected, config = get_voice_config()
            await update.message.reply_text(format_voice_list())
            sent = await reply_voice_sample(
                update,
                f"Esta es una muestra de la voz activa {config['display_name']} para Meister Greenhouse.",
                selected,
            )
            if not sent and GREENHOUSE_BOT_VOICE_ENABLED:
                await update.message.reply_text("No pude enviar la muestra de voz. Revisa Piper y ffmpeg en el servidor.")
            return

        requested = normalize_voice_name(context.args[0])
        if requested in ("actual", "activa"):
            selected, config = get_voice_config()
            await update.message.reply_text(
                (
                    f"Voz activa: {config['display_name']} (/voces {selected}). "
                    f"{config['description']}"
                ),
            )
            sent = await reply_voice_sample(
                update,
                f"Esta es una muestra de la voz activa {config['display_name']} para Meister Greenhouse.",
                selected,
            )
            if not sent and GREENHOUSE_BOT_VOICE_ENABLED:
                await update.message.reply_text("No pude enviar la muestra de voz. Revisa Piper y ffmpeg en el servidor.")
            return

        if requested not in PIPER_VOICES:
            await update.message.reply_text(
                f"No conozco la voz '{context.args[0]}'.\n\n{format_voice_list()}",
            )
            return

        _, config = get_voice_config(requested)
        model_path = Path(config["model"]).expanduser()
        if not model_path.exists():
            await update.message.reply_text(
                (
                    f"La voz {config['display_name']} existe en la lista, pero falta el modelo:\n"
                    f"{model_path}"
                ),
            )
            return

        write_selected_voice_name(requested)
        await update.message.reply_text(
            (
                f"Voz activa cambiada a {config['display_name']} (/voces {requested}). "
                f"{config['description']}"
            ),
        )
        sent = await reply_voice_sample(
            update,
            f"Voz cambiada a {config['display_name']}. Esta es la muestra para Meister Greenhouse.",
            requested,
        )
        if not sent and GREENHOUSE_BOT_VOICE_ENABLED:
            await update.message.reply_text("La voz quedo seleccionada, pero no pude enviar la muestra. Revisa Piper y ffmpeg.")
    except Exception as exc:
        await update.message.reply_text(f"No pude cambiar la voz. Error: {exc}")


async def irrigate(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        if not context.args:
            await reply_text_and_voice(
                update,
                f"Uso: /regar SEGUNDOS. Ejemplo: /regar 30. Maximo: {MAX_IRRIGATION_SECONDS}s.",
            )
            return

        seconds = int(context.args[0])
        if seconds <= 0 or seconds > MAX_IRRIGATION_SECONDS:
            await reply_text_and_voice(
                update,
                f"La duracion debe estar entre 1 y {MAX_IRRIGATION_SECONDS} segundos.",
            )
            return

        ensure_fresh_telemetry_for_action()
        ensure_tank_safe_for_irrigation()

        duration_ms = seconds * 1000
        response = create_greenhouse_command(
            command_text=f"SET_PUMP {seconds}",
            command_type="irrigation",
            payload={
                "action": "pump_on",
                "duration_ms": duration_ms,
                "duration_sec": seconds,
            },
            reason=f"Riego manual solicitado por Telegram durante {seconds} segundos.",
            dedupe_key=None,
        )

        command = response.get("command") or {}
        duplicate = response.get("duplicate") is True
        prefix = "Comando ya existia" if duplicate else "Comando creado"
        message = f"{prefix}: #{command.get('id')} SET_PUMP {seconds} ({command.get('status')})."
    except Exception as exc:
        message = f"No pude crear el comando de riego. Error: {exc}"

    await reply_text_and_voice(update, message)


async def pump_off(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        response = create_greenhouse_command(
            command_text="PUMP_OFF",
            command_type="irrigation",
            payload={"action": "pump_off"},
            reason="Apagado manual de bomba solicitado por Telegram.",
            dedupe_key=None,
        )

        command = response.get("command") or {}
        message = f"Comando creado: #{command.get('id')} PUMP_OFF ({command.get('status')})."
    except Exception as exc:
        message = f"No pude crear el comando para apagar la bomba. Error: {exc}"

    await reply_text_and_voice(update, message)


async def light_on(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        ensure_fresh_telemetry_for_action()
        response = create_greenhouse_command(
            command_text="LIGHT_ON",
            command_type="lighting",
            payload={"action": "light_on"},
            reason="Encendido manual de luz solicitado por Telegram.",
            dedupe_key=None,
        )

        command = response.get("command") or {}
        message = f"Comando creado: #{command.get('id')} LIGHT_ON ({command.get('status')})."
    except Exception as exc:
        message = f"No pude crear el comando para encender la luz. Error: {exc}"

    await reply_text_and_voice(update, message)


async def light_off(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        response = create_greenhouse_command(
            command_text="LIGHT_OFF",
            command_type="lighting",
            payload={"action": "light_off"},
            reason="Apagado manual de luz solicitado por Telegram.",
            dedupe_key=None,
        )

        command = response.get("command") or {}
        message = f"Comando creado: #{command.get('id')} LIGHT_OFF ({command.get('status')})."
    except Exception as exc:
        message = f"No pude crear el comando para apagar la luz. Error: {exc}"

    await reply_text_and_voice(update, message)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_text = update.message.text.strip()

    if not user_text:
        return

    await update.message.chat.send_action(action="typing")

    try:
        greenhouse_context = get_greenhouse_status()
        recorded_at = get_latest_data_recorded_at()

        if is_stale_recorded_at(recorded_at):
            greenhouse_context = (
                f"{greenhouse_context}\n\n"
                "IMPORTANTE: la telemetria no es reciente. "
                "No presentes estos datos como estado actual y no recomiendes acciones operativas."
            )

        answer = ask_ollama(user_text, greenhouse_context)
    except Exception as exc:
        answer = f"No pude consultar la IA local. Error: {exc}"

    await reply_text_and_voice(update, answer)


def main() -> None:
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("ayuda", help_command))
    app.add_handler(CommandHandler("estado", status))
    app.add_handler(CommandHandler("analizar", analyze))
    app.add_handler(CommandHandler("diagnostico", diagnostics))
    app.add_handler(CommandHandler("comandos", commands))
    app.add_handler(CommandHandler("voces", voices))
    app.add_handler(CommandHandler("regar", irrigate))
    app.add_handler(CommandHandler("bomba_off", pump_off))
    app.add_handler(CommandHandler("luz_on", light_on))
    app.add_handler(CommandHandler("luz_off", light_off))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("Bot del invernadero iniciado.")
    app.run_polling()


if __name__ == "__main__":
    main()
