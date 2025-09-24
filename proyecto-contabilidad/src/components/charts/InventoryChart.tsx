'use client'

import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Boxes, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

interface InventoryItem {
  id: string
  name: string
  unit_value: number | null
  qty_bodega: number
  qty_uso: number
  qty_gastado: number
}

interface InventoryChartProps {
  items: InventoryItem[]
  showSummary?: boolean
  showCharts?: boolean
}

export function InventoryChart({ items, showSummary = true, showCharts = true }: InventoryChartProps) {
  // Calcular datos para las gráficas
  const chartData = useMemo(() => {
    if (!items || items.length === 0) return null

    // Calcular valores por estado
    let totalBodega = 0
    let totalUso = 0
    let totalGastado = 0
    let itemsWithValue = 0
    let itemsWithoutValue = 0

    // Top items por valor
    const itemsWithValueData = items
      .filter(item => item.unit_value && item.unit_value > 0)
      .map(item => {
        const stockQty = item.qty_bodega + item.qty_uso
        const totalValue = (item.unit_value || 0) * stockQty
        
        totalBodega += (item.unit_value || 0) * item.qty_bodega
        totalUso += (item.unit_value || 0) * item.qty_uso
        totalGastado += (item.unit_value || 0) * item.qty_gastado
        
        return {
          name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
          fullName: item.name,
          value: totalValue,
          unitValue: item.unit_value,
          stock: stockQty,
          bodega: item.qty_bodega,
          uso: item.qty_uso,
          gastado: item.qty_gastado
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 items

    // Contar items con y sin valor
    items.forEach(item => {
      if (item.unit_value && item.unit_value > 0) {
        itemsWithValue++
      } else {
        itemsWithoutValue++
      }
    })

    // Datos para gráfica de estados (pie chart)
    const stateData = [
      { name: 'En Bodega', value: totalBodega, color: '#10B981', count: items.reduce((sum, item) => sum + item.qty_bodega, 0) },
      { name: 'En Uso', value: totalUso, color: '#3B82F6', count: items.reduce((sum, item) => sum + item.qty_uso, 0) },
      { name: 'Gastado', value: totalGastado, color: '#EF4444', count: items.reduce((sum, item) => sum + item.qty_gastado, 0) }
    ].filter(item => item.value > 0)

    // Datos para gráfica de valoración
    const valuationData = [
      { name: 'Con Valor', value: itemsWithValue, color: '#10B981' },
      { name: 'Sin Valor', value: itemsWithoutValue, color: '#9CA3AF' }
    ].filter(item => item.value > 0)

    const totalValue = totalBodega + totalUso + totalGastado
    const stockValue = totalBodega + totalUso // Solo stock disponible

    return {
      stateData,
      valuationData,
      itemsWithValueData,
      totalValue,
      stockValue,
      totalItems: items.length,
      itemsWithValue,
      itemsWithoutValue
    }
  }, [items])

  if (!chartData || items.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-gray-400" />
              Valor del Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay items en el inventario</p>
              <p className="text-sm">Agrega productos para ver las estadísticas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName || label}</p>
          <p className="text-sm text-gray-600">
            Valor Total: <span className="font-medium text-green-600">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Stock: {data.stock} unidades
          </p>
          <p className="text-sm text-gray-600">
            Valor Unitario: {formatCurrency(data.unitValue)}
          </p>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Valor: <span className="font-medium" style={{ color: data.color }}>{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Cantidad: {data.count} unidades
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen del inventario */}
      {showSummary && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Valor Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(chartData.stockValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Bodega + En Uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-blue-600" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {chartData.totalItems}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Productos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              Con Valor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {chartData.itemsWithValue}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((chartData.itemsWithValue / chartData.totalItems) * 100)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Sin Valor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {chartData.itemsWithoutValue}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Requieren valoración
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Gráficas */}
      {showCharts && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Distribución por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-blue-600" />
              Distribución de Valor por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.stateData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.stateData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.stateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend 
                      formatter={(value, entry: any) => (
                        <span style={{ color: entry.color }}>
                          {value}: {formatCurrency(entry.payload.value)}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                <Boxes className="h-10 w-10 mb-2 text-gray-400" />
                <p className="font-medium">Sin valoración por estado</p>
                <p className="text-sm">Aún no has ingresado valores unitarios</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Items por Valor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Items con Mayor Valor en Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.itemsWithValueData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.itemsWithValueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                <TrendingUp className="h-10 w-10 mb-2 text-gray-400" />
                <p className="font-medium">Sin productos valorados</p>
                <p className="text-sm">Asigna valores unitarios para ver el top</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  )
}
