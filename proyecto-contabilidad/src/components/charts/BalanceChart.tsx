'use client'

import { TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface Balance {
  created_at: string
  amount: number
  description?: string | null
}

interface Expense {
  created_at: string
  amount: number
  description: string
  category?: string | null
}

interface BalanceChartProps {
  balances: Balance[]
  expenses: Expense[]
}

export function BalanceChart({ balances, expenses }: BalanceChartProps) {
  // Create timeline data
  const allTransactions = [
    ...balances.map(b => ({ 
      date: new Date(b.created_at), 
      amount: b.amount, 
      type: 'balance',
      description: b.description || 'Balance agregado'
    })),
    ...expenses.map(e => ({ 
      date: new Date(e.created_at), 
      amount: -e.amount, 
      type: 'expense',
      description: e.description
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  // Calculate current balance
  const totalBalances = balances.reduce((sum, balance) => sum + balance.amount, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const currentBalance = totalBalances - totalExpenses

  // Calculate running balance
  let runningBalance = 0
  const timelineData = allTransactions.map(transaction => {
    runningBalance += transaction.amount
    return {
      ...transaction,
      runningBalance
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    })
  }

  const maxBalance = Math.max(...timelineData.map(d => Math.abs(d.runningBalance)), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolución del Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timelineData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut chart representation */}
            <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
              <div className="flex items-center justify-center h-full">
                <div className="relative">
                  {/* Donut Chart SVG */}
                  <svg width="200" height="200" className="transform -rotate-90">
                    <defs>
                      <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                    </defs>
                    
                    {/* Background circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="20"
                    />
                    
                    {totalBalances > 0 && (
                      <>
                        {/* Balance arc */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="url(#balanceGradient)"
                          strokeWidth="20"
                          strokeLinecap="round"
                          strokeDasharray={`${(totalBalances / (totalBalances + totalExpenses)) * 502.65} 502.65`}
                          className="transition-all duration-1000 ease-out"
                        />
                        
                        {/* Expense arc */}
                        {totalExpenses > 0 && (
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="url(#expenseGradient)"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={`${(totalExpenses / (totalBalances + totalExpenses)) * 502.65} 502.65`}
                            strokeDashoffset={`-${(totalBalances / (totalBalances + totalExpenses)) * 502.65}`}
                            className="transition-all duration-1000 ease-out"
                          />
                        )}
                      </>
                    )}
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Balance Final</div>
                      <div className={`text-xl font-bold ${
                        currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(currentBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-400"></div>
                    <div className="text-sm">
                      <span className="text-gray-600">Ingresos: </span>
                      <span className="font-medium text-green-600">{formatCurrency(totalBalances)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-400"></div>
                    <div className="text-sm">
                      <span className="text-gray-600">Gastos: </span>
                      <span className="font-medium text-red-600">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Transacciones Recientes</h4>
              {timelineData.slice(-5).reverse().map((data, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      data.type === 'balance' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{data.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(data.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      data.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.amount >= 0 ? '+' : ''}{formatCurrency(data.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: {formatCurrency(data.runningBalance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
