#!/usr/bin/env bash
set -euo pipefail

VOICE_DIR="${PIPER_VOICE_DIR:-$HOME/piper-voices}"
PIPER_VENV="${PIPER_VENV:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.venv-piper}"

mkdir -p "$VOICE_DIR"

python3 -m venv "$PIPER_VENV"
"$PIPER_VENV/bin/python" -m pip install --upgrade pip
"$PIPER_VENV/bin/python" -m pip install --upgrade piper-tts

download_voice() {
  local model_name="$1"
  local base_url="$2"

  curl --fail --location \
    "$base_url/$model_name.onnx" \
    --output "$VOICE_DIR/$model_name.onnx"

  curl --fail --location \
    "$base_url/$model_name.onnx.json" \
    --output "$VOICE_DIR/$model_name.onnx.json"
}

download_voice \
  "es_ES-mls_9972-low" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_9972/low"

download_voice \
  "es_ES-davefx-medium" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium"

cat <<EOF
Voces espanolas instaladas.

Agrega o verifica estas variables en tu .env real:

GREENHOUSE_BOT_VOICE_ENABLED=true
GREENHOUSE_BOT_VOICE_ENGINE=piper
PIPER_BIN=$PIPER_VENV/bin/piper
PIPER_VOICE_MODEL=$VOICE_DIR/es_ES-mls_9972-low.onnx
FFMPEG_BIN=ffmpeg
EOF
