'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { categoriesService, type CustomCategory, type CategoryType } from '@/lib/categories'
import { useLanguage } from '@/context/LanguageContext'

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
  const { t } = useLanguage()
  const tc = t.categories
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
      setError(err.message || tc.loadError)
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
      setError(err.message || tc.createError)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm(tc.confirmDelete)) return

    try {
      setDeletingId(categoryId)
      await categoriesService.deleteCustomCategory(categoryId)
      await loadCategories()
      onCategoriesUpdated?.()
    } catch (err: any) {
      setError(err.message || tc.deleteError)
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
            <h2 className="text-lg font-semibold">{tc.customCats}</h2>
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
              <CardTitle className="text-base">{tc.addNew}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder={tc.namePlaceholder}
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
                  <option value="income">{tc.incomeType}</option>
                  <option value="expense">{tc.expenseType}</option>
                </select>
                <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {tc.add}
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
                  {t.categories.incomeCatsTitle} ({incomeCategories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    {t.common.loading}
                  </div>
                ) : incomeCategories.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    {tc.noCustom}
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
                  {t.categories.expenseCatsTitle} ({expenseCategories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    {t.common.loading}
                  </div>
                ) : expenseCategories.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    {tc.noCustom}
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
            {t.categories.customFooter}
          </div>
        </div>
      </div>
    </div>
  )
}
