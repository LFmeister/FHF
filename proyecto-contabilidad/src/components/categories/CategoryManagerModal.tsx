'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, X, Eye, EyeOff, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { categoriesService, type CustomCategory, type CategoryType, type CategoryPreferences } from '@/lib/categories'
import { supabase } from '@/lib/supabase'

interface CategoryManagerModalProps {
  projectId: string
  type: CategoryType
  isOpen: boolean
  onClose: () => void
  onCategoriesUpdated?: () => void
}

export function CategoryManagerModal({ 
  projectId, 
  type,
  isOpen, 
  onClose, 
  onCategoriesUpdated 
}: CategoryManagerModalProps) {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [availableCategories, setAvailableCategories] = useState<{default: string[], custom: string[]}>({default: [], custom: []})
  const [preferences, setPreferences] = useState<CategoryPreferences | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, projectId, type])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [customCats, availableCats, userPrefs] = await Promise.all([
        categoriesService.getCustomCategories(projectId, type),
        categoriesService.getAllAvailableCategories(projectId, type),
        getCurrentUserPreferences()
      ])
      setCustomCategories(customCats)
      setAvailableCategories(availableCats)
      setPreferences(userPrefs)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentUserPreferences = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) {
        // Return default preferences if not authenticated
        return {
          id: '',
          project_id: projectId,
          user_id: '',
          type,
          hidden_categories: [],
          show_default_categories: true,
          created_at: '',
          updated_at: ''
        }
      }
      return await categoriesService.getUserPreferences(projectId, auth.user.id, type)
    } catch (err) {
      console.error('Error getting user preferences:', err)
      // Return default preferences on error
      return {
        id: '',
        project_id: projectId,
        user_id: '',
        type,
        hidden_categories: [],
        show_default_categories: true,
        created_at: '',
        updated_at: ''
      }
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      setError(null)
      await categoriesService.createCustomCategory(projectId, newCategoryName, type)
      setNewCategoryName('')
      await loadData()
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
      await loadData()
      onCategoriesUpdated?.()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar categoría')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleDefaultCategories = async () => {
    if (!preferences) return

    try {
      const newShowDefault = !preferences.show_default_categories
      await categoriesService.saveUserPreferences(
        projectId, 
        type, 
        preferences.hidden_categories, 
        newShowDefault
      )
      await loadData()
      onCategoriesUpdated?.()
    } catch (err: any) {
      setError(err.message || 'Error al guardar preferencias')
    }
  }

  const handleToggleCategoryVisibility = async (categoryName: string) => {
    if (!preferences) return

    try {
      const isHidden = preferences.hidden_categories.includes(categoryName)
      const newHiddenCategories = isHidden
        ? preferences.hidden_categories.filter(cat => cat !== categoryName)
        : [...preferences.hidden_categories, categoryName]

      await categoriesService.saveUserPreferences(
        projectId, 
        type, 
        newHiddenCategories, 
        preferences.show_default_categories
      )
      await loadData()
      onCategoriesUpdated?.()
    } catch (err: any) {
      setError(err.message || 'Error al guardar preferencias')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory()
    }
  }

  if (!isOpen) return null

  const typeLabel = type === 'income' ? 'Ingresos' : 'Gastos'
  const typeColor = type === 'income' ? 'text-green-600' : 'text-red-600'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Tag className={`h-5 w-5 ${typeColor}`} />
            <h2 className="text-lg font-semibold">Gestionar Categorías de {typeLabel}</h2>
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
                <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Configuración de Categorías</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowPreferences(!showPreferences)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showPreferences ? 'Ocultar' : 'Mostrar'} Preferencias
            </Button>
          </div>

          {showPreferences && preferences && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferencias de Visualización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle default categories */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">Categorías predeterminadas del sistema</p>
                    <p className="text-sm text-gray-500">
                      {preferences.show_default_categories 
                        ? 'Las categorías del sistema están visibles en el dropdown' 
                        : 'Las categorías del sistema están ocultas del dropdown'
                      }
                    </p>
                  </div>
                  <Button
                    variant={preferences.show_default_categories ? "primary" : "outline"}
                    size="sm"
                    onClick={handleToggleDefaultCategories}
                  >
                    {preferences.show_default_categories ? 'Ocultar todas' : 'Mostrar todas'}
                  </Button>
                </div>

                {/* Default categories visibility */}
                {preferences.show_default_categories && (
                  <div>
                    <h4 className="font-medium mb-3">Categorías Predeterminadas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableCategories.default.map((category) => {
                        const isHidden = preferences.hidden_categories.includes(category)
                        return (
                          <div
                            key={category}
                            className={`flex items-center justify-between p-2 border rounded-md ${
                              isHidden ? 'bg-gray-100' : 'bg-white'
                            }`}
                          >
                            <span className={`text-sm ${isHidden ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              {category}
                            </span>
                            <button
                              onClick={() => handleToggleCategoryVisibility(category)}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                isHidden 
                                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                              title={isHidden ? 'Mostrar categoría' : 'Ocultar categoría'}
                            >
                              {isHidden ? 'Mostrar' : 'Ocultar'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom categories */}
          <Card>
            <CardHeader>
              <CardTitle className={`text-base ${typeColor}`}>
                Categorías Personalizadas ({customCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500">
                Puedes ocultar categorías personalizadas sin eliminarlas. Las categorías ocultas no aparecerán en el dropdown.
              </p>
              {isLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  Cargando...
                </div>
              ) : customCategories.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  No hay categorías personalizadas
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {customCategories.map((category) => {
                    const isHidden = !!preferences && preferences.hidden_categories.includes(category.name)
                    return (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between p-2 border rounded-md ${isHidden ? 'bg-gray-100' : 'bg-gray-50'}`}
                      >
                        <span className={`text-sm ${isHidden ? 'line-through text-gray-500' : 'text-gray-800'}`}>{category.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleCategoryVisibility(category.name)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                              isHidden 
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                            title={isHidden ? 'Mostrar categoría' : 'Ocultar categoría'}
                          >
                            {isHidden ? 'Mostrar' : 'Ocultar'}
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={deletingId === category.id}
                            className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Eliminar categoría personalizada"
                          >
                            {deletingId === category.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-gray-500 text-center">
            Las preferencias se guardan automáticamente y solo afectan a tu vista del proyecto.
            Las categorías personalizadas son visibles para todos los miembros del proyecto.
          </div>
        </div>
      </div>
    </div>
  )
}
