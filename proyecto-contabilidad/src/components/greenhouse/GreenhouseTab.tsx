'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Clock3,
  Droplets,
  Leaf,
  Link2,
  Power,
  RefreshCcw,
  Sun,
  Thermometer,
  Unplug,
  Waves,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { GreenhouseManual } from '@/components/greenhouse/GreenhouseManual'
import { greenhouseService, type ProjectGreenhouseDashboard } from '@/lib/greenhouse'
import { permissions, type UserRole } from '@/lib/permissions'

interface GreenhouseTabProps {
  projectId: string
  userRole: UserRole
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sin dato'

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDurationMs(value: number | null) {
  if (!value || value <= 0) return '0 s'
  const totalSeconds = Math.floor(value / 1000)
  if (totalSeconds < 60) return `${totalSeconds} s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes} min ${seconds} s`
}

function statusTone(status: string) {
  if (status === 'active' || status === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (status === 'pending' || status === 'dispatched') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (status === 'failed' || status === 'disabled' || status === 'cancelled') return 'bg-rose-100 text-rose-800 border-rose-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function metricValue(value: number | null, suffix: string) {
  if (value === null || value === undefined) return 'Sin dato'
  return `${value}${suffix}`
}

function tankLevelLabel(telemetry: ProjectGreenhouseDashboard['latestTelemetry'], metadata: Record<string, unknown> = {}) {
  if (!telemetry) return 'Sin dato'
  if (getSwitchClosed(telemetry, 'high')) return 'Alto'
  if (getSwitchClosed(telemetry, 'mid')) return 'Medio'
  if (getSwitchClosed(telemetry, 'low')) return 'Bajo'
  if (telemetry.float_state) return telemetry.float_state
  if (
    telemetry.float_low_raw !== null ||
    telemetry.float_mid_raw !== null ||
    telemetry.float_high_raw !== null ||
    telemetry.float_low_state ||
    telemetry.float_mid_state ||
    telemetry.float_high_state
  ) {
    return 'Sin nivel activo'
  }
  return 'Sin dato'
}

function floatSwitchValue(state: string | null | undefined, raw: number | null | undefined) {
  if (state) return translateSwitchState(state)
  if (raw !== null && raw !== undefined) return String(raw)
  return 'sin dato'
}

function translateSwitchState(state: string | null | undefined) {
  const normalized = state?.toLowerCase()
  if (normalized === 'open') return 'abierto'
  if (normalized === 'closed') return 'cerrado'
  return state || 'sin dato'
}

function getNestedRecord(value: Record<string, unknown>, key: string) {
  const nested = value[key]
  return nested && typeof nested === 'object' && !Array.isArray(nested) ? (nested as Record<string, unknown>) : {}
}

function getTankConfig(metadata: Record<string, unknown>) {
  const tank = getNestedRecord(metadata, 'tank_config')
  const sensors = getNestedRecord(tank, 'sensors')

  const readNumber = (value: unknown, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const sensorConfig = (key: string, fallbackLabel: string, fallbackPosition: number) => {
    const config = getNestedRecord(sensors, key)
    return {
      key,
      label: String(config.label || fallbackLabel),
      position: Math.max(0, Math.min(100, readNumber(config.position_percent, fallbackPosition))),
      activeWhen: String(config.active_when || 'closed').toLowerCase(),
    }
  }

  return {
    label: String(tank.label || 'Tanque principal'),
    capacityLiters: tank.capacity_liters === undefined || tank.capacity_liters === null ? null : readNumber(tank.capacity_liters, 0),
    shape: String(tank.shape || 'vertical'),
    sensors: [
      sensorConfig('high', 'Alto', 90),
      sensorConfig('mid', 'Medio', 55),
      sensorConfig('low', 'Bajo', 20),
    ],
  }
}

function getPayloadSwitch(telemetry: ProjectGreenhouseDashboard['latestTelemetry'], key: string) {
  const rawPayload = (telemetry?.raw_payload || {}) as Record<string, unknown>
  const switches = getNestedRecord(rawPayload, 'float_switches')
  return getNestedRecord(switches, key)
}

function getSwitchState(telemetry: ProjectGreenhouseDashboard['latestTelemetry'], key: string) {
  const payloadSwitch = getPayloadSwitch(telemetry, key)
  const stateFromPayload = payloadSwitch.state
  if (stateFromPayload !== undefined && stateFromPayload !== null) return String(stateFromPayload)

  if (key === 'high') return telemetry?.float_high_state ?? null
  if (key === 'mid') return telemetry?.float_mid_state ?? null
  return telemetry?.float_low_state ?? null
}

function getSwitchClosed(telemetry: ProjectGreenhouseDashboard['latestTelemetry'], key: string) {
  return getSwitchState(telemetry, key)?.toLowerCase() === 'closed'
}

function getSwitchRaw(telemetry: ProjectGreenhouseDashboard['latestTelemetry'], key: string) {
  const payloadSwitch = getPayloadSwitch(telemetry, key)
  const rawFromPayload = payloadSwitch.raw
  if (rawFromPayload !== undefined && rawFromPayload !== null) return Number(rawFromPayload)

  if (key === 'high') return telemetry?.float_high_raw ?? null
  if (key === 'mid') return telemetry?.float_mid_raw ?? null
  return telemetry?.float_low_raw ?? null
}

function hasSwitchReading(telemetry: ProjectGreenhouseDashboard['latestTelemetry'], key: string) {
  return getSwitchState(telemetry, key) !== null || getSwitchRaw(telemetry, key) !== null
}

function getSwitchActive(
  telemetry: ProjectGreenhouseDashboard['latestTelemetry'],
  metadata: Record<string, unknown>,
  key: string
) {
  if (!telemetry) return null
  const payloadSwitch = getPayloadSwitch(telemetry, key)
  if (typeof payloadSwitch.active === 'boolean') return payloadSwitch.active
  if (key === 'low' && typeof payloadSwitch.tank_low === 'boolean') return payloadSwitch.tank_low

  const config = getTankConfig(metadata).sensors.find((sensor) => sensor.key === key)
  const state = getSwitchState(telemetry, key)?.toLowerCase()
  if (state && config?.activeWhen) return state === config.activeWhen

  if (key === 'high') return telemetry.tank_full
  if (key === 'mid') return telemetry.tank_mid
  return telemetry.tank_low
}

function getTankFillPercent(telemetry: ProjectGreenhouseDashboard['latestTelemetry'], metadata: Record<string, unknown>) {
  if (!telemetry) return 0
  const config = getTankConfig(metadata)
  const high = config.sensors.find((sensor) => sensor.key === 'high')?.position ?? 90
  const mid = config.sensors.find((sensor) => sensor.key === 'mid')?.position ?? 55
  const low = config.sensors.find((sensor) => sensor.key === 'low')?.position ?? 20

  if (getSwitchClosed(telemetry, 'high')) return Math.min(100, high + 5)
  if (getSwitchClosed(telemetry, 'mid')) return mid
  if (getSwitchClosed(telemetry, 'low')) return Math.max(18, low)
  if (
    telemetry.float_low_raw !== null ||
    telemetry.float_mid_raw !== null ||
    telemetry.float_high_raw !== null ||
    telemetry.float_low_state ||
    telemetry.float_mid_state ||
    telemetry.float_high_state
  ) {
    return Math.max(0, low - 14)
  }

  return 0
}

function tankLevelTone(telemetry: ProjectGreenhouseDashboard['latestTelemetry'], metadata: Record<string, unknown>) {
  if (getSwitchClosed(telemetry, 'low') && !getSwitchClosed(telemetry, 'mid') && !getSwitchClosed(telemetry, 'high')) {
    return {
      water: 'from-rose-600 via-orange-400 to-amber-200',
      border: 'border-rose-300',
      badge: 'bg-rose-100 text-rose-800',
      text: 'text-rose-700',
      rail: 'bg-rose-500',
    }
  }

  if (getSwitchClosed(telemetry, 'high')) {
    return {
      water: 'from-cyan-500 via-sky-400 to-blue-300',
      border: 'border-sky-300',
      badge: 'bg-sky-100 text-sky-800',
      text: 'text-sky-700',
      rail: 'bg-sky-500',
    }
  }

  if (getSwitchClosed(telemetry, 'mid')) {
    return {
      water: 'from-emerald-500 via-teal-400 to-cyan-300',
      border: 'border-emerald-300',
      badge: 'bg-emerald-100 text-emerald-800',
      text: 'text-emerald-700',
      rail: 'bg-emerald-500',
    }
  }

  return {
    water: 'from-slate-500 via-slate-400 to-slate-200',
    border: 'border-slate-300',
    badge: 'bg-slate-100 text-slate-700',
    text: 'text-slate-700',
    rail: 'bg-slate-400',
  }
}

function tankSwitchStateClass(key: string, telemetry: ProjectGreenhouseDashboard['latestTelemetry']) {
  const state = getSwitchState(telemetry, key)?.toLowerCase()
  if (!state) return 'border-slate-200 bg-slate-100 text-slate-500'
  if (state === 'open') return 'border-amber-300 bg-amber-100 text-amber-800'

  if (key === 'low' && !getSwitchClosed(telemetry, 'mid') && !getSwitchClosed(telemetry, 'high')) {
    return 'border-rose-300 bg-rose-100 text-rose-800'
  }

  if (key === 'high') return 'border-sky-300 bg-sky-100 text-sky-800'
  return 'border-emerald-300 bg-emerald-100 text-emerald-800'
}

function TankVisual({ dashboard }: { dashboard: ProjectGreenhouseDashboard }) {
  const telemetry = dashboard.latestTelemetry
  const config = getTankConfig(dashboard.metadata)
  const visibleTankSensors = config.sensors.filter((sensor) => hasSwitchReading(telemetry, sensor.key))
  const fillPercent = getTankFillPercent(telemetry, dashboard.metadata)
  const sensorRaw: Record<string, string> = {
    high: floatSwitchValue(getSwitchState(telemetry, 'high'), getSwitchRaw(telemetry, 'high')),
    mid: floatSwitchValue(getSwitchState(telemetry, 'mid'), getSwitchRaw(telemetry, 'mid')),
    low: floatSwitchValue(getSwitchState(telemetry, 'low'), getSwitchRaw(telemetry, 'low')),
  }
  const sensorState: Record<string, string | null> = {
    high: getSwitchState(telemetry, 'high'),
    mid: getSwitchState(telemetry, 'mid'),
    low: getSwitchState(telemetry, 'low'),
  }
  const sensorActive: Record<string, boolean | null> = {
    high: getSwitchActive(telemetry, dashboard.metadata, 'high'),
    mid: getSwitchActive(telemetry, dashboard.metadata, 'mid'),
    low: getSwitchActive(telemetry, dashboard.metadata, 'low'),
  }
  const tone = tankLevelTone(telemetry, dashboard.metadata)
  const levelLabel = tankLevelLabel(telemetry, dashboard.metadata)

  return (
    <Card className="overflow-hidden border-slate-200 bg-white/92">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-cyan-50/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Waves className="h-5 w-5 text-sky-600" />
              {config.label}
            </CardTitle>
            <CardDescription>
              Lectura visual por flotadores
              {config.capacityLiters ? ` - Capacidad ${config.capacityLiters} L` : ''}
            </CardDescription>
          </div>
          <div className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-bold ${tone.badge}`}>
            {levelLabel} - {Math.round(fillPercent)}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-5 shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),transparent_38%),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_100%,28px_28px,28px_28px]" />
            <div className="relative flex h-full min-h-[260px] items-center gap-4">
              <div className="flex h-64 w-10 flex-col justify-between text-right text-[11px] font-semibold text-slate-400">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              <div className={`relative h-64 flex-1 rounded-[1.75rem] border-2 ${tone.border} bg-slate-900/80 shadow-2xl`}>
                <div className="absolute inset-y-4 left-5 w-px bg-white/10" />
                <div className="absolute inset-y-4 right-5 w-px bg-white/10" />
                {[25, 50, 75].map((mark) => (
                  <div key={mark} className="absolute inset-x-5 border-t border-dashed border-white/10" style={{ bottom: `${mark}%` }} />
                ))}
                <div
                  className={`absolute inset-x-4 bottom-4 rounded-b-[1.35rem] rounded-t-lg bg-gradient-to-t ${tone.water} shadow-[0_0_32px_rgba(56,189,248,0.25)] transition-all duration-700`}
                  style={{ height: `calc((100% - 2rem) * ${Math.max(fillPercent, 2) / 100})` }}
                >
                  <div className="absolute inset-x-0 top-0 h-4 rounded-full bg-white/45" />
                  <div className="absolute inset-x-6 top-2 h-px bg-white/55" />
                </div>
                <div className="absolute inset-0 rounded-[1.6rem] bg-[linear-gradient(90deg,rgba(255,255,255,0.26),transparent_18%,transparent_76%,rgba(15,23,42,0.38))]" />
                <div className="absolute left-5 top-5 rounded-xl border border-white/10 bg-white/90 px-3 py-2 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Nivel</p>
                  <p className={`text-2xl font-extrabold ${tone.text}`}>{Math.round(fillPercent)}%</p>
                </div>
                {visibleTankSensors.map((sensor) => (
                  <div key={sensor.key} className="absolute right-5 flex items-center gap-2" style={{ bottom: `calc(${sensor.position}% - 0.375rem)` }}>
                    <span className="hidden rounded bg-slate-950/70 px-2 py-1 text-[11px] font-semibold text-white sm:inline">
                      {sensor.label}
                    </span>
                    <span className={`h-3 w-3 rounded-full border-2 shadow ${tankSwitchStateClass(sensor.key, telemetry)}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {config.sensors.map((sensor) => (
              <div key={sensor.key} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase text-slate-600">{sensor.label}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${sensorActive[sensor.key] ? tone.rail : 'bg-slate-300'}`} />
                </div>
                <div className="h-1.5 rounded-full bg-slate-200">
                  <div
                    className={`h-1.5 rounded-full ${sensorActive[sensor.key] ? tone.rail : 'bg-slate-300'}`}
                    style={{ width: `${sensor.position}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] font-medium text-slate-500">{sensor.position}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Estado estimado</p>
            <p className={`mt-2 text-3xl font-extrabold ${tone.text}`}>{levelLabel}</p>
            <p className="mt-2 text-sm text-slate-600">
              El nivel se calcula con los flotadores activos y sus posiciones configuradas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {visibleTankSensors.map((sensor) => (
              <div key={sensor.key} className={`rounded-2xl border px-4 py-3 ${tankSwitchStateClass(sensor.key, telemetry)}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase">{sensor.label}</p>
                    <p className="mt-1 text-lg font-bold">{translateSwitchState(sensorState[sensor.key])}</p>
                  </div>
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold">
                    {sensor.position}%
                  </span>
                </div>
                <p className="mt-2 text-xs">Lectura: {sensorRaw[sensor.key]}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Configuracion del tanque</p>
            <p className="mt-1">
              Sensores reportados: {visibleTankSensors.length > 0 ? visibleTankSensors.map((sensor) => `${sensor.label} ${sensor.position}%`).join(', ') : 'sin lecturas'}.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function sensorReadingValue(reading: ProjectGreenhouseDashboard['sensorReadings'][number]) {
  if (reading.value_number !== null) {
    return `${reading.value_number}${reading.unit ? ` ${reading.unit}` : ''}`
  }
  if (reading.value_boolean !== null) return reading.value_boolean ? 'Si' : 'No'
  return reading.value_text || 'Sin dato'
}

function sensorMetricBool(
  sensor: { metrics: ProjectGreenhouseDashboard['sensorReadings'] },
  metricNames: string[]
) {
  const reading = sensor.metrics.find((metric) => metricNames.includes(metric.metric))
  return reading?.value_boolean ?? null
}

function sensorMetricNumber(
  sensor: { metrics: ProjectGreenhouseDashboard['sensorReadings'] },
  metricNames: string[]
) {
  const reading = sensor.metrics.find((metric) => metricNames.includes(metric.metric))
  return reading?.value_number ?? null
}

function sensorHasPin(sensor: { metrics: ProjectGreenhouseDashboard['sensorReadings'] }) {
  return sensor.metrics.some((reading) => {
    if (!['pin', 'data_pin', 'analog_pin'].includes(reading.metric)) return false
    return reading.value_number !== null || Boolean(reading.value_text)
  })
}

function sensorHasRaw(sensor: { metrics: ProjectGreenhouseDashboard['sensorReadings'] }) {
  return sensor.metrics.some((reading) => reading.metric === 'raw' && reading.value_number !== null)
}

function hasDisplayValue(reading: ProjectGreenhouseDashboard['sensorReadings'][number]) {
  if (['pin', 'data_pin', 'analog_pin'].includes(reading.metric)) return false
  return reading.value_number !== null || reading.value_boolean !== null || Boolean(reading.value_text)
}

function sensorHasAnyMetric(sensor: { metrics: ProjectGreenhouseDashboard['sensorReadings'] }, metricNames: string[]) {
  return sensor.metrics.some((reading) => metricNames.includes(reading.metric) && hasDisplayValue(reading))
}

function sensorIsConnected(sensor: { kind: string; metrics: ProjectGreenhouseDashboard['sensorReadings'] }) {
  const kind = sensor.kind.toLowerCase()
  const connected = sensorMetricBool(sensor, ['connected'])
  if (connected === false) return false

  const ok = sensorMetricBool(sensor, ['ok', 'dht_ok'])
  if (kind.includes('controller')) {
    return sensor.metrics.some(hasDisplayValue)
  }

  if (kind.includes('float')) {
    return sensorHasAnyMetric(sensor, ['state', 'raw', 'tank_low', 'active'])
  }

  if (kind.includes('environment') || kind.includes('dht')) {
    if (ok === false) return false
    return sensorHasPin(sensor) && sensorHasAnyMetric(sensor, ['temp_c', 'temperature_c', 'temperature', 'hum_pct', 'humidity_pct', 'humidity'])
  }

  if (kind.includes('soil')) {
    if (ok === false) return false
    if (!sensorHasPin(sensor) || !sensorHasRaw(sensor)) return false

    const raw = sensorMetricNumber(sensor, ['raw'])
    const moisture = sensorMetricNumber(sensor, ['moisture_pct'])
    if (raw === null || moisture === null || moisture === 100) return false

    return true
  }

  if (!sensorHasPin(sensor)) {
    return false
  }

  return sensor.metrics.some(hasDisplayValue)
}

function latestSensorGroups(readings: ProjectGreenhouseDashboard['sensorReadings']) {
  const groups = new Map<
    string,
    {
      key: string
      label: string
      kind: string
      recordedAt: string
      metrics: ProjectGreenhouseDashboard['sensorReadings']
    }
  >()

  readings.forEach((reading) => {
    const existing = groups.get(reading.sensor_key)
    if (!existing) {
      groups.set(reading.sensor_key, {
        key: reading.sensor_key,
        label: reading.sensor_label || reading.sensor_key,
        kind: reading.sensor_kind,
        recordedAt: reading.recorded_at,
        metrics: [reading],
      })
      return
    }

    if (!existing.metrics.some((metric) => metric.metric === reading.metric)) {
      existing.metrics.push(reading)
    }
  })

  return Array.from(groups.values()).filter(sensorIsConnected)
}

function sensorGroupTitle(kind: string) {
  const normalized = kind.toLowerCase()
  if (normalized.includes('soil')) return 'Humedad del suelo'
  if (normalized.includes('environment') || normalized.includes('dht')) return 'Temperatura y humedad ambiente'
  if (normalized.includes('float')) return 'Flotadores del tanque'
  if (normalized.includes('controller')) return 'Controlador'
  return 'Otros sensores'
}

function sensorGroupIcon(kind: string) {
  const normalized = kind.toLowerCase()
  if (normalized.includes('soil')) return <Leaf className="h-5 w-5 text-emerald-600" />
  if (normalized.includes('environment') || normalized.includes('dht')) return <Thermometer className="h-5 w-5 text-rose-500" />
  if (normalized.includes('float')) return <Waves className="h-5 w-5 text-sky-600" />
  return <Activity className="h-5 w-5 text-primary-700" />
}

function groupedSensorCards(readings: ProjectGreenhouseDashboard['sensorReadings']) {
  const groups = latestSensorGroups(readings)
  return groups.reduce<Record<string, ReturnType<typeof latestSensorGroups>>>((acc, sensor) => {
    const title = sensorGroupTitle(sensor.kind)
    acc[title] = acc[title] || []
    acc[title].push(sensor)
    return acc
  }, {})
}

function latestNumericReading(
  readings: ProjectGreenhouseDashboard['sensorReadings'],
  kindIncludes: string[],
  metrics: string[]
) {
  return readings.find((reading) => {
    const kind = reading.sensor_kind.toLowerCase()
    return kindIncludes.some((item) => kind.includes(item)) && metrics.includes(reading.metric) && reading.value_number !== null
  })?.value_number ?? null
}

export function GreenhouseTab({ projectId, userRole }: GreenhouseTabProps) {
  const [dashboard, setDashboard] = useState<ProjectGreenhouseDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pairingCode, setPairingCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { success: showSuccess, error: showError } = useToast()

  const canManageIntegration = permissions.canEdit(userRole)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await greenhouseService.getProjectDashboard(projectId)
      setDashboard(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar el dashboard del invernadero.'
      setError(message)
      setDashboard(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()

    const interval = window.setInterval(() => {
      loadDashboard()
    }, 180000)

    return () => window.clearInterval(interval)
  }, [projectId])

  const handleConnect = async () => {
    try {
      setSaving(true)
      setError(null)
      const data = await greenhouseService.connectProject(projectId, pairingCode)
      setDashboard(data)
      setPairingCode('')
      showSuccess('Invernadero enlazado al proyecto')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo enlazar el invernadero.'
      setError(message)
      showError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Se desconectara el invernadero de este proyecto. Deseas continuar?')) {
      return
    }

    try {
      setSaving(true)
      await greenhouseService.disconnectProject(projectId)
      setDashboard(null)
      showSuccess('Invernadero desconectado')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo desconectar el invernadero.'
      setError(message)
      showError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  const ambientTemp = dashboard
    ? latestNumericReading(dashboard.sensorReadings, ['environment', 'dht'], ['temp_c', 'temperature_c', 'temperature'])
    : null
  const ambientHumidity = dashboard
    ? latestNumericReading(dashboard.sensorReadings, ['environment', 'dht'], ['hum_pct', 'humidity_pct', 'humidity'])
    : null
  const sensorCards = dashboard ? groupedSensorCards(dashboard.sensorReadings) : {}

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-emerald-200/70 bg-gradient-to-br from-slate-900 via-primary-900 to-emerald-900 text-white">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                <Leaf className="h-3.5 w-3.5" />
                Invernadero inteligente
              </span>
              {dashboard && (
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(dashboard.status)}`}>
                  {dashboard.status === 'active' ? 'Operativo' : dashboard.status}
                </span>
              )}
              {dashboard?.isDemo && (
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                  Modo demo
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-2xl text-white">
                {dashboard ? dashboard.deviceName : 'Conecta un invernadero al proyecto'}
              </CardTitle>
              <CardDescription className="mt-1 max-w-2xl text-slate-100/85">
                {dashboard
                  ? 'Monitorea temperatura, humedad, nivel de tanque y actividad de actuadores desde el panel del proyecto.'
                  : 'Pega el codigo del invernadero para activar un dashboard tecnico dentro del proyecto.'}
              </CardDescription>
              <a
                href="#manual-invernadero"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <BookOpen className="h-4 w-4" />
                Ver manual del sistema
              </a>
            </div>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Codigo enlazado</p>
              <p className="mt-2 font-mono text-lg font-bold text-white">
                {dashboard ? dashboard.greenhouseCode : greenhouseService.getDemoGreenhouseCode()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Ultimo reporte</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {dashboard ? formatDateTime(dashboard.lastSeenAt || dashboard.latestTelemetry?.recorded_at || null) : 'Sin enlace'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Ubicacion</p>
              <p className="mt-2 text-sm font-semibold text-white">{dashboard?.location || 'Pendiente de conexion'}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Zona horaria</p>
              <p className="mt-2 text-sm font-semibold text-white">{dashboard?.timezone || 'UTC'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/88 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Link2 className="h-5 w-5 text-primary-700" />
              Integracion por codigo
            </CardTitle>
            <CardDescription>
              Usa el codigo del invernadero productivo para activar el dashboard. El codigo configurado para este bridge es
              {' '}
              <span className="font-mono font-semibold text-primary-800">{greenhouseService.getProductionGreenhouseCode()}</span>.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Codigo del invernadero</label>
              <Input
                value={pairingCode}
                onChange={(event) => setPairingCode(event.target.value.toUpperCase())}
                placeholder={greenhouseService.getProductionGreenhouseCode()}
                className="font-mono uppercase tracking-[0.12em]"
                disabled={!canManageIntegration || saving}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleConnect} disabled={!canManageIntegration || !pairingCode.trim() || saving} loading={saving}>
                <Link2 className="mr-2 h-4 w-4" />
                Enlazar invernadero
              </Button>

              {dashboard && canManageIntegration && (
                <Button variant="outline" onClick={handleDisconnect} disabled={saving}>
                  <Unplug className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
              )}

              {dashboard && (
                <Button variant="ghost" onClick={loadDashboard} disabled={saving}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Actualizar
                </Button>
              )}
            </div>

            {!canManageIntegration && (
              <p className="text-sm text-slate-500">
                Tu rol actual es solo lectura. Pide a un usuario con permisos de edicion que conecte el invernadero.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <GreenhouseManual />

      {dashboard ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-white/88">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Thermometer className="h-4 w-4 text-rose-500" />
                  Temperatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{metricValue(ambientTemp ?? dashboard.latestTelemetry?.temp_c ?? null, ' C')}</div>
                <p className="mt-2 text-sm text-slate-500">
                  Fuente: DHT ambiente
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/88">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Droplets className="h-4 w-4 text-sky-600" />
                  Humedad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{metricValue(ambientHumidity ?? dashboard.latestTelemetry?.hum_pct ?? null, ' %')}</div>
                <p className="mt-2 text-sm text-slate-500">Fuente: DHT ambiente</p>
              </CardContent>
            </Card>

            <Card className="bg-white/88">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Waves className="h-4 w-4 text-emerald-600" />
                  Tanque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {tankLevelLabel(dashboard.latestTelemetry, dashboard.metadata)}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Bajo: {floatSwitchValue(getSwitchState(dashboard.latestTelemetry, 'low'), getSwitchRaw(dashboard.latestTelemetry, 'low'))}
                  {' - '}
                  Medio: {floatSwitchValue(getSwitchState(dashboard.latestTelemetry, 'mid'), getSwitchRaw(dashboard.latestTelemetry, 'mid'))}
                  {' - '}
                  Alto: {floatSwitchValue(getSwitchState(dashboard.latestTelemetry, 'high'), getSwitchRaw(dashboard.latestTelemetry, 'high'))}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/88">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Power className="h-4 w-4 text-amber-500" />
                  Actuadores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Sun className="h-4 w-4 text-amber-500" />
                    Luz
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dashboard.latestTelemetry?.light_on ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                    {dashboard.latestTelemetry?.light_on ? 'Encendida' : 'Apagada'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    Bomba
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dashboard.latestTelemetry?.pump_on ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {dashboard.latestTelemetry?.pump_on ? 'Activa' : 'Detenida'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Tiempo restante: {formatDurationMs(dashboard.latestTelemetry?.pump_remaining_ms ?? null)}
                </p>
              </CardContent>
            </Card>
          </div>

          <TankVisual dashboard={dashboard} />

          {Object.keys(sensorCards).length > 0 && (
            <Card className="bg-white/88">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Activity className="h-5 w-5 text-primary-700" />
                  Sensores conectados
                </CardTitle>
                <CardDescription>Lecturas separadas por ambiente, suelo, tanque y controlador.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {Object.entries(sensorCards).map(([title, sensors]) => (
                  <section key={title} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {sensorGroupIcon(sensors[0]?.kind || '')}
                      <h4 className="font-semibold text-slate-900">{title}</h4>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {sensors.map((sensor) => (
                        <div key={sensor.key} className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{sensor.label}</p>
                              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{sensor.kind}</p>
                            </div>
                            <span className="text-xs text-slate-500">{formatDateTime(sensor.recordedAt)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {sensor.metrics.filter(hasDisplayValue).slice(0, 8).map((reading) => (
                              <span key={`${sensor.key}-${reading.metric}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                {reading.metric}: {sensorReadingValue(reading)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="bg-white/88">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Clock3 className="h-5 w-5 text-primary-700" />
                  Lecturas recientes
                </CardTitle>
                <CardDescription>Actualizacion automatica cada 3 minutos mientras esta abierto el tab.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.telemetryHistory.map((item, index) => (
                  <div key={`${item.recorded_at}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatDateTime(item.recorded_at)}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{item.source}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                          Temp {metricValue(item.temp_c, ' C')}
                        </span>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          Hum {metricValue(item.hum_pct, ' %')}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.tank_low ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          Tanque {tankLevelLabel(item, dashboard.metadata).toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-white/88">
                <CardHeader>
                  <CardTitle className="text-slate-900">Actividad reciente</CardTitle>
                  <CardDescription>Comandos y respuesta del gateway.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.recentCommands.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      No hay comandos registrados todavia.
                    </div>
                  ) : (
                    dashboard.recentCommands.map((command) => (
                      <div key={command.id} className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm font-bold text-slate-900">{command.command_text}</p>
                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{command.command_type}</p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(command.status)}`}>
                            {command.status}
                          </span>
                        </div>
                        {command.reason && <p className="mt-2 text-sm text-slate-600">{command.reason}</p>}
                        <p className="mt-2 text-xs text-slate-500">Creado {formatDateTime(command.created_at)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/88">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    {dashboard.latestTelemetry?.tank_low ? (
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                    ) : (
                      <Leaf className="h-5 w-5 text-emerald-600" />
                    )}
                    Estado operativo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>Streaming activo</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dashboard.latestTelemetry?.stream ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {dashboard.latestTelemetry?.stream ? 'Si' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>Uptime estimado</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {formatDurationMs(dashboard.latestTelemetry?.device_uptime_ms ?? null)}
                    </span>
                  </div>
                  <p>
                    Conexion enlazada el {formatDateTime(dashboard.connectedAt)}. Este panel usa los campos definidos en la telemetria del invernadero.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <Card className="border-dashed border-slate-300 bg-white/85">
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <Leaf className="h-12 w-12 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold text-slate-900">Aun no hay un invernadero conectado</p>
              <p className="mt-1 text-sm text-slate-600">
                Enlaza un codigo para habilitar el dashboard tecnico del proyecto.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
