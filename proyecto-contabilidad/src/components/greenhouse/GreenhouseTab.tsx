'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
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

function tankLevelLabel(telemetry: ProjectGreenhouseDashboard['latestTelemetry']) {
  if (!telemetry) return 'Sin dato'
  if (telemetry.tank_low) return 'Bajo'
  if (telemetry.tank_full) return 'Alto'
  if (telemetry.tank_mid) return 'Medio'
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
  if (state) return state
  if (raw !== null && raw !== undefined) return String(raw)
  return 'sin dato'
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
                <div className="text-3xl font-bold text-slate-900">{metricValue(dashboard.latestTelemetry?.temp_c ?? null, ' C')}</div>
                <p className="mt-2 text-sm text-slate-500">
                  Sensor DHT: {dashboard.latestTelemetry?.dht_ok ? 'operativo' : 'sin confirmacion'}
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
                <div className="text-3xl font-bold text-slate-900">{metricValue(dashboard.latestTelemetry?.hum_pct ?? null, ' %')}</div>
                <p className="mt-2 text-sm text-slate-500">Fuente: {dashboard.latestTelemetry?.source || 'sin reporte'}</p>
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
                  {tankLevelLabel(dashboard.latestTelemetry)}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Bajo: {floatSwitchValue(dashboard.latestTelemetry?.float_low_state, dashboard.latestTelemetry?.float_low_raw)}
                  {' · '}
                  Medio: {floatSwitchValue(dashboard.latestTelemetry?.float_mid_state, dashboard.latestTelemetry?.float_mid_raw)}
                  {' · '}
                  Alto: {floatSwitchValue(dashboard.latestTelemetry?.float_high_state, dashboard.latestTelemetry?.float_high_raw)}
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
                          Tanque {tankLevelLabel(item).toLowerCase()}
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
