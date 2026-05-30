import { supabase } from './supabase'

export interface GreenhouseTelemetryPoint {
  device_id?: string | null
  bridge_mac?: string | null
  recorded_at: string
  source: string
  device_uptime_ms: number | null
  dht_ok: boolean | null
  temp_c: number | null
  hum_pct: number | null
  float_raw: number | null
  float_state: string | null
  tank_low: boolean | null
  tank_mid: boolean | null
  tank_full: boolean | null
  tank_low_when: string | null
  float_low_raw: number | null
  float_mid_raw: number | null
  float_high_raw: number | null
  float_low_state: string | null
  float_mid_state: string | null
  float_high_state: string | null
  light_on: boolean | null
  pump_on: boolean | null
  pump_remaining_ms: number | null
  stream: boolean | null
  raw_payload: Record<string, unknown>
}

export interface GreenhouseCommandItem {
  id: number | string
  command_text: string
  command_type: string
  reason: string | null
  created_by: string
  status: string
  created_at: string
  completed_at: string | null
  result_payload: Record<string, unknown>
}

export interface ProjectGreenhouseDashboard {
  greenhouseCode: string
  deviceName: string
  location: string | null
  timezone: string
  status: string
  lastSeenAt: string | null
  connectedAt: string
  isDemo: boolean
  metadata: Record<string, unknown>
  latestTelemetry: GreenhouseTelemetryPoint | null
  telemetryHistory: GreenhouseTelemetryPoint[]
  recentCommands: GreenhouseCommandItem[]
}

interface ProjectGreenhouseIntegrationRow {
  project_id: string
  device_id: string | null
  greenhouse_code: string
  connected_by: string | null
  metadata: Record<string, unknown>
  connected_at: string
  updated_at: string
}

interface DemoGreenhouseDefinition {
  code: string
  deviceName: string
  location: string
  timezone: string
  status: string
  lastSeenOffsetMinutes: number
  telemetryBase: {
    temp_c: number
    hum_pct: number
    float_raw: number
    float_state: string
    tank_low: boolean
    tank_mid?: boolean
    tank_full?: boolean
    tank_low_when: string | null
    light_on: boolean
    pump_on: boolean
    pump_remaining_ms: number
    stream: boolean
  }
  note: string
}

export const DEMO_GREENHOUSE_CODE = 'GH-COL-7429'
export const PRODUCTION_GREENHOUSE_CODE = 'GH-BCFF4D5D7AE5'
export const PRODUCTION_GREENHOUSE_MAC = 'BC:FF:4D:5D:7A:E5'

interface ProductionGreenhouseDefinition {
  code: string
  bridgeMac: string
  deviceName: string
  location: string
  timezone: string
  note: string
}

const PRODUCTION_GREENHOUSES: Record<string, ProductionGreenhouseDefinition> = {
  [PRODUCTION_GREENHOUSE_CODE]: {
    code: PRODUCTION_GREENHOUSE_CODE,
    bridgeMac: PRODUCTION_GREENHOUSE_MAC,
    deviceName: 'Invernadero Inteligente Girardota',
    location: 'Girardota, Antioquia, Colombia',
    timezone: 'America/Bogota',
    note: 'Codigo de enlace productivo asociado al bridge MAC BC:FF:4D:5D:7A:E5.',
  },
}

const DEMO_GREENHOUSES: Record<string, DemoGreenhouseDefinition> = {
  [DEMO_GREENHOUSE_CODE]: {
    code: DEMO_GREENHOUSE_CODE,
    deviceName: 'Invernadero Inteligente Colombia',
    location: 'Girardota, Antioquia, Colombia',
    timezone: 'America/Bogota',
    status: 'active',
    lastSeenOffsetMinutes: 2,
    telemetryBase: {
      temp_c: 28.6,
      hum_pct: 74.2,
      float_raw: 518,
      float_state: 'medio',
      tank_low: false,
      tank_mid: true,
      tank_full: false,
      tank_low_when: null,
      light_on: true,
      pump_on: false,
      pump_remaining_ms: 0,
      stream: true,
    },
    note: 'Codigo de demo para enlazar un invernadero al proyecto y mostrar telemetria simulada.',
  },
}

