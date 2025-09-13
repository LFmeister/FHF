'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { DollarSign, TrendingUp, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { type Balance } from '@/lib/balances'

interface BalanceAnalyticsChartProps {
  balances: Balance[]
}

export function BalanceAnalyticsChart({ balances }: BalanceAnalyticsChartProps) {
  // Mapa de usuarioId -> nombre para etiquetas
  const userIdToName = useMemo(() => {
    const map: Record<string, string> = {}
    balances.forEach((b) => {
      const label = b.performed_user?.full_name || b.performed_user?.email || 'Usuario desconocido'
      if (b.performed_by) {
        map[b.performed_by] = label
      }
    })
    return map
  }, [balances])

  const userIds = useMemo(() => Object.keys(userIdToName), [userIdToName])

  // Datos para gráfico de barras por usuario a lo largo del tiempo (por día)
  const timeUserData = useMemo(() => {
    // Agrupar por fecha (YYYY-MM-DD) y por usuario
    const byDate: Record<string, any> = {}

    const sorted = [...balances].sort((a, b) =>
      new Date(a.balance_date || a.created_at).getTime() - new Date(b.balance_date || b.created_at).getTime()
    )

    sorted.forEach((b) => {
      const iso = new Date(b.balance_date || b.created_at).toISOString().slice(0, 10)
      const label = new Date(b.balance_date || b.created_at).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
      })
      if (!byDate[iso]) {
        byDate[iso] = { date: label, fullDate: iso }
      }
      const key = b.performed_by
      if (key) {
        byDate[iso][key] = (byDate[iso][key] || 0) + b.amount
      }
    })

    // Ordenar por fecha
    const keys = Object.keys(byDate).sort()
    return keys.map((k) => byDate[k])
  }, [balances])

  // Datos para el gráfico por usuario
  const userBalanceData = useMemo(() => {
    const userTotals = balances.reduce((acc, balance) => {
      const userName = balance.performed_user?.full_name || balance.performed_user?.email || 'Usuario desconocido'
      acc[userName] = (acc[userName] || 0) + balance.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(userTotals).map(([name, total]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      fullName: name,
      total,
      count: balances.filter(b => 
        (b.performed_user?.full_name || b.performed_user?.email || 'Usuario desconocido') === name
      ).length
    }))
  }, [balances])

  // Colores para los gráficos
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

  const totalBalance = balances.reduce((sum, balance) => sum + balance.amount, 0)
  const averageBalance = balances.length > 0 ? totalBalance / balances.length : 0

  if (balances.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No hay balances registrados
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Agrega el primer balance para ver las gráficas de análisis.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Balance Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {balances.length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Promedio por Registro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${averageBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(averageBalance)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Por transacción
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {userBalanceData.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Han registrado balances
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras por usuario en el tiempo + Distribución Porcentual lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Balance por Usuario en el Tiempo
            </CardTitle>
            <CardDescription>
              Muestra los balances ingresados por usuario agrupados por fecha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart 
                data={timeUserData}
                margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Legend />
                {userIds.map((userId, index) => (
                  <Bar
                    key={userId}
                    dataKey={userId}
                    name={userIdToName[userId] || 'Usuario desconocido'}
                    stackId="a"
                    fill={colors[index % colors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Distribución Porcentual
            </CardTitle>
            <CardDescription>
              Porcentaje del balance total por usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userBalanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {userBalanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-semibold">{data.fullName}</p>
                          <p className="text-blue-600">
                            Total: {formatCurrency(data.total)}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {data.count} registro{data.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
