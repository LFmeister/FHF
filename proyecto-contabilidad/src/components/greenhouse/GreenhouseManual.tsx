'use client'

import type { ReactNode } from 'react'
import {
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  Gauge,
  GitBranch,
  HardDriveUpload,
  KeyRound,
  Lock,
  RadioTower,
  ShieldCheck,
  Smartphone,
  TerminalSquare,
  Wrench,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

const systemSteps = [
  'El ESP32 lee sensores de ambiente, humedad de suelo y flotadores del tanque.',
  'Cada lectura viaja por WiFi a Supabase como telemetria historica.',
  'La pagina del proyecto consulta Supabase y presenta el estado operativo.',
  'Telegram o la pagina crean comandos; el ESP32 los toma, ejecuta y confirma.',
]

const operatorChecks = [
  'Confirma que el ultimo reporte sea reciente antes de tomar decisiones.',
  'Mira el nivel del tanque antes de riego o llenado.',
  'Si la bomba aparece bloqueada por seguridad, revisa fisicamente el sistema antes de rearmar.',
  'Usa comandos manuales solo cuando entiendas que accion ejecutara el equipo.',
]

const developerFiles = [
  {
    path: 'src/components/greenhouse/GreenhouseTab.tsx',
    detail: 'Dashboard visual, integracion por codigo, sensores, actuadores y este manual.',
  },
  {
    path: 'src/lib/greenhouse.ts',
    detail: 'Lectura de Supabase, modo demo, mapeo de telemetria y comandos recientes.',
  },
  {
    path: 'supabase/greenhouse_*.sql',
    detail: 'Tablas, politicas RLS, RPCs de comandos, integracion por codigo y telemetria.',
  },
  {
    path: 'agents/meister_greenhouse_bot.py',
    detail: 'Bot local de Telegram, resumen, comandos operativos y validaciones de seguridad.',
  },
  {
    path: 'arduinoV1/arduino/esp32_greenhouse_supabase',
    detail: 'Firmware ESP32: sensores, reles, Supabase, comandos, seguridad y OTA.',
  },
]

const payloadFields = [
  ['status.pump_on', 'Estado real del rele de bomba.'],
  ['status.pump_remaining_ms', 'Tiempo restante antes del apagado automatico.'],
  ['status.pump_safety_lock', 'Bloqueo activo despues de una parada de seguridad.'],
  ['float_switches.low/mid/high', 'Estado raw/open/closed de cada flotador.'],
  ['dht_sensors[]', 'Temperatura y humedad por sensor DHT.'],
  ['soil_sensors[]', 'Lectura raw y porcentaje estimado de humedad de suelo.'],
  ['esp32.firmware_version', 'Version instalada, usada por el sistema OTA.'],
]

const commandLifecycle = [
  ['pending', 'La orden fue creada en Supabase y espera al ESP32.'],
  ['dispatched', 'El ESP32 la tomo para ejecutar.'],
  ['completed', 'El ESP32 confirmo ejecucion correcta.'],
  ['failed', 'El firmware rechazo o no pudo ejecutar la orden.'],
]

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  )
}

function ManualSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary-700 ring-1 ring-slate-200">
          {icon}
        </span>
        <h4 className="text-base font-bold text-slate-900">{title}</h4>
      </div>
      {children}
    </section>
  )
}

function DiagramNode({
  x,
  y,
  label,
  sublabel,
  tone = 'slate',
}: {
  x: number
  y: number
  label: string
  sublabel: string
  tone?: 'emerald' | 'sky' | 'amber' | 'slate'
}) {
  const fill = {
    emerald: '#ecfdf5',
    sky: '#f0f9ff',
    amber: '#fffbeb',
    slate: '#f8fafc',
  }[tone]
  const stroke = {
    emerald: '#34d399',
    sky: '#38bdf8',
    amber: '#f59e0b',
    slate: '#cbd5e1',
  }[tone]

  return (
    <g>
      <rect x={x} y={y} width="150" height="76" rx="16" fill={fill} stroke={stroke} strokeWidth="2" />
      <text x={x + 75} y={y + 32} textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
        {label}
      </text>
      <text x={x + 75} y={y + 52} textAnchor="middle" className="fill-slate-500 text-[10px]">
        {sublabel}
      </text>
    </g>
  )
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#64748b"
      strokeWidth="2"
      strokeLinecap="round"
      markerEnd="url(#arrow)"
    />
  )
}

