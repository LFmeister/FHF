'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Receipt, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
// import { useToast } from '@/components/ui/Toast'
import { expensesService } from '@/lib/expenses'
import { projectsService, type ProjectMember } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import { expenseSchema, type ExpenseFormData } from '@/lib/validations'
import { categoriesService } from '@/lib/categories'
import { CategoryManagerModal } from '@/components/categories/CategoryManagerModal'

interface AddExpenseFormProps {
  projectId: string
  onSuccess?: () => void
}


export function AddExpenseForm({ projectId, onSuccess }: AddExpenseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  // Success toast is handled by parent after closing the form

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUser(user.id)
        }

        // Get project members
        const membersData = await projectsService.getProjectMembers(projectId)
        setMembers(membersData)

        // Get project categories (default + custom)
        const categoriesData = await categoriesService.getProjectCategories(projectId, 'expense')
        setCategories(categoriesData)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [projectId])

  const handleCategoriesUpdated = async () => {
    try {
      const categoriesData = await categoriesService.getProjectCategories(projectId, 'expense')
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error reloading categories:', error)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
    getValues,
    watch,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0],
    },
  })

  // Watch category for dynamic description requirement
  const selectedCategory = watch('category')
  const [displayAmount, setDisplayAmount] = useState('')

  // Set current user as default when data loads
  useEffect(() => {
    const currentVal = getValues('performed_by')
    if (currentUser && (!currentVal || currentVal === '')) {
      setValue('performed_by', currentUser, { shouldValidate: true })
    }
    // Always ensure today's date is set
    setValue('expense_date', new Date().toISOString().split('T')[0])
  }, [currentUser, getValues, setValue])

  // Format number with thousands separator
  const formatNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '')
    
    // Add thousands separator (dot) for Colombian peso format
    if (numbers.length > 3) {
      return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }
    return numbers
  }

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formattedValue = formatNumber(inputValue)
    setDisplayAmount(formattedValue)
    
    // Convert back to number for form validation
    const numericValue = parseInt(formattedValue.replace(/\./g, '')) || 0
    setValue('amount', numericValue, { shouldValidate: true })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ExpenseFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Create expense
      const expense = await expensesService.createExpense(
        projectId,
        {
          amount: Number(data.amount),
          description: data.description || '',
          category: data.category,
          expense_date: data.expense_date,
          performed_by: data.performed_by
        }
      )

      // Upload files if any
      if (files.length > 0) {
        setUploadingFiles(true)
        for (const file of files) {
          await expensesService.uploadExpenseFile(expense.id, file)
        }
      }
      reset({
        expense_date: new Date().toISOString().split('T')[0],
      })
      setFiles([])
      setDisplayAmount('')
      // Keep current user as default after reset
      if (currentUser) {
        setValue('performed_by', currentUser, { shouldValidate: true })
      }
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Error al agregar el gasto')
    } finally {
      setIsLoading(false)
      setUploadingFiles(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Agregar Gasto
        </CardTitle>
        <CardDescription>
          Registra un nuevo gasto con documentos de respaldo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Categoría, Monto, Fecha, Realizado por y Registrado por */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-center block">
                Categoría *
              </label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('category')}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-destructive text-center">{errors.category.message}</p>
              )}
              <button
                type="button"
                onClick={() => setShowCategoriesModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Gestionar categorías
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-center block">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
                <input
                  id="amount"
                  type="text"
                  placeholder="100.000"
                  className="flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    textAlign: 'center',
                    paddingLeft: '32px',
                    paddingRight: '32px'
                  }}
                  value={displayAmount}
                  onChange={handleAmountChange}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Formato automático (ej: 100.000)
              </p>
              {errors.amount && (
                <p className="text-sm text-destructive text-center">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="expense_date" className="text-sm font-medium text-center block">
                Fecha *
              </label>
              <input
                id="expense_date"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ 
                  textAlign: 'center',
                  paddingLeft: '40px',
                  paddingRight: '40px'
                }}
                {...register('expense_date')}
              />
              {errors.expense_date && (
                <p className="text-sm text-destructive text-center">{errors.expense_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="performed_by" className="text-sm font-medium text-center block">
                Realizado por *
              </label>
              <Controller
                name="performed_by"
                control={control}
                render={({ field }) => (
                  <select
                    id="performed_by"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={(field.value && field.value !== '') ? field.value : (currentUser || '')}
                    onChange={field.onChange}
                  >
                    <option value="">Seleccionar usuario</option>
                    {currentUser && !members.some(m => m.user_id === currentUser) && (
                      <option value={currentUser}>Tú</option>
                    )}
                    {members.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.user?.full_name || member.user?.email || 'Sin nombre'}
                        {member.user_id === currentUser && ' (Tú)'}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.performed_by && (
                <p className="text-sm text-destructive text-center">{errors.performed_by.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 text-center block">
                Registrado por
              </label>
              <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-600 items-center justify-center">
                {members.find(m => m.user_id === currentUser)?.user?.full_name || 
                 members.find(m => m.user_id === currentUser)?.user?.email || 
                 'Usuario actual'}
              </div>
            </div>
          </div>

          {/* Descripción y Documentos de respaldo lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Descripción */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-center block">
                Descripción *
              </label>
              <textarea
                id="description"
                placeholder={selectedCategory === 'Otros' 
                  ? "Describe detalladamente el tipo de gasto..." 
                  : "Describe el gasto realizado, proveedor, detalles del producto o servicio..."
                }
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm text-center ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive text-center">{errors.description.message}</p>
              )}
            </div>

            {/* Documentos de respaldo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-center block">
                Documentos de respaldo
              </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="files" className="cursor-pointer">
                    <span className="text-sm text-primary hover:underline">
                      Seleccionar archivos
                    </span>
                    <input
                      id="files"
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Imágenes, videos, PDF, Word, Excel
                </p>
              </div>
            </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Archivos seleccionados:</p>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            loading={isLoading || uploadingFiles}
          >
            {uploadingFiles ? 'Subiendo archivos...' : 'Agregar Gasto'}
          </Button>
        </form>
      </CardContent>
    </Card>

    {/* Category Manager Modal */}
    <CategoryManagerModal
      projectId={projectId}
      type="expense"
      isOpen={showCategoriesModal}
      onClose={() => setShowCategoriesModal(false)}
      onCategoriesUpdated={handleCategoriesUpdated}
    />
    </>
  )
}