const TELEMETRY_VARIATIONS = [
  { minutesAgo: 0, temp: 0, hum: 0, floatDelta: 0, lightOn: true, pumpOn: false, pumpRemaining: 0, tankLow: false },
  { minutesAgo: 5, temp: -0.4, hum: 1.6, floatDelta: 8, lightOn: true, pumpOn: false, pumpRemaining: 0, tankLow: false },
  { minutesAgo: 10, temp: -0.8, hum: 2.3, floatDelta: 12, lightOn: true, pumpOn: true, pumpRemaining: 24000, tankLow: false },
  { minutesAgo: 15, temp: -1.1, hum: 3.1, floatDelta: 16, lightOn: false, pumpOn: true, pumpRemaining: 12000, tankLow: false },
  { minutesAgo: 20, temp: -0.6, hum: 2.2, floatDelta: 10, lightOn: false, pumpOn: false, pumpRemaining: 0, tankLow: false },
  { minutesAgo: 25, temp: -0.2, hum: 1.1, floatDelta: 4, lightOn: false, pumpOn: false, pumpRemaining: 0, tankLow: false },
]

const DEMO_COMMANDS = [
  {
    id: 'demo-cmd-1',
    command_text: 'SET_PUMP 30',
    command_type: 'irrigation',
    reason: 'Riego preventivo por humedad descendente',
    created_by: 'ai-worker-au',
    status: 'completed',
    minutesAgo: 18,
    completedAfterMinutes: 1,
    result_payload: { ok: true, ack: 'pump_cycle_complete' },
  },
  {
    id: 'demo-cmd-2',
    command_text: 'LIGHT ON',
    command_type: 'lighting',
    reason: 'Compensar baja radiacion a primera hora',
    created_by: 'ai-worker-au',
    status: 'completed',
    minutesAgo: 74,
    completedAfterMinutes: 2,
    result_payload: { ok: true, ack: 'light_enabled' },
  },
  {
    id: 'demo-cmd-3',
    command_text: 'STATUS PING',
    command_type: 'diagnostic',
    reason: 'Verificacion periodica del gateway',
    created_by: 'system',
    status: 'completed',
    minutesAgo: 4,
    completedAfterMinutes: 0,
    result_payload: { ok: true, gateway: 'online' },
  },
]

function normalizeGreenhouseCode(value: string) {
  return value.trim().toUpperCase()
}

function normalizeBridgeMac(value: string) {
  return value.trim().toUpperCase()
}

function buildIsoMinutesAgo(minutesAgo: number) {
  const date = new Date()
  date.setMinutes(date.getMinutes() - minutesAgo)
  return date.toISOString()
}

function toTelemetryPoint(
  recordedAt: string,
  base: DemoGreenhouseDefinition['telemetryBase'],
  variation: (typeof TELEMETRY_VARIATIONS)[number]
): GreenhouseTelemetryPoint {
  const temp = Number((base.temp_c + variation.temp).toFixed(1))
  const humidity = Number((base.hum_pct + variation.hum).toFixed(1))
  const floatRaw = base.float_raw + variation.floatDelta
  const pumpRemaining = variation.pumpOn ? variation.pumpRemaining : 0

  return {
    recorded_at: recordedAt,
    source: 'arduino-gateway',
    device_uptime_ms: 1000 * 60 * (variation.minutesAgo + 145),
    dht_ok: true,
    temp_c: temp,
    hum_pct: humidity,
    float_raw: floatRaw,
    float_state: variation.tankLow ? 'bajo' : base.float_state,
    tank_low: variation.tankLow || base.tank_low,
    tank_mid: base.tank_mid ?? null,
    tank_full: base.tank_full ?? null,
    tank_low_when: variation.tankLow ? recordedAt : base.tank_low_when,
    float_low_raw: variation.tankLow ? 1 : 0,
    float_mid_raw: base.tank_mid ? 1 : 0,
    float_high_raw: base.tank_full ? 1 : 0,
    float_low_state: variation.tankLow ? 'active' : 'inactive',
    float_mid_state: base.tank_mid ? 'active' : 'inactive',
    float_high_state: base.tank_full ? 'active' : 'inactive',
    light_on: variation.lightOn,
    pump_on: variation.pumpOn,
    pump_remaining_ms: pumpRemaining,
    stream: base.stream,
    raw_payload: {
      temp_c: temp,
      hum_pct: humidity,
      float_raw: floatRaw,
      light_on: variation.lightOn,
      pump_on: variation.pumpOn,
    },
  }
}