function ArchitectureDiagram() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <svg viewBox="0 0 760 250" role="img" aria-label="Diagrama de arquitectura del sistema de invernadero" className="h-auto w-full">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
          </marker>
        </defs>
        <DiagramNode x={30} y={40} label="Sensores" sublabel="DHT, suelo, flotadores" tone="emerald" />
        <DiagramNode x={220} y={40} label="ESP32" sublabel="Lectura y control" tone="sky" />
        <DiagramNode x={410} y={40} label="Supabase" sublabel="Datos y cola" tone="amber" />
        <DiagramNode x={600} y={40} label="Dashboard" sublabel="Pagina FHF" tone="slate" />
        <DiagramNode x={220} y={150} label="Actuadores" sublabel="Bomba y luz" tone="emerald" />
        <DiagramNode x={410} y={150} label="Telegram AI" sublabel="Operador remoto" tone="sky" />
        <Arrow x1={180} y1={78} x2={220} y2={78} />
        <Arrow x1={370} y1={78} x2={410} y2={78} />
        <Arrow x1={560} y1={78} x2={600} y2={78} />
        <Arrow x1={295} y1={116} x2={295} y2={150} />
        <Arrow x1={485} y1={150} x2={485} y2={116} />
        <path d="M600 178 C560 214 460 214 410 188" fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
      </svg>
    </div>
  )
}

function DataFlowDiagram() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <svg viewBox="0 0 760 210" role="img" aria-label="Diagrama del ciclo de telemetria y comandos" className="h-auto w-full">
        <defs>
          <marker id="arrow-flow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#0f766e" />
          </marker>
        </defs>
        <path d="M110 78 H650" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" markerEnd="url(#arrow-flow)" />
        <path d="M650 145 H110" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" markerEnd="url(#arrow-flow)" />
        {['leer', 'guardar', 'mostrar', 'ordenar'].map((label, index) => (
          <g key={label}>
            <circle cx={110 + index * 180} cy="78" r="28" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="2" />
            <text x={110 + index * 180} y="83" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
              {label}
            </text>
          </g>
        ))}
        {['pendiente', 'tomada', 'ejecutada', 'ack'].map((label, index) => (
          <g key={label}>
            <rect x={82 + index * 180} y="122" width="58" height="46" rx="12" fill="#f8fafc" stroke="#cbd5e1" />
            <text x={111 + index * 180} y="150" textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">
              {label}
            </text>
          </g>
        ))}
        <text x="380" y="28" textAnchor="middle" className="fill-slate-900 text-[15px] font-bold">
          Telemetria sube, comandos bajan
        </text>
        <text x="380" y="195" textAnchor="middle" className="fill-slate-500 text-[12px]">
          Cada comando deja resultado, mensaje de error y estado final del equipo.
        </text>
      </svg>
    </div>
  )
}

function SafetyDiagram() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <svg viewBox="0 0 760 250" role="img" aria-label="Diagrama de seguridad de la bomba y actualizaciones OTA" className="h-auto w-full">
        <defs>
          <marker id="arrow-safe" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#be123c" />
          </marker>
        </defs>
        <rect x="36" y="38" width="170" height="70" rx="16" fill="#fff1f2" stroke="#fb7185" strokeWidth="2" />
        <text x="121" y="68" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
          Bomba encendida
        </text>
        <text x="121" y="90" textAnchor="middle" className="fill-slate-500 text-[10px]">
          inicia contador
        </text>
        <rect x="294" y="38" width="170" height="70" rx="16" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2" />
        <text x="379" y="68" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
          15 min sin cierre
        </text>
        <text x="379" y="90" textAnchor="middle" className="fill-slate-500 text-[10px]">
          seguridad automatica
        </text>
        <rect x="552" y="38" width="170" height="70" rx="16" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
        <text x="637" y="68" textAnchor="middle" className="fill-slate-900 text-[13px] font-bold">
          Bloqueo activo
        </text>
        <text x="637" y="90" textAnchor="middle" className="fill-slate-500 text-[10px]">
          FILL ON no reenciende
        </text>
        <line x1="206" y1="73" x2="294" y2="73" stroke="#be123c" strokeWidth="2" markerEnd="url(#arrow-safe)" />
        <line x1="464" y1="73" x2="552" y2="73" stroke="#be123c" strokeWidth="2" markerEnd="url(#arrow-safe)" />
        <path d="M637 108 V154 C637 182 594 190 550 190 H214 C170 190 121 178 121 126 V108" fill="none" stroke="#be123c" strokeWidth="2" markerEnd="url(#arrow-safe)" />
        <text x="380" y="184" textAnchor="middle" className="fill-rose-700 text-[12px] font-bold">
          Solo FILL_FORCE_ON rearma despues de revision humana
        </text>
        <rect x="238" y="203" width="284" height="28" rx="14" fill="#f0fdf4" stroke="#22c55e" />
        <text x="380" y="222" textAnchor="middle" className="fill-emerald-800 text-[12px] font-semibold">
          OTA: version + SHA256 + descarga + reinicio controlado
        </text>
      </svg>
    </div>
  )
}

