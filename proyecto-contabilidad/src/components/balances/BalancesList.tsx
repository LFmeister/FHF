'use client'

import { useState } from 'react'
import { Trash2, Edit, DollarSign, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { balancesService, type Balance } from '@/lib/balances'
import { permissions, type UserRole } from '@/lib/permissions'

interface BalancesListProps {
  balances: Balance[]
  currentUserId: string
  userRole?: UserRole
  onUpdate?: () => void
}

export function BalancesList({ balances, currentUserId, userRole = 'view', onUpdate }: BalancesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (balanceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este balance?')) return

    setDeletingId(balanceId)
    try {
      await balancesService.deleteBalance(balanceId)
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting balance:', error)
      alert('Error al eliminar el balance')
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('es-CO').format(amount)} COP`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay balances registrados
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando un balance inicial al proyecto.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalBalance = balances.reduce((sum, balance) => sum + balance.amount, 0)

  return (
    <div className="space-y-4">
      {/* Total Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Balance Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Suma de todos los balances registrados
          </p>
        </CardContent>
      </Card>

      {/* Balances List */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Balances</CardTitle>
          <CardDescription>
            Todos los balances registrados en el proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {balances.map((balance) => (
              <div
                key={balance.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(balance.amount)}
                    </div>
                    {balance.description && (
                      <div className="text-sm text-gray-600">
                        {balance.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(balance.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                    <span>
                      <strong>Realizado por:</strong> {balance.performed_user?.full_name || balance.performed_user?.email || 'Usuario desconocido'}
                    </span>
                    <span>
                      <strong>Registrado por:</strong> {balance.user?.full_name || balance.user?.email || 'Usuario desconocido'}
                    </span>
                  </div>
                </div>

                {(permissions.canDelete(userRole) || (balance.created_by === currentUserId && permissions.canEdit(userRole))) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(balance.id)}
                      disabled={deletingId === balance.id}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