function getNestedValue(payload: Record<string, any>, path: string[]) {
  let current: any = payload
  for (const key of path) {
    if (!current || typeof current !== 'object' || !(key in current)) return undefined
    current = current[key]
  }
  return current
}

function toNullableBool(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 't', 'yes', 'y', 'on'].includes(normalized)) return true
    if (['0', 'false', 'f', 'no', 'n', 'off'].includes(normalized)) return false
  }
  return null
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value)
  return text === '' ? null : text
}

function buildDemoDashboard(code: string, metadata: Record<string, unknown> = {}, connectedAt?: string): ProjectGreenhouseDashboard {
  const definition = DEMO_GREENHOUSES[code]
  if (!definition) {
    throw new Error(`Codigo de invernadero no reconocido. Usa ${DEMO_GREENHOUSE_CODE} para pruebas.`)
  }

  const demoMetadata = {
    ...metadata,
    device_name: definition.deviceName,
    location: definition.location,
    timezone: definition.timezone,
    status: definition.status,
    note: definition.note,
    pairing_type: 'demo',
  }

  const telemetryHistory = TELEMETRY_VARIATIONS.map((variation) =>
    toTelemetryPoint(buildIsoMinutesAgo(variation.minutesAgo), definition.telemetryBase, variation)
  )

  const recentCommands: GreenhouseCommandItem[] = DEMO_COMMANDS.map((command) => {
    const createdAt = buildIsoMinutesAgo(command.minutesAgo)
    const completedAt = buildIsoMinutesAgo(command.minutesAgo - command.completedAfterMinutes)
    return {
      id: command.id,
      command_text: command.command_text,
      command_type: command.command_type,
      reason: command.reason,
      created_by: command.created_by,
      status: command.status,
      created_at: createdAt,
      completed_at: command.completedAfterMinutes >= 0 ? completedAt : null,
      result_payload: command.result_payload,
    }
  })

  return {
    greenhouseCode: definition.code,
    deviceName: String(demoMetadata.device_name),
    location: String(demoMetadata.location),
    timezone: String(demoMetadata.timezone),
    status: String(demoMetadata.status),
    lastSeenAt: buildIsoMinutesAgo(definition.lastSeenOffsetMinutes),
    connectedAt: connectedAt || new Date().toISOString(),
    isDemo: true,
    metadata: demoMetadata,
    latestTelemetry: telemetryHistory[0] || null,
    telemetryHistory,
    recentCommands,
  }
}