export function GreenhouseManual() {
  return (
    <Card id="manual-invernadero" className="bg-white/90">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Pill>
            <FileText className="mr-2 h-3.5 w-3.5 text-primary-700" />
            Manual operativo
          </Pill>
          <Pill>
            <TerminalSquare className="mr-2 h-3.5 w-3.5 text-slate-600" />
            Guia tecnica
          </Pill>
        </div>
        <CardTitle className="text-slate-900">Manual del sistema de invernadero inteligente</CardTitle>
        <CardDescription>
          Guia para operar, mantener y entender internamente el sistema FHF: sensores, Supabase, pagina web, Telegram,
          seguridad de bomba y actualizaciones OTA.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <ManualSection icon={<Gauge className="h-5 w-5" />} title="Vista general para cualquier usuario">
            <p className="text-sm leading-6 text-slate-600">
              El invernadero funciona como un circuito cerrado de observacion y control. El ESP32 toma lecturas del
              ambiente, suelo y tanque; Supabase guarda los datos; la pagina los muestra; y los comandos vuelven al ESP32
              para encender o apagar actuadores.
            </p>
            <div className="mt-4 grid gap-2">
              {systemSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </ManualSection>

          <ArchitectureDiagram />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <ManualSection icon={<Cpu className="h-5 w-5" />} title="Equipo fisico">
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li><b>ESP32:</b> controlador WiFi que lee sensores y maneja reles.</li>
              <li><b>DHT11:</b> temperatura y humedad ambiental.</li>
              <li><b>Sensores de suelo:</b> humedad estimada por lectura analogica.</li>
              <li><b>Flotadores:</b> bajo, medio y alto para saber el nivel del tanque.</li>
              <li><b>Reles:</b> salida electrica para bomba de llenado/riego y luz.</li>
            </ul>
          </ManualSection>

          <ManualSection icon={<Database className="h-5 w-5" />} title="Datos en Supabase">
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li><b>greenhouse_telemetry:</b> historial principal recibido desde el ESP32.</li>
              <li><b>greenhouse_sensor_readings:</b> lecturas normalizadas por sensor.</li>
              <li><b>greenhouse_commands:</b> cola de ordenes y respuestas.</li>
              <li><b>project_greenhouse_integrations:</b> enlace entre proyecto y equipo.</li>
              <li><b>greenhouse_firmware_releases:</b> versiones OTA publicadas.</li>
            </ul>
          </ManualSection>

          <ManualSection icon={<Smartphone className="h-5 w-5" />} title="Interfaces">
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li><b>Pagina FHF:</b> tablero visual para monitoreo y estado historico.</li>
              <li><b>Telegram:</b> bot local para consultar, analizar y crear comandos.</li>
              <li><b>Serial USB:</b> diagnostico directo cuando el equipo esta en mesa.</li>
              <li><b>Supabase UI:</b> auditoria de datos, comandos y releases OTA.</li>
            </ul>
          </ManualSection>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <DataFlowDiagram />
          <ManualSection icon={<RadioTower className="h-5 w-5" />} title="Ciclo de datos y comandos">
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                La telemetria fluye desde el ESP32 hacia Supabase. Los comandos fluyen en sentido contrario: primero se
                crean como pendientes, luego el ESP32 los reclama, ejecuta y confirma con un resultado JSON.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {commandLifecycle.map(([state, detail]) => (
                  <div key={state} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                    <p className="font-mono text-xs font-bold uppercase text-slate-900">{state}</p>
                    <p className="mt-1 text-xs text-slate-600">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </ManualSection>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <ManualSection icon={<ShieldCheck className="h-5 w-5" />} title="Seguridad de bomba y tanque">
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                La bomba nunca debe depender solo de una orden remota. El firmware aplica reglas locales: no activa si el
                tanque esta bajo, se apaga al cumplir el tiempo maximo y bloquea el auto-llenado despues de una parada de
                seguridad.
              </p>
              <div className="grid gap-2">
                {operatorChecks.map((check) => (
                  <div key={check} className="flex gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <b>Regla critica:</b> si la bomba se apaga por timeout de 15 minutos, <code>FILL ON</code> queda bloqueado.
                Solo <code>FILL_FORCE_ON</code> rearma el sistema despues de una revision humana.
              </div>
            </div>
          </ManualSection>

          <SafetyDiagram />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ManualSection icon={<HardDriveUpload className="h-5 w-5" />} title="Actualizaciones OTA por Supabase">
            <ol className="space-y-2 text-sm leading-6 text-slate-600">
              <li>1. Se compila un binario nuevo del firmware ESP32.</li>
              <li>2. El binario se sube al bucket publico <code>greenhouse-firmware</code>.</li>
              <li>3. Se registra version, modelo, URL, tamano y SHA256 en Supabase.</li>
              <li>4. El ESP32 consulta si hay version nueva para su modelo.</li>
              <li>5. Descarga, valida hash, escribe en flash y reinicia.</li>
            </ol>
            <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
              La validacion SHA256 evita instalar archivos incompletos o distintos al binario publicado.
            </p>
          </ManualSection>

          <ManualSection icon={<KeyRound className="h-5 w-5" />} title="Permisos y credenciales">
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li><b>Anon key:</b> lectura controlada desde web y bot mediante RLS.</li>
              <li><b>Service role:</b> solo para tareas de servidor, publicacion OTA y administracion.</li>
              <li><b>Device token:</b> identifica al ESP32 ante RPCs de telemetria y comandos.</li>
              <li><b>Bot token:</b> permite al agente crear comandos sin exponer credenciales de dispositivo.</li>
            </ul>
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800">
              Nunca publiques <code>.env</code>, tokens de Telegram, service role key o device token en GitHub.
            </p>
          </ManualSection>
        </div>

        <ManualSection icon={<TerminalSquare className="h-5 w-5" />} title="Referencia tecnica para programadores">
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div>
              <h5 className="font-semibold text-slate-900">Archivos importantes</h5>
              <div className="mt-3 space-y-2">
                {developerFiles.map((file) => (
                  <div key={file.path} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                    <p className="font-mono text-xs font-bold text-slate-900">{file.path}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{file.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-slate-900">Campos clave del payload</h5>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {payloadFields.map(([field, detail]) => (
                      <tr key={field} className="border-b border-slate-100 last:border-0">
                        <td className="w-[42%] px-3 py-2 font-mono font-semibold text-slate-900">{field}</td>
                        <td className="px-3 py-2 leading-5 text-slate-600">{detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h5 className="mt-5 font-semibold text-slate-900">Comandos reconocidos</h5>
              <div className="mt-3 flex flex-wrap gap-2">
                {['STATUS', 'FILL ON', 'FILL OFF', 'FILL_FORCE_ON', 'PUMP_UNLOCK', 'SET_PUMP <segundos>', 'LIGHT_ON', 'LIGHT_OFF'].map((command) => (
                  <Pill key={command}>{command}</Pill>
                ))}
              </div>
            </div>
          </div>
        </ManualSection>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <Wrench className="h-5 w-5 text-emerald-700" />
            <h4 className="mt-3 font-bold text-emerald-950">Mantenimiento</h4>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Revisa conexiones, humedad en cajas electricas, estado de flotadores y limpieza del tanque antes de confiar
              en operaciones automaticas.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <GitBranch className="h-5 w-5 text-sky-700" />
            <h4 className="mt-3 font-bold text-sky-950">Versionamiento</h4>
            <p className="mt-2 text-sm leading-6 text-sky-900">
              Cada firmware debe aumentar <code>FIRMWARE_VERSION</code>; la pagina reporta la version instalada desde
              telemetria.
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <Lock className="h-5 w-5 text-rose-700" />
            <h4 className="mt-3 font-bold text-rose-950">Fallas esperadas</h4>
            <p className="mt-2 text-sm leading-6 text-rose-900">
              Si la telemetria esta vieja, no tomes decisiones operativas. Si hay bloqueo de bomba, revisa nivel, reles y
              tuberia antes de forzar.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
