'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { categoriesService, type CustomCategory, type CategoryType } from '@/lib/categories'

interface CustomCategoriesModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  onCategoriesUpdated?: () => void
}

export function CustomCategoriesModal({ 
  projectId, 
  isOpen, 
  onClose, 
  onCategoriesUpdated 
}: CustomCategoriesModalProps) {
  const [incomeCategories, setIncomeCategories] = useState<CustomCategory[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CustomCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedType, setSelectedType] = useState<CategoryType>('income')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen, projectId])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const [income, expense] = await Promise.all([
        categoriesService.getCustomCategories(projectId, 'income'),
        categoriesService.getCustomCategories(projectId, 'expense')
      ])
      setIncomeCategories(income)
      setExpenseCategories(expense)
    } catch (err: any) {
      setError(err.message || 'Error al cargar categorías')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      setError(null)
      await categoriesService.createCustomCategory(projectId, newCategoryName, selectedType)
      setNewCategoryName('')
      await loadCategories()
      onCategoriesUpdated?.()
    } catch (err: any) {
      setError(err.message || 'Error al crear categoría')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('¿Eliminar esta categoría? Esta acción no se puede deshacer.')) return

    try {
      setDeletingId(categoryId)
      await categoriesService.deleteCustomCategory(categoryId)
      await loadCategories()
      onCategoriesUpdated?.()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar categoría')
    } finally {
      setDeletingId(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Categorías Personalizadas</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Add new category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agregar Nueva Categoría</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Nombre de la categoría"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as CategoryType)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
                <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-green-600">
                  Categorías de Ingresos ({incomeCategories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Cargando...
                  </div>
                ) : incomeCategories.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No hay categorías personalizadas
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incomeCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <span className="text-sm">{category.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deletingId === category.id}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-600">
                  Categorías de Gastos ({expenseCategories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Cargando...
                  </div>
                ) : expenseCategories.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No hay categorías personalizadas
                  </div>
                ) : (
                  <div className="space-y-2">
                    {expenseCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <span className="text-sm">{category.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deletingId === category.id}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Las categorías personalizadas se combinan con las categorías predeterminadas del sistema.
            Solo puedes eliminar las categorías que hayas creado.
          </div>
        </div>
      </div>
    </div>
  )
}
