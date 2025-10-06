'use client'

import { useState } from 'react'
import { Trash2, Edit, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import { incomeService, type Income } from '@/lib/income'
import { formatCurrency } from '@/lib/currency'
import { permissions, type UserRole } from '@/lib/permissions'
import { useConfirm } from '@/hooks/useConfirm'

interface IncomeListProps {
  income: Income[]
  currentUserId: string
  userRole?: UserRole
  onUpdate?: () => void
}

export function IncomeList({ income, currentUserId, userRole = 'view', onUpdate }: IncomeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const confirmDialog = useConfirm()
  const { error: showError } = useToast()

  const handleDelete = async (incomeId: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Ingreso',
      message: '¿Estás seguro de que quieres eliminar este ingreso? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      setDeletingId(incomeId)
      await incomeService.deleteIncome(incomeId)
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting income:', error)
      showError('Error al eliminar el ingreso')
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg text-green-700 mb-1">
                  {formatCurrency(item.amount)}
                </CardTitle>
                <h4 className="font-semibold text-gray-900 break-words">{item.category || 'Sin categoría'}</h4>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1 break-words">{item.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(permissions.canDelete(userRole) || (item.user_id === currentUserId && permissions.canEdit(userRole))) && (
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
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                {item.status === 'approved' ? 'Aprobado' : 
                 item.status === 'pending' ? 'Pendiente' : 'Rechazado'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
              <span>
                <strong>Realizado por:</strong> {item.performed_user?.full_name || item.performed_user?.email || 'Usuario desconocido'}
              </span>
              <span>
                <strong>Registrado por:</strong> {item.user?.full_name || item.user?.email || 'Usuario desconocido'}
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
      
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        variant={confirmDialog.options.variant}
      />
    </div>
  )
}
