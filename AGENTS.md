# FHF Project Instructions

- Work in Spanish when explaining changes to the user.
- This project controls an IoT greenhouse. Safety matters.
- Do not remove or weaken hard safety checks for irrigation, pump, tank, commands, or telemetry freshness.
- Do not commit secrets, tokens, `.env`, Supabase keys, Telegram tokens, or device tokens.
- Prefer local AI and deterministic validation before external API calls.
- For frontend changes, work mainly in `proyecto-contabilidad`.
- For Supabase changes, put SQL scripts in `supabase/`.
- For local AI/Telegram agent changes, work in `agents/`.
- Before suggesting operational commands, check telemetry freshness and tank safety.
- Run relevant checks when possible:
  - `python -m py_compile agents/meister_greenhouse_bot.py`
  - `cd proyecto-contabilidad && npm run build`