function mapTelemetryRow(row: any): GreenhouseTelemetryPoint {
  const rawPayload = row.raw_payload || {}
  const statusPayload = getNestedValue(rawPayload, ['status'])
  const arduinoPayload = getNestedValue(rawPayload, ['arduino']) || statusPayload || rawPayload
  const floatSwitches = getNestedValue(rawPayload, ['float_switches']) || {}
  const bridgeMac = getNestedValue(rawPayload, ['bridge', 'mac']) || getNestedValue(rawPayload, ['esp32', 'mac'])

  return {
    device_id: row.device_id ?? null,
    bridge_mac: typeof bridgeMac === 'string' ? normalizeBridgeMac(bridgeMac) : null,
    recorded_at: row.recorded_at,
    source: row.source,
    device_uptime_ms: row.device_uptime_ms ?? null,
    dht_ok: toNullableBool(row.dht_ok) ?? toNullableBool(arduinoPayload.dht_ok),
    temp_c:
      row.temp_c === null || row.temp_c === undefined
        ? arduinoPayload.temp_c === undefined
          ? null
          : Number(arduinoPayload.temp_c)
        : Number(row.temp_c),
    hum_pct:
      row.hum_pct === null || row.hum_pct === undefined
        ? arduinoPayload.hum_pct === undefined
          ? null
          : Number(arduinoPayload.hum_pct)
        : Number(row.hum_pct),
    float_raw: toNullableNumber(row.float_raw) ?? toNullableNumber(arduinoPayload.float_raw),
    float_state: toNullableString(row.float_state) ?? toNullableString(arduinoPayload.float_state),
    tank_low: toNullableBool(row.tank_low) ?? toNullableBool(arduinoPayload.tank_low) ?? toNullableBool(getNestedValue(floatSwitches, ['low', 'tank_low'])),
    tank_mid: toNullableBool(row.tank_mid) ?? toNullableBool(arduinoPayload.tank_mid) ?? toNullableBool(getNestedValue(floatSwitches, ['mid', 'active'])),
    tank_full: toNullableBool(row.tank_full) ?? toNullableBool(arduinoPayload.tank_full) ?? toNullableBool(getNestedValue(floatSwitches, ['high', 'active'])),
    tank_low_when: toNullableString(row.tank_low_when) ?? toNullableString(arduinoPayload.tank_low_when),
    float_low_raw: toNullableNumber(getNestedValue(floatSwitches, ['low', 'raw'])) ?? toNullableNumber(arduinoPayload.float_low_raw) ?? toNullableNumber(row.float_low_raw),
    float_mid_raw: toNullableNumber(getNestedValue(floatSwitches, ['mid', 'raw'])) ?? toNullableNumber(arduinoPayload.float_mid_raw) ?? toNullableNumber(row.float_mid_raw),
    float_high_raw: toNullableNumber(getNestedValue(floatSwitches, ['high', 'raw'])) ?? toNullableNumber(arduinoPayload.float_high_raw) ?? toNullableNumber(row.float_high_raw),
    float_low_state: toNullableString(getNestedValue(floatSwitches, ['low', 'state'])) ?? toNullableString(arduinoPayload.float_low_state) ?? toNullableString(row.float_low_state),
    float_mid_state: toNullableString(getNestedValue(floatSwitches, ['mid', 'state'])) ?? toNullableString(arduinoPayload.float_mid_state) ?? toNullableString(row.float_mid_state),
    float_high_state: toNullableString(getNestedValue(floatSwitches, ['high', 'state'])) ?? toNullableString(arduinoPayload.float_high_state) ?? toNullableString(row.float_high_state),
    light_on: toNullableBool(row.light_on) ?? toNullableBool(arduinoPayload.light_on),
    pump_on: toNullableBool(row.pump_on) ?? toNullableBool(arduinoPayload.pump_on),
    pump_remaining_ms: toNullableNumber(row.pump_remaining_ms) ?? toNullableNumber(arduinoPayload.pump_remaining_ms),
    stream: toNullableBool(row.stream) ?? toNullableBool(arduinoPayload.stream),
    raw_payload: rawPayload,
  }
}

function mapSetupError(error: any) {
  const message = String(error?.message || '')
  if (message.includes('project_greenhouse_integrations')) {
    return new Error('Falta la tabla de integracion del invernadero. Ejecuta supabase/greenhouse_schema.sql en Supabase.')
  }

  return error instanceof Error ? error : new Error('No se pudo cargar la integracion del invernadero.')
}

async function getIntegrationRow(projectId: string) {
  const { data, error } = await supabase
    .from('project_greenhouse_integrations')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw mapSetupError(error)

  return data as ProjectGreenhouseIntegrationRow | null
}

async function getTelemetryByBridgeMac(bridgeMac: string, limit: number) {
  const { data, error } = await supabase
    .from('greenhouse_telemetry')
    .select('*')
    .contains('raw_payload', { bridge: { mac: normalizeBridgeMac(bridgeMac) } })
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map(mapTelemetryRow)
}

async function updateIntegrationDevice(projectId: string, deviceId: string, metadata: Record<string, unknown>) {
  const { error } = await supabase
    .from('project_greenhouse_integrations')
    .update({
      device_id: deviceId,
      metadata,
    })
    .eq('project_id', projectId)

  if (error) throw mapSetupError(error)
}

