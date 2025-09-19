'use client'

import { PieChart, BarChart3, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface Income {
  amount: number
  category?: string | null
}

interface IncomeChartProps {
  income: Income[]
  totalIncome: number
}

export function IncomeChart({ income, totalIncome }: IncomeChartProps) {
  // Calculate income by category
  const incomeByCategory = income.reduce((acc, incomeItem) => {
    const category = incomeItem.category || 'Sin categoría'
    acc[category] = (acc[category] || 0) + incomeItem.amount
    return acc
  }, {} as Record<string, number>)

  const categories = Object.entries(incomeByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5) // Top 5 categories

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPercentage = (amount: number) => {
    return totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : '0'
  }

  const colors = [
    'bg-green-500',
    'bg-emerald-500', 
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Ingresos por Categoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay ingresos registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Simple bar chart */}
            <div className="space-y-3">
              {categories.map(([category, amount], index) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{category}</span>
                    <span className="text-gray-600">
                      {formatCurrency(amount)} ({getPercentage(amount)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[index % colors.length]}`}
                      style={{ width: `${getPercentage(amount)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
