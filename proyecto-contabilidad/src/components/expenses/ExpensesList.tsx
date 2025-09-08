'use client'

import { useState } from 'react'
import { Trash2, Download, Eye, Calendar, User, Tag, Paperclip, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { FilePreviewModal } from '@/components/ui/FilePreviewModal'
import { expensesService, type Expense } from '@/lib/expenses'

interface ExpensesListProps {
  expenses: Expense[]
  currentUserId: string
  onUpdate?: () => void
}

export function ExpensesList({ expenses, currentUserId, onUpdate }: ExpensesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<{
    id: string
    file_name: string
    file_path: string
    file_type: string
    file_size: number
  } | null>(null)

  const handleDelete = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return

    setDeletingId(expenseId)
    try {
      await expensesService.deleteExpense(expenseId)
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Error al eliminar el gasto')
    } finally {
      setDeletingId(null)
    }
  }

  const handleFileDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await expensesService.getFileUrl(filePath)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error al descargar el archivo')
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊'
    return '📎'
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay gastos registrados
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando el primer gasto del proyecto.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-4">
      {/* Total Expenses Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Total de Gastos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Suma de todos los gastos registrados
          </p>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Gastos</CardTitle>
          <CardDescription>
            Todos los gastos registrados en el proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-lg font-semibold text-red-600">
                        {formatCurrency(expense.amount)}
                      </div>
                      {expense.category && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          <Tag className="h-3 w-3" />
                          {expense.category}
                        </div>
                      )}
                      {expense.expense_files && expense.expense_files.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-xs">{expense.expense_files.length}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{expense.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {expense.user?.full_name || expense.user?.email || 'Usuario desconocido'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(expense.created_at)}</span>
                      </div>
                    </div>

                    {/* Files Section */}
                    {expense.expense_files && expense.expense_files.length > 0 && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedExpense(
                            expandedExpense === expense.id ? null : expense.id
                          )}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {expandedExpense === expense.id ? 'Ocultar' : 'Ver'} archivos ({expense.expense_files.length})
                        </Button>
                        
                        {expandedExpense === expense.id && (
                          <div className="mt-2 space-y-2">
                            {expense.expense_files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-2 bg-gray-100 rounded text-sm hover:bg-gray-200 transition-colors"
                              >
                                <div 
                                  className="flex items-center gap-2 flex-1 cursor-pointer"
                                  onClick={() => setPreviewFile({
                                    id: file.id,
                                    file_name: file.file_name,
                                    file_path: file.file_path,
                                    file_type: file.file_type,
                                    file_size: file.file_size
                                  })}
                                >
                                  <span>{getFileIcon(file.file_type)}</span>
                                  <div>
                                    <p className="font-medium text-blue-600 hover:text-blue-800">
                                      {file.file_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewFile({
                                      id: file.id,
                                      file_name: file.file_name,
                                      file_path: file.file_path,
                                      file_type: file.file_type,
                                      file_size: file.file_size
                                    })}
                                    title="Vista previa"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileDownload(file.file_path, file.file_name)}
                                    title="Descargar"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {expense.created_by === currentUserId && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  )
}
