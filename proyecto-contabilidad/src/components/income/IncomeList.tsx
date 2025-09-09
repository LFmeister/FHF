'use client'

import { useState } from 'react'
import { Trash2, Edit, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { incomeService, type Income } from '@/lib/income'
import { formatCurrency } from '@/lib/currency'

interface IncomeListProps {
  income: Income[]
  currentUserId: string
  onUpdate?: () => void
}

export function IncomeList({ income, currentUserId, onUpdate }: IncomeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (incomeId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
      return
    }

    try {
      setDeletingId(incomeId)
      await incomeService.deleteIncome(incomeId)
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting income:', error)
      alert('Error al eliminar el ingreso')
    } finally {
      setDeletingId(null)
    }
  }

  if (income.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No hay ingresos registrados
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Agrega el primer ingreso para comenzar a llevar el control financiero del proyecto.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {income.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg text-green-700 mb-1">
                  {formatCurrency(item.amount)}
                </CardTitle>
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.user_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span>
                Fecha: {new Date(item.income_date).toLocaleDateString('es-CO')}
              </span>
              {item.category && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {item.category}
                </span>
              )}
              <span>
                Por: {item.user?.name || 'Usuario desconocido'}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                {item.status === 'approved' ? 'Aprobado' : 
                 item.status === 'pending' ? 'Pendiente' : 'Rechazado'}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Registrado: {new Date(item.created_at).toLocaleDateString('es-CO')} a las{' '}
              {new Date(item.created_at).toLocaleTimeString('es-CO', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
