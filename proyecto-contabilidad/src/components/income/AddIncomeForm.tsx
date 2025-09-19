'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrendingUp, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { incomeService } from '@/lib/income'
import { projectsService, type ProjectMember } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import { incomeSchema, type IncomeFormData } from '@/lib/validations'

const INCOME_CATEGORIES = [
  'Ventas',
  'Servicios',
  'Inversión',
  'Consultoría',
  'Comisiones',
  'Intereses',
  'Dividendos',
  'Alquileres',
  'Otros'
]

interface AddIncomeFormProps {
  projectId: string
  onSuccess?: () => void
}

export function AddIncomeForm({ projectId, onSuccess }: AddIncomeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)

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
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [projectId])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      income_date: new Date().toISOString().split('T')[0],
    },
  })

  // Set current user as default when data loads
  const performedBy = watch('performed_by')
  const selectedCategory = watch('category')
  const [displayAmount, setDisplayAmount] = useState('')
  
  useEffect(() => {
    if (!performedBy && currentUser) {
      setValue('performed_by', currentUser)
    }
  }, [currentUser, performedBy, setValue, members])

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const onSubmit = async (data: IncomeFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const income = await incomeService.createIncome(projectId, {
        description: data.description,
        amount: Number(data.amount),
        category: data.category,
        income_date: data.income_date,
        performed_by: data.performed_by,
      })

      // Upload files if any
      if (files.length > 0) {
        setUploadingFiles(true)
        for (const file of files) {
          await incomeService.uploadIncomeFile(income.id, file)
        }
      }
      
      reset({
        income_date: new Date().toISOString().split('T')[0],
      })
      setFiles([])
      setDisplayAmount('')
      // Keep current user as default after reset
      if (currentUser) {
        setValue('performed_by', currentUser)
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el ingreso')
    } finally {
      setIsLoading(false)
      setUploadingFiles(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Agregar Ingreso
        </CardTitle>
        <CardDescription>
          Registra un nuevo ingreso para el proyecto
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                {INCOME_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-destructive text-center">{errors.category.message}</p>
              )}
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
              <label htmlFor="income_date" className="text-sm font-medium text-center block">
                Fecha *
              </label>
              <input
                id="income_date"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ 
                  textAlign: 'center',
                  paddingLeft: '40px',
                  paddingRight: '40px'
                }}
                {...register('income_date')}
              />
              {errors.income_date && (
                <p className="text-sm text-destructive text-center">{errors.income_date.message}</p>
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
                <p className="text-sm text-destructive">{errors.performed_by.message}</p>
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
                Descripción {selectedCategory === 'Otros' ? '*' : '(Opcional)'}
              </label>
              <textarea
                id="description"
                placeholder={selectedCategory === 'Otros' 
                  ? "Describe detalladamente el tipo de ingreso..." 
                  : "Describe el ingreso, fuente, detalles adicionales..."
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
            {uploadingFiles ? 'Subiendo archivos...' : 'Agregar Ingreso'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