export const greenhouseService = {
  getDemoGreenhouseCode() {
    return DEMO_GREENHOUSE_CODE
  },

  getProductionGreenhouseCode() {
    return PRODUCTION_GREENHOUSE_CODE
  },

  async getProjectDashboard(projectId: string): Promise<ProjectGreenhouseDashboard | null> {
    const integration = await getIntegrationRow(projectId)
    if (!integration) return null

    const bridgeMac =
      typeof integration.metadata?.bridge_mac === 'string' ? normalizeBridgeMac(String(integration.metadata.bridge_mac)) : null

    if (bridgeMac) {
      const telemetryHistory = await getTelemetryByBridgeMac(bridgeMac, 8)
      const latestTelemetry = telemetryHistory[0] || null
      const productionDefinition = PRODUCTION_GREENHOUSES[integration.greenhouse_code]
      const resolvedDeviceId = latestTelemetry?.device_id || integration.device_id
      const mergedMetadata = {
        ...(integration.metadata || {}),
        bridge_mac: bridgeMac,
      }

      if (latestTelemetry?.device_id && latestTelemetry.device_id !== integration.device_id) {
        await updateIntegrationDevice(projectId, latestTelemetry.device_id, mergedMetadata)
      }

      let deviceName = String(
        integration.metadata?.device_name ||
          productionDefinition?.deviceName ||
          'Invernadero conectado'
      )
      let location = String(
        integration.metadata?.location ||
          productionDefinition?.location ||
          ''
      )
      let timezone = String(
        integration.metadata?.timezone ||
          productionDefinition?.timezone ||
          'UTC'
      )
      let status = String(integration.metadata?.status || 'active')
      let lastSeenAt = latestTelemetry?.recorded_at || null
      let recentCommands: GreenhouseCommandItem[] = []

      if (resolvedDeviceId) {
        const [deviceResponse, commandsResponse] = await Promise.all([
          supabase
            .from('greenhouse_devices')
            .select('id, name, location, timezone, status, last_seen_at, metadata')
            .eq('id', resolvedDeviceId)
            .maybeSingle(),
          supabase
            .from('greenhouse_commands')
            .select('id, command_text, command_type, reason, created_by, status, created_at, completed_at, result_payload')
            .eq('device_id', resolvedDeviceId)
            .order('created_at', { ascending: false })
            .limit(6),
        ])

        if (deviceResponse.error) throw deviceResponse.error
        if (commandsResponse.error) throw commandsResponse.error

        const device = deviceResponse.data
        deviceName = device?.name || deviceName
        location = device?.location || location
        timezone = device?.timezone || timezone
        status = device?.status || status
        lastSeenAt = device?.last_seen_at || lastSeenAt
        recentCommands = (commandsResponse.data || []).map((command) => ({
          id: command.id,
          command_text: command.command_text,
          command_type: command.command_type,
          reason: command.reason,
          created_by: command.created_by,
          status: command.status,
          created_at: command.created_at,
          completed_at: command.completed_at,
          result_payload: command.result_payload || {},
        }))
      }

      return {
        greenhouseCode: integration.greenhouse_code,
        deviceName,
        location,
        timezone,
        status,
        lastSeenAt,
        connectedAt: integration.connected_at,
        isDemo: false,
        metadata: mergedMetadata,
        latestTelemetry,
        telemetryHistory,
        recentCommands,
      }
    }

    if (!integration.device_id) {
      return buildDemoDashboard(integration.greenhouse_code, integration.metadata || {}, integration.connected_at)
    }

    try {
      const [deviceResponse, telemetryResponse, commandsResponse] = await Promise.all([
        supabase
          .from('greenhouse_devices')
          .select('id, name, location, timezone, status, last_seen_at, metadata')
          .eq('id', integration.device_id)
          .maybeSingle(),
        supabase
          .from('greenhouse_telemetry')
          .select('*')
          .eq('device_id', integration.device_id)
          .order('recorded_at', { ascending: false })
          .limit(8),
        supabase
          .from('greenhouse_commands')
          .select('id, command_text, command_type, reason, created_by, status, created_at, completed_at, result_payload')
          .eq('device_id', integration.device_id)
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (deviceResponse.error) throw deviceResponse.error
      if (telemetryResponse.error) throw telemetryResponse.error
      if (commandsResponse.error) throw commandsResponse.error

      const telemetryHistory = (telemetryResponse.data || []).map(mapTelemetryRow)
      const device = deviceResponse.data

      return {
        greenhouseCode: integration.greenhouse_code,
        deviceName: device?.name || String(integration.metadata?.device_name || 'Invernadero conectado'),
        location: device?.location || String(integration.metadata?.location || ''),
        timezone: device?.timezone || String(integration.metadata?.timezone || 'UTC'),
        status: device?.status || String(integration.metadata?.status || 'active'),
        lastSeenAt: device?.last_seen_at || null,
        connectedAt: integration.connected_at,
        isDemo: false,
        metadata: integration.metadata || {},
        latestTelemetry: telemetryHistory[0] || null,
        telemetryHistory,
        recentCommands: (commandsResponse.data || []).map((command) => ({
          id: command.id,
          command_text: command.command_text,
          command_type: command.command_type,
          reason: command.reason,
          created_by: command.created_by,
          status: command.status,
          created_at: command.created_at,
          completed_at: command.completed_at,
          result_payload: command.result_payload || {},
        })),
      }
    } catch (error) {
      if (DEMO_GREENHOUSES[integration.greenhouse_code]) {
        return buildDemoDashboard(integration.greenhouse_code, integration.metadata || {}, integration.connected_at)
      }

      throw error
    }
  },

  async connectProject(projectId: string, greenhouseCode: string) {
    const normalizedCode = normalizeGreenhouseCode(greenhouseCode)
    const productionDefinition = PRODUCTION_GREENHOUSES[normalizedCode]
    const demoDefinition = DEMO_GREENHOUSES[normalizedCode]

    if (!productionDefinition && !demoDefinition) {
      const { error } = await supabase.rpc('connect_project_greenhouse_by_code', {
        target_project_id: projectId,
        target_greenhouse_code: normalizedCode,
      })

      if (error) {
        if (String(error.message || '').includes('connect_project_greenhouse_by_code')) {
          throw new Error('Falta instalar la funcion para enlazar codigos dinamicos. Ejecuta supabase/connect_greenhouse_by_code.sql en Supabase.')
        }

        throw new Error(error.message || `Codigo no reconocido: ${normalizedCode}`)
      }

      return this.getProjectDashboard(projectId)
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Usuario no autenticado')
    }

    const payload = productionDefinition
      ? {
          project_id: projectId,
          device_id: null,
          greenhouse_code: normalizedCode,
          connected_by: user.id,
          metadata: {
            device_name: productionDefinition.deviceName,
            location: productionDefinition.location,
            timezone: productionDefinition.timezone,
            status: 'active',
            note: productionDefinition.note,
            pairing_type: 'bridge-mac',
            bridge_mac: normalizeBridgeMac(productionDefinition.bridgeMac),
          },
          connected_at: new Date().toISOString(),
        }
      : {
          project_id: projectId,
          device_id: null,
          greenhouse_code: normalizedCode,
          connected_by: user.id,
          metadata: {
            device_name: demoDefinition!.deviceName,
            location: demoDefinition!.location,
            timezone: demoDefinition!.timezone,
            status: demoDefinition!.status,
            note: demoDefinition!.note,
            pairing_type: 'demo',
          },
          connected_at: new Date().toISOString(),
        }

    const { error } = await supabase
      .from('project_greenhouse_integrations')
      .upsert(payload, { onConflict: 'project_id' })

    if (error) throw mapSetupError(error)

    const dashboard = await this.getProjectDashboard(projectId)

    if (productionDefinition && (!dashboard || !dashboard.latestTelemetry)) {
      throw new Error(`No se encontraron lecturas de produccion para el bridge MAC ${productionDefinition.bridgeMac}.`)
    }

    return dashboard
  },

  async disconnectProject(projectId: string) {
    const { error } = await supabase
      .from('project_greenhouse_integrations')
      .delete()
      .eq('project_id', projectId)

    if (error) throw mapSetupError(error)
  },
}
